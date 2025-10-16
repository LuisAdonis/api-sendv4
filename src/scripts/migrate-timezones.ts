import mongoose from 'mongoose';
import TiendaModel from '../models/tienda';
import { DateTime } from 'luxon';
import dotenv from 'dotenv';
import ciudad from '../models/ciudad';

const timezonesPorCiudad: { [key: string]: string } = {
  'Quito': 'America/Guayaquil',
  'Guayaquil': 'America/Guayaquil',
  'Cuenca': 'America/Guayaquil',
  'Manta': 'America/Guayaquil',
};

async function migrateTiendas() {
  try {
    dotenv.config();
    
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB');
    mongoose.model('Ciudad', ciudad.schema);

    const tiendas = await TiendaModel.find().populate('ciudad_id');
    let actualizadas = 0;

    for (const tienda of tiendas) {
      if (!tienda.timezone) {
        const ciudadNombre = (tienda.ciudad_id as any)?.nombre;
        const timezone = timezonesPorCiudad[ciudadNombre] || 'America/Guayaquil';
        
        tienda.timezone = timezone;
        await tienda.save();
        actualizadas++;
        
        console.log(`✅ ${tienda.nombre}: ${timezone}`);
      }
    }

    console.log(`\n🎉 Migración completada: ${actualizadas}/${tiendas.length} tiendas actualizadas`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrateTiendas();