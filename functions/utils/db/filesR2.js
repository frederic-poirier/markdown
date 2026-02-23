const basePath = (userId) => `${userId}`;
const fileKey = (userId, id) => `${basePath(userId)}/${id}`;

function getExtensionFromName(name) {
  if (typeof name !== "string") return "";
  const trimmed = name.trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot < 0 || lastDot === trimmed.length - 1) return "";
  return trimmed.slice(lastDot + 1).toLowerCase();
}

async function sha256Hex(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function computeContentSize(content) {
  return new TextEncoder().encode(content).length;
}

function ensureDb(db) {
  if (!db) throw new Error("DB binding is missing");
}
function ensureBucket(bucket) {
  if (!bucket) throw new Error("R2 binding is missing");
}

function normalizeName(name) {
  return typeof name === "string" ? name.trim() : "";
}

function normalizeContent(content) {
  return typeof content === "string" ? content : "";
}

async function readText(bucket, key) {
  const object = await bucket.get(key);
  if (!object) return null;
  return await object.text();
}

async function writeText(bucket, key, value) {
  await bucket.put(key, value, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
  });
}

async function deleteText(bucket, key) {
  await bucket.delete(key);
}

async function getFileMetadata(db, userId, id) {
  ensureDb(db);

  const row = await db
    .prepare(
      `
      SELECT
        user_id AS userId,
        file_id AS id,
        name,
        size,
        content_hash AS contentHash,
        r2_key AS r2Key,
        extension,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM files_index
      WHERE user_id = ? AND file_id = ?
      LIMIT 1
    `
    )
    .bind(userId, id)
    .first();

  return row || null;
}

async function getFileMetadataByHash(db, userId, contentHash) {
  ensureDb(db);

  const row = await db
    .prepare(
      `
      SELECT
        user_id AS userId,
        file_id AS id,
        name,
        size,
        content_hash AS contentHash,
        r2_key AS r2Key,
        extension,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM files_index
      WHERE user_id = ? AND content_hash = ?
      LIMIT 1
    `
    )
    .bind(userId, contentHash)
    .first();

  return row || null;
}

async function listFilesMetadata(db, userId) {
  ensureDb(db);

  const result = await db
    .prepare(
      `
      SELECT
        file_id AS id,
        name,
        size,
        content_hash AS contentHash,
        extension,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM files_index
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `
    )
    .bind(userId)
    .all();

  return result.results || [];
}

async function insertFileIndex(
  db,
  { userId, id, name, size, contentHash, r2Key, extension, now }
) {
  ensureDb(db);

  await db
    .prepare(
      `
      INSERT INTO files_index (
        user_id, file_id, name, size, content_hash, r2_key, extension, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(userId, id, name, size, contentHash, r2Key, extension, now, now)
    .run();
}

async function updateFileIndex(
  db,
  { userId, id, name, size, contentHash, r2Key, extension, now }
) {
  ensureDb(db);

  await db
    .prepare(
      `
      UPDATE files_index
      SET
        name = ?,
        size = ?,
        content_hash = ?,
        r2_key = ?,
        extension = ?,
        updated_at = ?
      WHERE user_id = ? AND file_id = ?
    `
    )
    .bind(name, size, contentHash, r2Key, extension, now, userId, id)
    .run();
}

/**
 * createFile
 * - generates a UUID id (file identity)
 * - writes R2 content
 * - inserts D1 metadata (create-only)
 * - compensates by deleting R2 if D1 insert fails
 */
export async function createFile(db, bucket, userId, input) {
  ensureDb(db);
  ensureBucket(bucket);

  const name = normalizeName(input?.name);
  const content = normalizeContent(input?.content);

  if (!name) throw new Error("name is required");
  if (!content.trim()) throw new Error("content is required");

  const id = crypto.randomUUID();
  const r2Key = fileKey(userId, id);

  const now = Date.now();
  const contentHash = await sha256Hex(content);
  const size = computeContentSize(content);
  const extension = getExtensionFromName(name);

  const existing = await getFileMetadataByHash(db, userId, contentHash);
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      size: existing.size,
      contentHash: existing.contentHash,
      extension: existing.extension,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
      alreadyExist: true,
    };
  }

  await writeText(bucket, r2Key, content);

  try {
    await insertFileIndex(db, {
      userId,
      id,
      name,
      size,
      contentHash,
      r2Key,
      extension,
      now,
    });
  } catch (e) {
    // avoid orphan content if D1 fails
    try {
      await deleteText(bucket, r2Key);
    } catch {
      // ignore cleanup error; original error is more important
    }
    throw e;
  }

  return {
    id,
    name,
    size,
    contentHash,
    extension,
    createdAt: now,
    updatedAt: now,
    alreadyExist: false,
  };
}

/**
 * updateFile
 * - updates content in R2 (and recompute hash/size)
 * - updates metadata in D1
 * - if file doesn't exist -> returns null (caller can return 404)
 */
export async function updateFile(db, bucket, userId, id, patch) {
  ensureDb(db);
  ensureBucket(bucket);

  const existing = await getFileMetadata(db, userId, id);
  if (!existing) return null;

  const name = patch?.name != null ? normalizeName(patch.name) : existing.name;
  const content = patch?.content != null ? normalizeContent(patch.content) : null;

  if (!name) throw new Error("name is required");

  const extension = getExtensionFromName(name);

  const now = Date.now();

  // If content is provided, update R2 + hash/size. Otherwise metadata-only update.
  let nextHash = existing.contentHash;
  let nextSize = existing.size;
  const r2Key = existing.r2Key || fileKey(userId, id);

  if (content != null) {
    if (!content.trim()) throw new Error("content is required");
    nextHash = await sha256Hex(content);
    nextSize = computeContentSize(content);
    await writeText(bucket, r2Key, content);
  }

  await updateFileIndex(db, {
    userId,
    id,
    name,
    size: nextSize,
    contentHash: nextHash,
    r2Key,
    extension,
    now,
  });

  return {
    id,
    name,
    size: nextSize,
    contentHash: nextHash,
    extension,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
}

export async function getFile(db, bucket, userId, id) {
  ensureDb(db);
  ensureBucket(bucket);

  const metadata = await getFileMetadata(db, userId, id);
  if (!metadata) return null;

  const content = await readText(bucket, metadata.r2Key);
  if (content === null) return null;

  return {
    id: metadata.id,
    name: metadata.name,
    content,
    contentHash: metadata.contentHash,
    extension: metadata.extension,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
}

export async function deleteFile(db, bucket, userId, id) {
  ensureDb(db);
  ensureBucket(bucket);

  const metadata = await getFileMetadata(db, userId, id);
  if (!metadata) return false;

  // Best-effort delete R2 then D1. Either order is acceptable; this avoids leaving content.
  await deleteText(bucket, metadata.r2Key);

  await db
    .prepare("DELETE FROM files_index WHERE user_id = ? AND file_id = ?")
    .bind(userId, id)
    .run();

  return true;
}

export async function getFilesMetadata(db, userId) {
  return await listFilesMetadata(db, userId);
}
