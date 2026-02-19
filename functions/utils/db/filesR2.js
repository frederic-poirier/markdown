const basePath = (userId) => `users/${userId}/files`;
const fileKey = (userId, id) => `${basePath(userId)}/${id}.json`;
const computeContentSize = (content) => new TextEncoder().encode(content).length;

async function hashContent(content) {
    const bytes = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
}

async function readJson(bucket, key) {
    const object = await bucket.get(key);
    if (!object) return null;
    return await object.json();
}

async function writeJson(bucket, key, value) {
    await bucket.put(key, JSON.stringify(value), {
        httpMetadata: { contentType: 'application/json' }
    });
}

const ensureDb = (db) => {
    if (!db) throw new Error('DB binding is missing');
}


async function upsertFileIndex(db, userId, id, name, size, r2Key, now) {
    await db.prepare(`
        INSERT INTO files_index (user_id, file_id, name, size, r2_key, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, file_id) DO UPDATE SET
            name = excluded.name,
            size = excluded.size,
            r2_key = excluded.r2_key,
            updated_at = excluded.updated_at
    `)
        .bind(userId, id, name, size, r2Key, now, now)
        .run();
}

function normalizeMode(file) {
    const sourceFormat = typeof file?.sourceFormat === 'string' && file.sourceFormat.trim().length > 0
        ? file.sourceFormat.trim().toLowerCase()
        : 'plain';
    const renderMode = file?.renderMode === 'code' || file?.renderMode === 'media'
        ? file.renderMode
        : 'text';

    return { sourceFormat, renderMode };
}

export async function addFile(db, bucket, userId, file) {
    ensureDb(db);

    const content = typeof file.content === 'string' ? file.content : '';
    if (content.trim().length === 0) throw new Error('content is required');

    const id = file.id || await hashContent(content);
    const mode = normalizeMode(file);

    const alreadyExist = await getFile(bucket, userId, id);
    if (alreadyExist) {
        const now = Date.now();
        const normalizedName =
            typeof file.name === 'string' && file.name.trim().length > 0
                ? file.name
                : alreadyExist.name;

        const hasStoredContent =
            typeof alreadyExist.content === 'string' && alreadyExist.content.trim().length > 0;
        const normalizedContent = hasStoredContent ? alreadyExist.content : content;

        if (!hasStoredContent || alreadyExist.name !== normalizedName) {
            await writeJson(bucket, fileKey(userId, id), {
                ...alreadyExist,
                id,
                name: normalizedName,
                content: normalizedContent,
                sourceFormat: alreadyExist.sourceFormat || mode.sourceFormat,
                renderMode: alreadyExist.renderMode || mode.renderMode,
                updatedAt: now
            });
        }

        await upsertFileIndex(
            db,
            userId,
            id,
            normalizedName,
            computeContentSize(normalizedContent),
            fileKey(userId, id),
            now
        );

        return { id, alreadyExist: true };
    }

    const now = Date.now();
    const size = computeContentSize(content);

    const r2Key = fileKey(userId, id);
    const entry = {
        id,
        name: file.name,
        content,
        sourceFormat: mode.sourceFormat,
        renderMode: mode.renderMode,
        createdAt: now,
        updatedAt: now
    };

    await writeJson(bucket, r2Key, entry);
    await upsertFileIndex(db, userId, id, file.name, size, r2Key, now);

    return { id, alreadyExist: false };
}

export async function getFile(bucket, userId, id) {
    return await readJson(bucket, fileKey(userId, id));
}

export async function removeFile(db, bucket, userId, id) {
    ensureDb(db);

    await bucket.delete(fileKey(userId, id));

    await db.prepare('DELETE FROM files_index WHERE user_id = ? AND file_id = ?')
        .bind(userId, id)
        .run();
}

export async function getFilesMetadata(db, userId) {
    ensureDb(db);

    try {
        const result = await db.prepare(`
            SELECT
                file_id AS id,
                name,
                size,
                created_at AS createdAt,
                updated_at AS updatedAt
            FROM files_index
            WHERE user_id = ?
            ORDER BY updated_at DESC
        `)
            .bind(userId)
            .all();

        return result.results || [];
    } catch (error) {
        console.error('filesR2.getFilesMetadata D1 query error', {
            userId,
            error: error instanceof Error
                ? { name: error.name, message: error.message, stack: error.stack }
                : error
        });

        throw new Error('Failed to fetch file metadata', { cause: error });
    }
}
