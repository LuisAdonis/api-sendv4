import { Router, NextFunction, Request, Response } from 'express';
import ciudad from '../models/ciudad';
const router = Router();


router.post('/', async (req, res) => {
  try {
    const doc = new ciudad(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err: any) {
    res.status(500).json({ message: err });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const docs = await ciudad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const docs = await ciudad.findByIdAndDelete(req.params.id);
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
