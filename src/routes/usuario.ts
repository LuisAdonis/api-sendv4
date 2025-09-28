import { Router } from 'express';
import verifyToken, { AuthRequest } from '../middleware/verifyToken';
import { authorize } from '../middleware/authorize';
import usuario from '../models/usuario';

const router = Router();
/**
 * @openapi
 * /api/v1/users/perfil:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil accesible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 rol:
 *                   type: string
 *                   enum: [cliente, repartidor, admin]
 *                 estado:
 *                   type: boolean
 *                 uid:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/perfil',verifyToken,  async (req:AuthRequest, res) => {
  const docs= await usuario.findOne({uid:req.user.uid})
    if (!docs) return res.status(404).json({ message: 'Not found' });
     const respuesta = {
      ...docs.toObject(),
       ultimo_acceso:new Date(),
       configuraciones:{},
      //  permisos:[
        // 'view_ciudad',
        // 'view_producto',
        // 'view_usuario',
        // 'view_config',
        // 'view_tienda'
      //  ],
    };
  res.json(respuesta);
});
/**
 * @openapi
 * /api/v1/users/admin/dashboard:
 *   get:
 *     summary: Dashboard de admin
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bienvenida al admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/admin/dashboard', verifyToken, authorize(['admin']), (req, res) => {
  res.json({ message: 'Bienvenido admin' });
});
/**
 * @openapi
 * /api/v1/users/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioInput'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Error de validación
 *       409:
 *         description: UID ya registrado
 */
router.post('/register', verifyToken, async (req, res) => {
  try {
    const doc = new usuario(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'El uid ya está registrado',
        field: Object.keys(err.keyValue)[0],
        value: err.keyValue
      });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: err.errors
      });
    }
    res.status(500).json({ message: 'Error interno', error: err.message });
  }
});

export default router;
