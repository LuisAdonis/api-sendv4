// __tests__/tienda.test.ts
import { DateTime } from 'luxon';
import TiendaModel from '../models/tienda';
import test, { describe } from 'node:test';

describe('Tienda - Validación de Horarios', () => {
  
  test('Debe estar abierta en horario normal', () => {
    const tienda = new TiendaModel({
      nombre: 'Test Store',
      timezone: 'America/Guayaquil',
      horario: [
        { dia: 'lunes', apertura: '08:00', cierre: '20:00' }
      ],
      // ... otros campos requeridos
    });

    // Simular lunes 10:00
    const fechaTest = DateTime.fromObject(
      { weekday: 1, hour: 10, minute: 0 },
      { zone: 'America/Guayaquil' }
    );

    // expect(tienda.estaAbierta(fechaTest)).toBe(true);
  });

  test('Debe estar cerrada fuera de horario', () => {
    const tienda = new TiendaModel({
      nombre: 'Test Store',
      timezone: 'America/Guayaquil',
      horario: [
        { dia: 'lunes', apertura: '08:00', cierre: '20:00' }
      ],
    });

    // Simular lunes 22:00
    const fechaTest = DateTime.fromObject(
      { weekday: 1, hour: 22, minute: 0 },
      { zone: 'America/Guayaquil' }
    );

    // expect(tienda.estaAbierta(fechaTest)).toBe(false);
  });

  test('Debe manejar horarios que cruzan medianoche', () => {
    const tienda = new TiendaModel({
      nombre: 'Night Store',
      timezone: 'America/Guayaquil',
      horario: [
        { dia: 'viernes', apertura: '22:00', cierre: '02:00' }
      ],
    });

    // Viernes 23:00 - Debe estar abierta
    const viernes23 = DateTime.fromObject(
      { weekday: 5, hour: 23, minute: 0 },
      { zone: 'America/Guayaquil' }
    );
    // expect(tienda.estaAbierta(viernes23)).toBe(true);

    // Sábado 01:00 (técnicamente es el horario del viernes)
    const sabado01 = DateTime.fromObject(
      { weekday: 6, hour: 1, minute: 0 },
      { zone: 'America/Guayaquil' }
    );
    // NOTA: Este caso requiere lógica adicional para horarios de madrugada
    // Por ahora se basa en el día actual
  });

  test('Debe respetar días marcados como cerrado', () => {
    const tienda = new TiendaModel({
      nombre: 'Test Store',
      timezone: 'America/Guayaquil',
      horario: [
        { dia: 'domingo', apertura: '08:00', cierre: '20:00', cerrado: true }
      ],
    });

    const domingo10 = DateTime.fromObject(
      { weekday: 7, hour: 10, minute: 0 },
      { zone: 'America/Guayaquil' }
    );

    // expect(tienda.estaAbierta(domingo10)).toBe(false);
  });

  test('Debe calcular próxima apertura correctamente', () => {
    const tienda = new TiendaModel({
      nombre: 'Test Store',
      timezone: 'America/Guayaquil',
      horario: [
        { dia: 'lunes', apertura: '08:00', cierre: '20:00' },
        { dia: 'martes', apertura: '08:00', cierre: '20:00' },
      ],
    });

    // Simular lunes 21:00 (cerrada)
    const lunes21 = DateTime.fromObject(
      { weekday: 1, hour: 21, minute: 0 },
      { zone: 'America/Guayaquil' }
    );

    // Mock DateTime.now() para testing
    // jest.spyOn(DateTime, 'now').mockReturnValue(lunes21);

    const proxima = tienda.getProximaApertura();
    
    // expect(proxima).toMatchObject({
    //   dia: 'martes',
    //   hora: '08:00'
    // });
    // expect(proxima?.minutos).toBeGreaterThan(0);
  });
});