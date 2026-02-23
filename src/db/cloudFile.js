function buildError(message, status, body) {
  const error = new Error(message);
  error.status = status;
  error.body = body;
  return error;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message =
      typeof data?.error === 'string' && data.error.trim().length > 0
        ? data.error
        : `Request failed (${response.status})`;
    throw buildError(message, response.status, data);
  }

  return data;
}

export async function getCloudFilesMetadata() {
  const data = await requestJson('/api/files/');
  return Array.isArray(data) ? data : [];
}

export async function getCloudFile(id) {
  if (!id) throw new Error('id is required');
  return await requestJson(`/api/files/${encodeURIComponent(id)}`);
}

export async function storeCloudFile({ name, content }) {
  return await requestJson(`/api/files/`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      content
    })
  });
}

export async function removeCloudFile(id) {
  if (!id) throw new Error('id is required');

  return await requestJson(`/api/files/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}
