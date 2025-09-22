import { Router } from 'express';
import verifyToken, { AuthRequest } from '../middleware/verifyToken';
import { authorize } from '../middleware/authorize';
import usuario from '../models/usuario';

const router = Router();
router.get('/perfil', verifyToken, async (req:AuthRequest, res) => {
  const docs= await usuario.findOne({uid:req.user.uid})
    if (!docs) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Perfil accesible',rol:docs.rol,t:docs.activo,tt:docs.uid});
});

router.get('/admin/dashboard', verifyToken, authorize(['admin']), (req, res) => {
  res.json({ message: 'Bienvenido admin' });
});

router.post('/register', verifyToken, async (req, res) => {
  try {
    const doc = new usuario(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'El uid ya está registrado',
        field: Object.keys(err.keyValue)[0],
        value: err.keyValue
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: err.errors
      });
    }
    res.status(500).json({ message: 'Error interno', error: err.message });
  }
});

export default router;
