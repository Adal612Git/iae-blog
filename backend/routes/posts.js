import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';
import upload from '../middlewares/upload.js';
import { getPosts, createPost, updatePost, deletePost } from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts);
router.post('/', authenticateJWT, requireAdmin, upload, createPost);
router.put('/:id', authenticateJWT, requireAdmin, upload, updatePost);
router.delete('/:id', authenticateJWT, requireAdmin, deletePost);

export default router;
