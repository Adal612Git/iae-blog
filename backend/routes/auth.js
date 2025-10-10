import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { IS_DEMO } from '../config.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET no está definida en el entorno' });
    }

    if (IS_DEMO) {
      // En demo aceptamos admin@iae.com / admin123 y devolvemos un token simple
      if (email !== 'admin@iae.com' || password !== 'admin123') {
        return res.status(401).json({ message: 'Credenciales inválidas (demo: admin@iae.com / admin123)' });
      }
      const token = jwt.sign({ id: 'demo-admin', role: 'admin' }, secret, { expiresIn: '4h' });
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Usuario demo ${email} inició sesión`);
      return res.json({ token });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Solo cuentas con rol admin pueden iniciar sesión
    if (String(user.role) !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden iniciar sesión' });
    }

    const token = jwt.sign({ id: user._id, role: 'admin' }, secret, { expiresIn: '4h' });
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Usuario ${user._id} (${email}) inició sesión`);
    return res.json({ token });
  } catch (err) {
    console.error('Error en /login:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

// GET /api/auth/status - saber si existe al menos un admin
router.get('/status', async (_req, res) => {
  try {
    if (IS_DEMO) {
      return res.json({ hasAdmin: true });
    }
    const count = await User.countDocuments({ role: 'admin' });
    return res.json({ hasAdmin: count > 0 });
  } catch (err) {
    console.error('Error en /status:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

// POST /api/auth/register (solo para admin autenticado)
router.post('/register', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET no está definida en el entorno' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    if (IS_DEMO) {
      // En demo no persistimos usuarios nuevos
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] (DEMO) Registro simulado por admin: ${email}`);
      return res.status(200).json({ message: 'Registro simulado en modo demo' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.create({ email, passwordHash, role: 'admin' });
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Usuario ${created._id} (${email}) creado por admin ${req.user?._id}`);

    return res.status(201).json({
      user: { id: created._id, email: created.email, role: created.role },
      message: 'Usuario creado',
    });
  } catch (err) {
    console.error('Error en /register:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

// POST /api/auth/bootstrap - crear primer super admin con clave maestra
router.post('/bootstrap', async (req, res) => {
  try {
    const { email, password, masterKey } = req.body ?? {};
    if (!email || !password || !masterKey) {
      return res.status(400).json({ message: 'Email, password y masterKey son requeridos' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET no está definida en el entorno' });
    }

    const CONFIG_KEY = process.env.ADMIN_MASTER_KEY || process.env.MASTER_KEY;
    if (!CONFIG_KEY) {
      return res.status(500).json({ message: 'ADMIN_MASTER_KEY no configurada' });
    }

    if (String(masterKey) !== String(CONFIG_KEY)) {
      return res.status(403).json({ message: 'Clave maestra incorrecta' });
    }

    if (IS_DEMO) {
      const token = jwt.sign({ id: 'demo-admin', role: 'admin' }, secret, { expiresIn: '4h' });
      return res.status(201).json({ token, user: { id: 'demo-admin', email, role: 'admin' }, message: 'Bootstrap simulado (DEMO)' });
    }

    const admins = await User.countDocuments({ role: 'admin' });
    if (admins > 0) {
      return res.status(409).json({ message: 'Ya existe un administrador' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.create({ email, passwordHash, role: 'admin' });
    const token = jwt.sign({ id: created._id, role: 'admin' }, secret, { expiresIn: '4h' });
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Bootstrap: creado super admin ${created._id} (${email})`);
    return res.status(201).json({ token, user: { id: created._id, email: created.email, role: 'admin' } });
  } catch (err) {
    console.error('Error en /bootstrap:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});

export default router;

