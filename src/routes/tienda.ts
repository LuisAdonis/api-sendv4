import { Router, NextFunction, Request, Response } from 'express';
import tienda from '../models/tienda';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authorize } from '../middleware/authorize';
import verifyToken from '../middleware/verifyToken';

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const storeId = req.params.id;
    const dest = storeId ? `uploads/tiendas/${storeId}` : 'uploads/tiendas/temp';
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


router.get('/datos', async (req, res) => {
  try {
    const resultado = await tienda.actualizarEstadosPorHorario();
    res.json({
      success: true,
      message: 'Estados actualizados',
      data: resultado
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Error al actualizar estados',
      error
    });
  }
});

/**
 * @openapi
 * /api/v1/store/city/{ciudad}:
 *   get:
 *     summary: Obtiene todas las tiendas de una ciudad
 *     tags:
 *       - Tiendas
 *     parameters:
 *       - name: ciudad
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de tiendas filtradas por ciudad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tienda'
 */
router.get('/city/:ciudad', async (req, res) => {
  try {
    const docs = await tienda.find({ ciudad_id: req.params.ciudad }).select("-__v");
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/v1/store/:
 *   get:
 *     summary: Obtiene todas las tiendas
 *     tags:
 *       - Tiendas
 *     responses:
 *       200:
 *         description: Lista de tiendas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tienda'
 */
router.get('/', async (req, res) => {
  try {
    const docs = await tienda.find().select("-__v");
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
/**
 * @openapi
 * /api/v1/store/{id}:
 *   get:
 *     summary: Obtiene una tienda por ID
 *     tags:
 *       - Tiendas
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tienda encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tienda'
 *       404:
 *         description: Tienda no encontrada
 */
router.get('/:id', async (req, res) => {
  try {
    const docs = await tienda.findById(req.params.id).select("-__v").populate('productos');
    if (!docs) return res.status(404).json({ message: 'Not found' });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
/**
 * @openapi
 * /api/v1/store/:
 *   post:
 *     summary: Crea una nueva tienda
 *     tags:
 *       - Tiendas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               direccion:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               ciudad_id:
 *                 type: string
 *               tipo:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tienda creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tienda'
 *       422:
 *         description: Error de validación
 *       409:
 *         description: Telefono o correo duplicado
 */
router.post('/', checkFileField, upload.single('file'), verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const updateData: any = { ...req.body };

    const doc = new tienda(updateData);
    await doc.save();

    if (req.file) {
      const oldPath = req.file.path;
      const newDir = path.join(process.cwd(), 'uploads', 'tiendas', doc.id.toString());
      const newPath = path.join(newDir, req.file.filename);
      fs.mkdirSync(newDir, { recursive: true });
      fs.renameSync(oldPath, newPath);
      const newRelativePath = `/uploads/tiendas/${doc.id}/${req.file.filename}`;
      const fileUrl = `${req.protocol}://${req.get('host')}${newRelativePath}`;

      doc.logo = fileUrl;
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
        message: 'El telefono o correo de tienda ya existe',
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
 * /api/v1/store/{id}:
 *   put:
 *     summary: Actualiza una tienda
 *     tags:
 *       - Tiendas
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
 *               nombre:
 *                 type: string
 *               direccion:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               ciudad_id:
 *                 type: string
 *               tipo:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Tienda actualizada
 *       404:
 *         description: Tienda no encontrada
 *       422:
 *         description: Error de validación
 *       409:
 *         description: Telefono o correo duplicado
 */
router.put('/:id', checkFileField, upload.single('file'), verifyToken, authorize(['admin']), async (req, res) => {
  try {
    let fileUrl = null;
    const updateData: any = { ...req.body };


    if (req.file) {
      const newRelativePath = `/uploads/tiendas/${updateData.id}/${req.file.filename}`;
      fileUrl = `${req.protocol}://${req.get('host')}${newRelativePath}`;
      updateData.logo = fileUrl;

    }
    const oldDoc = await tienda.findById(req.params.id);
    if (!oldDoc) return res.status(404).json({ message: 'Not found' });

    if (req.file && oldDoc.logo) {
      try {
        const filename = path.basename(oldDoc.logo);

        const oldPath = path.join(process.cwd(), 'uploads', 'tiendas', oldDoc.id, filename);

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
 * /api/v1/store/{id}:
 *   delete:
 *     summary: Elimina una tienda por ID
 *     tags:
 *       - Tiendas
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
 *         description: Tienda eliminada
 *       404:
 *         description: Tienda no encontrada
 */
router.delete('/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const docs = await tienda.findByIdAndDelete(req.params.id);
    if (!docs) return res.status(404).json({ message: 'Not found' });
    try {
      const oldPath = path.join(process.cwd(), 'uploads', 'tiendas', docs.id);
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

router.get('/verificar/:id', async (req, res) => {
  try {
    const docs = await tienda.findById(req.params.id);

    if (!docs) {
      return res.status(404).json({
        success: false,
        message: 'Tienda no encontrada'
      });
    }

    const estaAbierta = docs.estaAbierta();

    res.json({
      success: true,
      data: {
        tienda_id: docs._id,
        nombre: docs.nombre,
        estado: docs.estado,
        estaAbierta,
        horarioHoy: docs.horario?.find(h => {
          const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
          return h.dia.toLowerCase() === dias[new Date().getDay()];
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar estado',
      error
    });
  }
});

export default router;