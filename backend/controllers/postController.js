import Post from '../models/Post.js';

export async function getPosts(_req, res) {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 });
    return res.json(posts);
  } catch (err) {
    console.error('getPosts error:', err);
    return res.status(500).json({ message: 'Error al obtener publicaciones' });
  }
}

export async function createPost(req, res) {
  try {
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { title, content } = req.body ?? {};
    if (!title || !content) {
      return res.status(400).json({ message: 'title y content son requeridos' });
    }

    let image;
    let video;
    let filePath;
    const file = req.file;
    if (file) {
      const isImage = file.mimetype?.startsWith('image');
      const isVideo = file.mimetype?.startsWith('video');
      const relPath = `/uploads/${file.filename}`;
      if (isImage) image = relPath;
      else if (isVideo) video = relPath;
      // Guardar también la ruta proporcionada por multer
      filePath = file.path;
    }

    const post = await Post.create({
      title,
      content,
      image,
      video,
      filePath,
      userId: currentUser._id,
      createdAt: new Date(),
    });

    return res.status(201).json(post);
  } catch (err) {
    console.error('createPost error:', err);
    return res.status(500).json({ message: 'Error al crear la publicación' });
  }
}

export async function updatePost(req, res) {
  try {
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { id } = req.params;
    const { title, content } = req.body ?? {};

    const update = {};
    if (typeof title === 'string') update.title = title;
    if (typeof content === 'string') update.content = content;

    const file = req.file;
    if (file) {
      const isImage = file.mimetype?.startsWith('image');
      const isVideo = file.mimetype?.startsWith('video');
      const relPath = `/uploads/${file.filename}`;
      if (isImage) {
        update.image = relPath;
        update.video = undefined;
      } else if (isVideo) {
        update.video = relPath;
        update.image = undefined;
      }
      // Actualizar filePath absoluto de multer
      update.filePath = file.path;
    }

    const updated = await Post.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Publicación no encontrada' });
    return res.json(updated);
  } catch (err) {
    console.error('updatePost error:', err);
    return res.status(500).json({ message: 'Error al actualizar la publicación' });
  }
}

export async function deletePost(req, res) {
  try {
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { id } = req.params;
    const deleted = await Post.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Publicación no encontrada' });
    return res.json({ message: 'Publicación eliminada' });
  } catch (err) {
    console.error('deletePost error:', err);
    return res.status(500).json({ message: 'Error al eliminar la publicación' });
  }
}
