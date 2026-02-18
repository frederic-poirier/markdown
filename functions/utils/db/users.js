export const addUser = async (uid, email, name, now, env) => {
    if (!env.DB) {
        console.log('DB not configured, skipping user persistence');
        return;
    }

    await env.DB.prepare(`
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

