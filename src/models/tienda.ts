import { DateTime } from 'luxon';
import { Schema, model, Document, Types, Model } from 'mongoose';
export type EstadoTienda = 'activa' | 'cerrada' | 'suspendida' | 'eliminada';
export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface IHorarioTienda {
  dia: DiaSemana;
  apertura: string; 
  cierre: string; 
  cerrado?: boolean; 
}

const horarioSchema = new Schema<IHorarioTienda>(
  {
    dia: { 
      type: String, 
      required: true,
      enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    },
    apertura: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Formato de hora inválido. Use HH:mm (24h)'
      }
    },
    cierre: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Formato de hora inválido. Use HH:mm (24h)'
      }
    },
    cerrado: { type: Boolean, default: false }
  },
  { _id: false }
);


export interface ITiendaModel extends Model<ITienda> {
  actualizarEstadosPorHorario(): Promise<{
    actualizadas: number;
    total: number;
  }>;
}

export interface ITienda extends Document {
  nombre: string;
  logo: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono: string;
  email: string;
  horario?: IHorarioTienda[];
  estado: EstadoTienda;
  ciudad_id: Types.ObjectId;
  tipo: string;
  logo_banner?: string;
  calificacion?: number;
  timezone: string; // ✅ NUEVO: Zona horaria de la tienda
  config_envio: {
    costo_envio: number;
    tiempo_preparacion: number;
    zonas_cobertura: string[];
  };
  
  // Métodos mejorados
  estaAbierta(fechaHora?: DateTime): boolean;
  getHorarioDelDia(dia?: DiaSemana): IHorarioTienda | undefined;
  getProximaApertura(): { dia: string; hora: string; minutos: number } | null;
}

const tiendaSchema = new Schema<ITienda>(
  {
    nombre: { type: String, required: true },
    direccion: { type: String, required: true },
    logo: { type: String, default: 'none' },
    logo_banner: { type: String, default: 'none' },
    calificacion: { type: Number, default: 1.2 },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    telefono: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    estado: {
      type: String,
      enum: ['activa', 'cerrada', 'suspendida', 'eliminada'],
      default: 'activa',
    },
    horario: { type: [horarioSchema], default: [] },
    ciudad_id: { type: Schema.Types.ObjectId, ref: 'Ciudad', required: true },
    tipo: { type: String, default: 'none' },
    
    // ✅ NUEVO: Zona horaria
    timezone: { 
      type: String, 
      default: 'America/Guayaquil', // Ecuador
      validate: {
        validator: function(v: string) {
          try {
            DateTime.now().setZone(v);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Zona horaria inválida'
      }
    },
    
    config_envio: {
      costo_envio: { type: Number, default: 0 },
      tiempo_preparacion: { type: Number, default: 15 },
      zonas_cobertura: { type: [String], default: [] }
    }
  }, 
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  });
  tiendaSchema.methods.estaAbierta = function(fechaHora?: DateTime): boolean {
  // Si no hay horario configurado, se considera cerrada
  if (!this.horario || this.horario.length === 0) {
    return false;
  }

  // Usar fecha/hora proporcionada o la actual en la zona de la tienda
  const ahora = fechaHora || DateTime.now().setZone(this.timezone);
  
  // Mapeo de días de Luxon a nuestro formato
  const diasMap: { [key: number]: DiaSemana } = {
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado',
    7: 'domingo'
  };
  
  const diaActual = diasMap[ahora.weekday];
  
  // Buscar horario del día actual
  const horarioHoy = this.horario.find(
    (h: IHorarioTienda) => h.dia === diaActual
  );

  // Si no hay horario para hoy o está marcado como cerrado
  if (!horarioHoy || horarioHoy.cerrado) {
    return false;
  }

  // Convertir hora actual a minutos desde medianoche
  const minutosActuales = ahora.hour * 60 + ahora.minute;
  
  // Parsear horas de apertura y cierre
  const [aperturaH, aperturaM] = horarioHoy.apertura.split(':').map(Number);
  const [cierreH, cierreM] = horarioHoy.cierre.split(':').map(Number);
  
  const minutosApertura = aperturaH * 60 + aperturaM;
  let minutosCierre = cierreH * 60 + cierreM;
  
  // ✅ MANEJO DE MEDIANOCHE: Si cierre < apertura, cruza medianoche
  if (minutosCierre <= minutosApertura) {
    // Ejemplo: 22:00 a 02:00
    // Si son las 23:00 (1380 min), está abierto
    // Si son las 01:00 (60 min), también está abierto
    return minutosActuales >= minutosApertura || minutosActuales < minutosCierre;
  }
  
  // Caso normal: apertura < cierre (ejemplo: 08:00 a 18:00)
  return minutosActuales >= minutosApertura && minutosActuales < minutosCierre;
};

tiendaSchema.methods.getHorarioDelDia = function(dia?: DiaSemana): IHorarioTienda | undefined {
  if (!this.horario || this.horario.length === 0) {
    return undefined;
  }

  if (!dia) {
    const ahora = DateTime.now().setZone(this.timezone);
    const diasMap: { [key: number]: DiaSemana } = {
      1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves',
      5: 'viernes', 6: 'sabado', 7: 'domingo'
    };
    dia = diasMap[ahora.weekday];
  }

  return this.horario.find((h: IHorarioTienda) => h.dia === dia);
};

tiendaSchema.methods.getProximaApertura = function(): { dia: string; hora: string; minutos: number } | null {
  if (!this.horario || this.horario.length === 0) {
    return null;
  }

  const ahora = DateTime.now().setZone(this.timezone);
  const diasOrdenados: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  
  const hoyIndex = ahora.weekday - 1; // Luxon: 1=lunes, ajustamos a 0-indexed
  const diasRotados = [...diasOrdenados.slice(hoyIndex), ...diasOrdenados.slice(0, hoyIndex)];
  
  for (let i = 0; i < diasRotados.length; i++) {
    const dia = diasRotados[i];
    const horarioDia = this.horario.find((h: IHorarioTienda) => h.dia === dia && !h.cerrado);
    
    if (!horarioDia) continue;
    
    const [aperturaH, aperturaM] = horarioDia.apertura.split(':').map(Number);
    let fechaApertura = ahora.plus({ days: i }).set({ hour: aperturaH, minute: aperturaM, second: 0 });
    
    if (i === 0) {
      const minutosActuales = ahora.hour * 60 + ahora.minute;
      const minutosApertura = aperturaH * 60 + aperturaM;
      
      if (minutosActuales >= minutosApertura) {
        continue; 
      }
    }
    
    const minutosHastaApertura = fechaApertura.diff(ahora, 'minutes').minutes;
    
    return {
      dia: dia,
      hora: horarioDia.apertura,
      minutos: Math.round(minutosHastaApertura)
    };
  }
  
  return null; 
};

tiendaSchema.statics.actualizarEstadosPorHorario = async function() {
  const tiendas = await this.find({ 
    estado: { $in: ['activa', 'cerrada'] }
  });

  let actualizadas = 0;
  const cambios: any[] = [];

  for (const tienda of tiendas) {
    const deberiaEstarAbierta = tienda.estaAbierta();
    const estadoActual = tienda.estado;
    const estadoAnterior = estadoActual;

    if (deberiaEstarAbierta && estadoActual === 'cerrada') {
      tienda.estado = 'activa';
      await tienda.save();
      actualizadas++;
      
      cambios.push({
        tienda_id: tienda._id,
        nombre: tienda.nombre,
        cambio: 'cerrada → activa',
        hora: DateTime.now().setZone(tienda.timezone).toFormat('HH:mm')
      });
      
    } else if (!deberiaEstarAbierta && estadoActual === 'activa') {
      tienda.estado = 'cerrada';
      await tienda.save();
      actualizadas++;
      
      cambios.push({
        tienda_id: tienda._id,
        nombre: tienda.nombre,
        cambio: 'activa → cerrada',
        hora: DateTime.now().setZone(tienda.timezone).toFormat('HH:mm')
      });
    }
  }

  console.log('📊 Actualización de estados:', {
    fecha: DateTime.now().toISO(),
    total: tiendas.length,
    actualizadas,
    cambios
  });

  return { actualizadas, total: tiendas.length, cambios };
};

tiendaSchema.virtual('productos', {
  ref: 'Producto',
  localField: '_id',
  foreignField: 'tienda_id'
});

tiendaSchema.index({ latitud: 1, longitud: 1 });
tiendaSchema.index({ estado: 1, ciudad_id: 1 });
tiendaSchema.index({ timezone: 1 });

const TiendaModel = model<ITienda, ITiendaModel>('Tienda', tiendaSchema);
export default TiendaModel;