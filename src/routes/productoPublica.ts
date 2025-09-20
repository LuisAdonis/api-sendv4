import { Router, NextFunction, Request, Response } from 'express';
import producto from '../models/producto';
const router = Router();

router.get('/', async (req, res) => {
  try {
    const docs = await producto.find().select("-__v");
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const docs = await producto.findById(req.params.id).select("-__v");;
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
