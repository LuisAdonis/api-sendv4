import { Router, Request, Response } from 'express';
import Zona from '../models/zona';
import Ciudad from '../models/ciudad';
import { authorize } from '../middleware/authorize';
import verifyToken from '../middleware/verifyToken';
import { Types } from 'mongoose';

const router = Router();

/**
 * @openapi
 * /api/v1/zona/:
 *   get:
 *     summary: Obtiene todas las zonas
 *     tags:
 *       - Zonas
 *     responses:
 *       200:
 *         description: Lista de zonas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Zona'
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const zonas = await Zona.find().select('-__v').populate('ciudadId', 'nombre codigo');
        res.status(200).json(zonas);
    } catch (err) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * @openapi
 * /api/v1/zona/ciudad/{ciudadId}:
 *   get:
 *     summary: Obtiene zonas por ciudad
 *     tags:
 *       - Zonas
 *     parameters:
 *       - name: ciudadId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: 650fa9b9c8a1b2c3d4e5f678
 *     responses:
 *       200:
 *         description: Lista de zonas de la ciudad
 *       404:
 *         description: Ciudad no encontrada
 */
router.get('/ciudad/:ciudadId', async (req: Request, res: Response) => {
    try {
        const { ciudadId } = req.params;

        // Validar que el ID sea válido
        if (!Types.ObjectId.isValid(ciudadId)) {
            return res.status(400).json({ message: 'ID de ciudad inválido' });
        }

        // Verificar que la ciudad existe
        const ciudadExists = await Ciudad.findById(ciudadId);
        if (!ciudadExists) {
            return res.status(404).json({ message: 'Ciudad no encontrada' });
        }

        const zonas = await Zona.find({ ciudadId }).select('-__v');
        res.status(200).json(zonas);
    } catch (err) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * @openapi
 * /api/v1/zona/:
 *   post:
 *     summary: Crea una nueva zona
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Zonas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ZonaInput'
 *     responses:
 *       201:
 *         description: Zona creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Ciudad no encontrada
 *       422:
 *         description: Error de validación
 */
router.post('/', verifyToken, authorize(['admin']), async (req: Request, res: Response) => {
    try {
        const { ciudadId } = req.body;

        // Validar que el ID de ciudad sea válido
        if (!Types.ObjectId.isValid(ciudadId)) {
            return res.status(400).json({ message: 'ID de ciudad inválido' });
        }

        // Verificar que la ciudad existe
        const ciudadExists = await Ciudad.findById(ciudadId);
        if (!ciudadExists) {
            return res.status(404).json({ message: 'Ciudad no encontrada' });
        }

        const zona = new Zona(req.body);
        await zona.save();

        // Agregar la zona al array de zonasIds de la ciudad
        await Ciudad.findByIdAndUpdate(
            ciudadId,
            { $addToSet: { zonasIds: zona._id } },
            { new: true }
        );

        res.status(201).json(zona);
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
 * /api/v1/zona/{id}:
 *   put:
 *     summary: Actualiza una zona existente
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Zonas
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
 *             $ref: '#/components/schemas/ZonaInput'
 *     responses:
 *       200:
 *         description: Zona actualizada
 *       404:
 *         description: Zona no encontrada
 *       422:
 *         description: Error de validación
 */
router.put('/:id', verifyToken, authorize(['admin']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validar que el ID sea válido
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de zona inválido' });
        }

        // Si se está cambiando la ciudad, validar que existe
        if (req.body.ciudadId) {
            if (!Types.ObjectId.isValid(req.body.ciudadId)) {
                return res.status(400).json({ message: 'ID de ciudad inválido' });
            }
            const ciudadExists = await Ciudad.findById(req.body.ciudadId);
            if (!ciudadExists) {
                return res.status(404).json({ message: 'Ciudad no encontrada' });
            }
        }

        const zonaAnterior = await Zona.findById(id);
        if (!zonaAnterior) {
            return res.status(404).json({ message: 'Zona no encontrada' });
        }

        const zona = await Zona.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        // Si cambió la ciudad, actualizar las referencias
        if (req.body.ciudadId && req.body.ciudadId !== zonaAnterior.ciudadId.toString()) {
            // Remover de la ciudad anterior
            await Ciudad.findByIdAndUpdate(
                zonaAnterior.ciudadId,
                { $pull: { zonasIds: id } }
            );
            // Agregar a la nueva ciudad
            await Ciudad.findByIdAndUpdate(
                req.body.ciudadId,
                { $addToSet: { zonasIds: id } }
            );
        }

        res.status(200).json(zona);
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
 * /api/v1/zona/{id}:
 *   delete:
 *     summary: Elimina una zona
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Zonas
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: 650fa9b9c8a1b2c3d4e5f678
 *     responses:
 *       200:
 *         description: Zona eliminada correctamente
 *       404:
 *         description: Zona no encontrada
 */
router.delete('/:id', verifyToken, authorize(['admin']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validar que el ID sea válido
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de zona inválido' });
        }

        const zona = await Zona.findByIdAndDelete(id);
        if (!zona) {
            return res.status(404).json({ message: 'Zona no encontrada' });
        }

        // Remover la referencia de la ciudad
        await Ciudad.findByIdAndUpdate(
            zona.ciudadId,
            { $pull: { zonasIds: id } }
        );

        res.status(200).json({
            success: true,
            message: 'Zona eliminada correctamente'
        });
    } catch (err) {
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

export default router;
