import { Router } from 'express';

import tienda from '../models/tienda';

const router = Router();

router.get('/:ciudad', async (req, res) => {
  try {
    const docs = await tienda.find({ciudad:req.params.ciudad}).select("-__v");
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/', async (req, res) => {
  try {
    const docs = await tienda.find().select("-__v");
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const docs = await tienda.findById(req.params.id).select("-__v").populate('productos');
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
