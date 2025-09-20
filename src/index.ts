import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import cors from 'cors';

import { getCorsConfig } from './config/cors.config';
import corsErrorHandler from './middleware/corsErrorHandler';
import verifyToken from './middleware/verifyToken';
import path from 'path';


import cityRoutes from './routes/ciudad';
import storeRoutes from './routes/tienda';
import productRoutes from './routes/producto';


import cityPublicRoutes from './routes/ciudadPublica';
import storePublicRoutes from './routes/tiendaPublica';
import productPublicRoutes from './routes/productoPublica';

dotenv.config();

const app = express();
// const corsConfig = getCorsConfig();
// app.use(cors(corsConfig));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        console.log('✅ Preflight request handled');
        res.status(200).end();
        return;
    }
    next();
});
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads/productos')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads/tiendas')));

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toUTCString(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development',
  });
});
app.use('/api/v1/city',cityPublicRoutes);
app.use('/api/v1/store',storePublicRoutes);
app.use('/api/v1/product',productPublicRoutes);

app.use(verifyToken);
app.use('/api/v1/store',storeRoutes);
app.use('/api/v1/product',productRoutes);
app.use('/api/v1/city',cityRoutes);



app.use(corsErrorHandler);
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});


const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI || '')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📄 API Docs: http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error', err);
  });
