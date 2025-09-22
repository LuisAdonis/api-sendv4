import { Router, NextFunction, Request, Response } from 'express';
import ciudad from '../models/ciudad';
import { authorize } from '../middleware/authorize';
import verifyToken from '../middleware/verifyToken';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const docs = await ciudad.find().select("-__v");
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const doc = new ciudad(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return res.status(422).json({
        message: 'Error de validación',
        details: err.message,
        errors: err.errors
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'El código de ciudad ya existe',
        field: Object.keys(err.keyPattern)[0]
      });
    }
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

router.put('/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const docs = await ciudad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json(docs);
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return res.status(422).json({
        message: 'Error de validación',
        details: err.message,
        errors: err.errors
      });
    }
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

router.delete('/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const docs = await ciudad.findByIdAndDelete(req.params.id);
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
