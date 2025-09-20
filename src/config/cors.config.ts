import { CorsOptions } from 'cors';

// Obtener orígenes permitidos desde variables de entorno
const getAllowedOrigins = (): string[] => {
  const defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:5000',
  ];
  // Agregar orígenes desde variable de entorno si existe
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    const additionalOrigins = envOrigins.split(',').map((origin) => origin.trim());
    return [...defaultOrigins, ...additionalOrigins];
  }
  return defaultOrigins;
};

const allowedOrigins = getAllowedOrigins();

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      console.log('✅ Request without origin allowed (mobile app, Postman, etc.)');
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log(`✅ Development origin allowed: ${origin}`);
        return callback(null, true);
      }
    }
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin allowed: ${origin}`);
      return callback(null, true);
    }
    console.log(`🚫 CORS blocked origin: ${origin}`);
    console.log(`📋 Allowed origins:`, allowedOrigins);
    const msg = `CORS policy: Origin ${origin} is not allowed`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'x-access-token',
    'x-auth-token',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
  ],
  exposedHeaders: ['set-cookie', 'Authorization', 'x-access-token', 'x-auth-token'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

export const corsDevOptions: CorsOptions = {
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: '*',
  exposedHeaders: '*',
  optionsSuccessStatus: 200,
};
export const getCorsConfig = (): CorsOptions => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (process.env.CORS_DISABLED === 'true') {
    console.log('⚠️  CORS DISABLED - All origins allowed');
    return corsDevOptions;
  }

  const config = isDevelopment ? corsDevOptions : corsOptions;

  console.log(`🌐 CORS configured for: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  if (!isDevelopment) {
    console.log(`📋 Allowed origins:`, allowedOrigins);
  }

  return config;
};
