import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Router, NextFunction, Request, Response } from 'express';
import producto from '../models/producto';
import verifyToken from '../middleware/verifyToken';
import { authorize } from '../middleware/authorize';

const storage = multer.diskStorage({
  destination: 'uploads/producto',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const checkFileField = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  // Si no es multipart, lo tratamos como JSON normal y seguimos
  if (req.is('application/json')) {
    return next();
  }
  // Si llega otro tipo de request que no esperamos
  return res.status(400).json({ error: 'Formato de contenido no soportado' });
};
const upload = multer({ storage });

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


router.post('/', checkFileField, upload.single('file'),verifyToken, authorize(['admin']), async (req, res) => {
  try {
    let fileUrl = null;

    if (req.file) {
      const relativePath = `/uploads/${req.file.filename}`;
      fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
    }
    const doc = new producto({ ...req.body, logo: fileUrl, });
    await doc.save();
    res.status(201).json(doc);
  } catch (err: any) {
    res.status(500).json({ message: err });
  }
});

router.put('/:id', checkFileField, upload.single('file'), verifyToken, authorize(['admin']),async (req, res) => {
  try {
    let fileUrl = null;
    const updateData: any = { ...req.body };


    if (req.file) {
      const relativePath = `/uploads/${req.file.filename}`;
      fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
      updateData.logo = fileUrl;

    }
    const oldDoc = await producto.findById(req.params.id);
    if (!oldDoc) return res.status(404).json({ message: 'Not found' });

    if (req.file && oldDoc.imagen_url) {
      try {
        const filename = path.basename(oldDoc.imagen_url); // ej: 1758315952701-923297542.png

        const oldPath = path.join(process.cwd(), 'uploads', 'tiendas', filename);

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (e) {
        console.warn('No se pudo eliminar la imagen anterior:', e);
      }
    }

    const docs = await producto.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

router.delete('/:id', verifyToken, authorize(['admin']),async (req, res) => {
  try {
    const docs = await producto.findByIdAndDelete(req.params.id);
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
