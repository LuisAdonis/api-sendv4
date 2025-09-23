import { Router, NextFunction, Request, Response } from 'express';
import tienda from '../models/tienda';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authorize } from '../middleware/authorize';
import verifyToken from '../middleware/verifyToken';

const storage = multer.diskStorage({
  destination: 'uploads/tiendas',
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


router.get('city/:ciudad', async (req, res) => {
  try {
    const docs = await tienda.find({ ciudad: req.params.ciudad }).select("-__v");
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
router.post('/', checkFileField, upload.single('file'), verifyToken, authorize(['admin']), async (req, res) => {
  try {
    let fileUrl = null;
    const updateData: any = { ...req.body };

    if (req.file) {
      const relativePath = `/uploads/${req.file.filename}`;
      fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
      updateData.logo = fileUrl;
    }
    const doc = new tienda(updateData);
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
        message: 'El telefono o correo de tienda ya existe',
        field: Object.keys(err.keyPattern)[0]
      });
    }
    res.status(500).json({
      message:  err.message,
      details: err.message,
      errors: err.errors
    });
  }
});
router.put('/:id', checkFileField, upload.single('file'), verifyToken, authorize(['admin']), async (req, res) => {
  try {
    let fileUrl = null;
    const updateData: any = { ...req.body };


    if (req.file) {
      const relativePath = `/uploads/${req.file.filename}`;
      fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
      updateData.logo = fileUrl;

    }
    const oldDoc = await tienda.findById(req.params.id);
    if (!oldDoc) return res.status(404).json({ message: 'Not found' });

    if (req.file && oldDoc.logo) {
      try {
        const filename = path.basename(oldDoc.logo); // ej: 1758315952701-923297542.png

        const oldPath = path.join(process.cwd(), 'uploads', 'tiendas', filename);

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (e) {
        console.warn('No se pudo eliminar la imagen anterior:', e);
      }
    }

    const docs = await tienda.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
      message: 'Error interno del servidor',
       details: err.message,
        errors: err.errors
    });
  }
});
router.delete('/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const docs = await tienda.findByIdAndDelete(req.params.id);
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;