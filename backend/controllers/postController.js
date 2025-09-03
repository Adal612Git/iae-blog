export async function getPosts(_req, res) {
  // Demo response; replace with DB integration
  return res.json([
    { id: 1, title: 'Primer post', body: 'Contenido de ejemplo' },
    { id: 2, title: 'Segundo post', body: 'Más contenido de ejemplo' },
  ]);
}

export async function createPost(req, res) {
  const { title, body } = req.body ?? {};
  const post = { id: Date.now(), title: title || 'Sin título', body: body || '' };
  // Demo response; replace with persistence
  return res.status(201).json(post);
}

