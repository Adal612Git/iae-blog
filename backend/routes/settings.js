import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';
import { getSettings, updateSettings, uploadLogo, uploadBackground } from '../controllers/settingsController.js';
import upload from '../middlewares/upload.js';

const router = Router();

// Público: leer configuración (para aplicar colores/featured)
router.get('/', getSettings);

// Admin: actualizar
router.put('/', authenticateJWT, requireAdmin, updateSettings);

// Subir logo (solo admin)
router.put('/logo', authenticateJWT, requireAdmin, upload, uploadLogo);

// Subir fondo (solo admin)
router.put('/background', authenticateJWT, requireAdmin, upload, uploadBackground);

export default router;
