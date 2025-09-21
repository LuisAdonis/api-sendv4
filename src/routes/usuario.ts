import { Router } from 'express';
import  verifyToken  from '../middleware/verifyToken';
import { authorize } from '../middleware/authorize';
import usuario from '../models/usuario';

const router = Router();
router.get('/perfil', verifyToken, async (req, res) => {
  res.json({ message: 'Perfil accesible', });
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
      res.status(500).json({ message: err });
    }
});

export default router;
