import cron from 'node-cron';
import TiendaModel from '../models/tienda';
import { DateTime } from 'luxon';

export const iniciarCronTiendas = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const timestamp = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
      console.log(`🔄 [${timestamp}] Actualizando estados de tiendas...`);
      
      const resultado = await TiendaModel.actualizarEstadosPorHorario();
      
      if (resultado.actualizadas > 0) {
        console.log(`✅ [${timestamp}] ${resultado.actualizadas} tiendas actualizadas de ${resultado.total}`);
        console.log('📋 Cambios:', resultado.total);
      } else {
        console.log(`ℹ️  [${timestamp}] Sin cambios. ${resultado.total} tiendas verificadas`);
      }
      
    } catch (error: any) {
      console.error(`❌ [${DateTime.now().toISO()}] Error al actualizar estados:`, error.message);
      
      // TODO: Enviar alerta (email, Slack, etc.)
      // await enviarAlerta('Error en cron de tiendas', error);
    }
  });
  
  console.log('✅ Cron de tiendas iniciado (cada 10 minutos)');
};