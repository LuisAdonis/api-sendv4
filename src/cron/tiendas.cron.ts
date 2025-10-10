import cron from 'node-cron';
import TiendaModel from '../models/tienda';

export const iniciarCronTiendas = () => {
  // Se ejecuta cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('🕐 Actualizando estados de tiendas...');
      const resultado = await TiendaModel.actualizarEstadosPorHorario();
      console.log(`✅ ${resultado.actualizadas} tiendas actualizadas de ${resultado.total}`);
    } catch (error) {
      console.error('❌ Error al actualizar estados de tiendas:', error);
    }
  });

  console.log('✅ Cron de tiendas iniciado');
};