import { Router } from 'express';
import verifyToken, { AuthRequest } from '../middleware/verifyToken';
import { authorize } from '../middleware/authorize';
import usuario from '../models/usuario';
import { auth } from '../firebase';
const firebaseAuthErrors: Record<string, string> = {
  "auth/claims-too-large": "Las reclamaciones personalizadas superan el tamaño máximo permitido.",
  "auth/email-already-exists": "El correo electrónico ya está en uso.",
  "auth/id-token-expired": "El token de autenticación ha expirado. Inicia sesión nuevamente.",
  "auth/id-token-revoked": "El token de autenticación fue revocado. Vuelve a iniciar sesión.",
  "auth/insufficient-permission": "La credencial usada no tiene permisos suficientes.",
  "auth/internal-error": "Error interno del servidor de autenticación.",
  "auth/invalid-argument": "Se proporcionó un argumento no válido.",
  "auth/invalid-email": "El correo electrónico proporcionado no es válido.",
  "auth/invalid-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-phone-number": "El número de teléfono no es válido. Debe cumplir con el formato E.164.",
  "auth/phone-number-already-exists": "El número de teléfono ya está registrado.",
  "auth/uid-already-exists": "El UID ya está en uso.",
  "auth/user-disabled": "La cuenta de usuario fue deshabilitada por un administrador.",
  "auth/user-not-found": "No existe un usuario con las credenciales proporcionadas.",
  "auth/too-many-requests": "Demasiadas solicitudes. Inténtalo más tarde.",
};
const router = Router();


/**
 * Función auxiliar para listar todos los usuarios de Firebase Auth
 */
const listAllFirebaseUsers = async (): Promise<any[]> => {
  const allUsers: any[] = [];
  
  const listUsers = async (nextPageToken?: string): Promise<void> => {
    try {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      
      listUsersResult.users.forEach((userRecord) => {
        allUsers.push({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          phoneNumber: userRecord.phoneNumber,
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
        });
      });
      
      if (listUsersResult.pageToken) {
        await listUsers(listUsersResult.pageToken);
      }
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  };
  
  await listUsers();
  return allUsers;
};


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
router.get('/perfil', verifyToken, async (req: AuthRequest, res) => {
  const docs = await usuario.findOne({ uid: req.user.uid })
  if (!docs) return res.status(404).json({ message: 'Not found' });
  const respuesta = {
    ...docs.toObject(),
    ultimo_acceso: new Date(),
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
 * /api/v1/users/firebase/all:
 *   get:
 *     summary: Lista todos los usuarios de Firebase Auth
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios de Firebase
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 usuarios:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Error al obtener usuarios
 */
router.get('/firebase/all', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const firebaseUsers = await listAllFirebaseUsers();
    res.json({
      total: firebaseUsers.length,
      usuarios: firebaseUsers
    });
  } catch (error: any) {
    console.error('Error al listar usuarios de Firebase:', error);
    res.status(500).json({
      message: 'Error al obtener usuarios de Firebase',
      error: error.message
    });
  }
});

/**
 * @openapi
 * /api/v1/users/sync:
 *   post:
 *     summary: Sincroniza usuarios de Firebase Auth con la base de datos local
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuarios sincronizados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 insertados:
 *                   type: number
 *                 errores:
 *                   type: number
 *       500:
 *         description: Error en la sincronización
 */
router.post('/sync', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const firebaseUsers = await listAllFirebaseUsers();
    let insertados = 0;
    let errores = 0;
    const detalles: any[] = [];

    for (const firebaseUser of firebaseUsers) {
      try {
        // Verificar si el usuario ya existe en la BD
        const existeUsuario = await usuario.findOne({ uid: firebaseUser.uid });
        
        if (!existeUsuario) {
          // Crear nuevo usuario en la BD
          const nuevoUsuario = new usuario({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nombre: firebaseUser.displayName || 'Sin nombre',
            rol: 'cliente',
            activo: !firebaseUser.disabled,
            permisos: []
          });
          
          await nuevoUsuario.save();
          insertados++;
          detalles.push({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            status: 'insertado'
          });
        } else {
          detalles.push({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            status: 'ya_existe'
          });
        }
      } catch (error: any) {
        errores++;
        detalles.push({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          status: 'error',
          error: error.message
        });
        console.error(`Error al insertar usuario ${firebaseUser.uid}:`, error);
      }
    }

    res.json({
      message: 'Sincronización completada',
      total_firebase: firebaseUsers.length,
      insertados,
      errores,
      detalles
    });
  } catch (error: any) {
    console.error('Error en la sincronización:', error);
    res.status(500).json({
      message: 'Error al sincronizar usuarios',
      error: error.message
    });
  }
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
router.get('/', verifyToken, async (req, res) => {
  try {
    const docs = await usuario.find().select("-__v");
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, authorize(['admin']), async (req, res) => {
 try {
    const userRecord = await auth.createUser({
      email: req.body.email,
      displayName: req.body.nombre,
      password: req.body.password,
    });

    console.log('Successfully created new user:', userRecord.uid);
    const doc = new usuario({
      nombre: userRecord.displayName,
      uid: userRecord.uid,
      email: userRecord.email,
      rol: req.body.rol || 'cliente',
      activo: req.body.activo !== undefined ? req.body.activo : false,
      permisos: req.body.permisos || [],
    });
    
    await doc.save();
    res.status(201).json(doc);
  } catch (error: any) {
    console.log('Error creating new user:', error);
    const mensaje = firebaseAuthErrors[error.code] || "Error desconocido al crear usuario";
    return res.status(422).json({
      message: mensaje,
      code: error.code,
    });
  }
});

router.put('/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const docs = await usuario.findOneAndUpdate({uid:req.params.id}, req.body, { new: true });
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
        message: 'El telefono o correo de usuario ya existe',
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
router.delete('/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    await auth.deleteUser(req.params.id);
    console.log('Successfully deleted user from Firebase');
    
    const docs = await usuario.findOneAndDelete({ uid: req.params.id });
    if (!docs) return res.status(404).json({ message: 'Not found' });
    
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    console.log('Error deleting user:', error);
    
    // Intentar eliminar de la BD aunque falle en Firebase
    const docs = await usuario.findOneAndDelete({ uid: req.params.id });
    
    const mensaje = firebaseAuthErrors[error.code] || "Error desconocido al eliminar usuario";
    return res.status(422).json({
      message: mensaje,
      code: error.code,
    });
  }
})
export default router;
