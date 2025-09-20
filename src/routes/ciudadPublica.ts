import { Router, NextFunction, Request, Response } from 'express';
import ciudad from '../models/ciudad';
const router = Router();

router.get('/', async (req, res) => {
  try {
    const docs = await ciudad.find().select("-__v");
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
