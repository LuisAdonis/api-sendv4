import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Router, NextFunction, Request, Response } from 'express';
import producto from '../models/producto';
import verifyToken from '../middleware/verifyToken';
import { authorize } from '../middleware/authorize';

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const storeId = req.body.tienda_id;
    const dest = storeId ? `uploads/producto/${storeId}` : 'uploads/producto/temp';
    fs.mkdirSync(dest, { recursive: true });

    cb(null, dest);
  },
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
  if (req.is('application/json')) {
    return next();
  }
  return res.status(400).json({ error: 'Formato de contenido no soportado' });
};
const upload = multer({ storage });

const router = Router();
/**
 * @openapi
 * /api/v1/product/:
 *   get:
 *     summary: Obtiene todos los productos
 *     tags:
 *       - Productos
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 */
router.get('/', async (req, res) => {
  try {
    const docs = await producto.find().select("-__v");
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/tienda/:id', async (req, res) => {
  try {
    const docs = await producto.find({ tienda_id: req.params.id }).select("-__v");;
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
/**
 * @openapi
 * /api/v1/product/{id}:
 *   get:
 *     summary: Obtiene un producto por ID
 *     tags:
 *       - Productos
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const docs = await producto.findById(req.params.id).select("-__v");;
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/v1/product/:
 *   post:
 *     summary: Crea un nuevo producto
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               tienda_id:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               categoria:
 *                 type: string
 *               disponible:
 *                 type: string
 *                 enum: [disponible, no-disponible, suspendido, eliminado]
 *               imagen_url:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       422:
 *         description: Error de validación
 *       409:
 *         description: Producto duplicado
 */
router.post('/', checkFileField, upload.single('file'), verifyToken, authorize(['admin']), async (req, res) => {
  try {
    let fileUrl = null;
    const doc = new producto({ ...req.body, imagen_url: fileUrl, });
    await doc.save();

    if (req.file) {
      const oldPath = req.file.path;
      const newDir = path.join(process.cwd(), 'uploads', 'producto', doc.tienda_id.toString());
      const newPath = path.join(newDir, req.file.filename);
      fs.mkdirSync(newDir, { recursive: true });
      fs.renameSync(oldPath, newPath);
      const newRelativePath = `/uploads/producto/${doc.tienda_id}/${req.file.filename}`;
      const fileUrl = `${req.protocol}://${req.get('host')}${newRelativePath}`;

      doc.imagen_url = fileUrl;
      await doc.save();
    }
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
        message: 'El ' +
          Object.keys(err.keyPattern)[0]
          + ' de este producto ya existe',
        details: err.message,
        field: Object.keys(err.keyPattern)[0]
      });
    }
    res.status(500).json({
      message: err.message,
      details: err.message,
      errors: err.errors
    });
  }
});
/**
 * @openapi
 * /api/v1/product/{id}:
 *   put:
 *     summary: Actualiza un producto
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               tienda_id:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               categoria:
 *                 type: string
 *               disponible:
 *                 type: string
 *                 enum: [disponible, no-disponible, suspendido, eliminado]
 *               imagen_url:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: Producto no encontrado
 *       422:
 *         description: Error de validación
 *       409:
 *         description: Producto duplicado
 */
router.put('/:id', checkFileField, upload.single('file'), verifyToken, authorize(['admin']), async (req, res) => {
  try {
    let fileUrl = null;
    const updateData: any = { ...req.body };

    if (req.file) {
      const newRelativePath = `/uploads/producto/${updateData.tienda_id}/${req.file.filename}`;
      fileUrl = `${req.protocol}://${req.get('host')}${newRelativePath}`;
      updateData.imagen_url = fileUrl;

    }
    const oldDoc = await producto.findById(req.params.id);
    if (!oldDoc) return res.status(404).json({ message: 'Not found' });

    if (req.file && oldDoc.imagen_url) {
      try {
        const filename = path.basename(oldDoc.imagen_url);

        const oldPath = path.join(process.cwd(), 'uploads', 'producto', oldDoc.tienda_id.toString(), filename);

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
        details: err.message,
        field: Object.keys(err.keyPattern)[0]
      });
    }
    res.status(500).json({
      message: 'Error interno del servidor',
      details: err.message,
      errors: err.errors
    });
  }
});
/**
 * @openapi
 * /api/v1/product/{id}:
 *   delete:
 *     summary: Elimina un producto por ID
 *     tags:
 *       - Productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const docs = await producto.findByIdAndDelete(req.params.id);
    if (!docs) return res.status(404).json({ message: 'Not found' });


    try {
      const filename = path.basename(docs.imagen_url);
      const oldPath = path.join(process.cwd(), 'uploads', 'producto', docs.tienda_id.toString(), filename);

      if (fs.existsSync(oldPath)) {
        fs.rmSync(oldPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('No se pudo eliminar el directorio de la tienda:', e);
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
