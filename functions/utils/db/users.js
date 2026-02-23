export const addUser = async (uid, email, name, env) => {
  const db = env.texte_d1 || env.DB;
  if (!db) {
    console.log('DB not configured, skipping user persistence');
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  await db.prepare(`
        INSERT INTO users (id, email, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            email = excluded.email,
            name = excluded.name,
            updated_at = excluded.updated_at
    `)
    .bind(uid, email, name, now, now)
    .run();
};
