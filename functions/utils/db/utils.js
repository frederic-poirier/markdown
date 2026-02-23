export function requireDb(env, headers) {
  const db = env.texte_d1 || env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "texte_d1 binding is missing" }), {
      status: 500,
      headers,
    });
  }
  return db;
}

export function requireBucket(env, headers) {
  const bucket = env.texte_r2 || env.BUCKET;
  if (!bucket) {
    return new Response(JSON.stringify({ error: "texte_r2 binding is missing" }), {
      status: 500,
      headers,
    });
  }
  return bucket;
} 
