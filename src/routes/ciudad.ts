import { Router, NextFunction, Request, Response } from 'express';
import ciudad from '../models/ciudad';
import { authorize } from '../middleware/authorize';
import verifyToken from '../middleware/verifyToken';

const router = Router();

/**
 * @openapi
 * /api/v1/city/:
 *   get:
 *     summary: Obtiene todas las ciudades
 *     tags:
 *       - Ciudades
 *     responses:
 *       200:
 *         description: Lista de ciudades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ciudad'
 */
router.get('/', async (req, res) => {
  try {
    const docs = await ciudad.find().select("-__v");
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
/**
 * @openapi
 * /api/v1/city/:
 *   post:
 *     summary: Crea una nueva ciudad
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Ciudades
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CiudadInput'
 *     responses:
 *       201:
 *         description: Ciudad creada exitosamente
 *       409:
 *         description: Ciudad duplicada
 *       422:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
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
/**
 * @openapi
 * /api/v1/city/{id}:
 *   put:
 *     summary: Actualiza una ciudad por ID
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Ciudades
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: 650fa9b9c8a1b2c3d4e5f678
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CiudadInput'
 *     responses:
 *       200:
 *         description: Ciudad actualizada
 *       404:
 *         description: Ciudad no encontrada
 *       422:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
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
/**
 * @openapi
 * /api/v1/city/{id}:
 *   delete:
 *     summary: Elimina una ciudad por ID
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Ciudades
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: 650fa9b9c8a1b2c3d4e5f678
 *     responses:
 *       200:
 *         description: Ciudad eliminada
 *       404:
 *         description: Ciudad no encontrada
 *       500:
 *         description: Error interno del servidor
 */
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
