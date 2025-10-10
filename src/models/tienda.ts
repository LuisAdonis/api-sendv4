import { Schema, model, Document, Types, Model } from 'mongoose';
export type EstadoTienda = 'activa' | 'cerrada' | 'suspendida' | 'eliminada';

export interface IHorarioTienda {
  dia: string;
  apertura: string;
  cierre: string;
}
const horarioSchema = new Schema<IHorarioTienda>(
  {
    dia: { type: String, required: true },
    apertura: { type: String, required: true },
    cierre: { type: String, required: true }
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
  config_envio: {
    costo_envio: number;
    tiempo_preparacion: number;
    zonas_cobertura: string[];
  };
  estaAbierta(): boolean;

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
    config_envio: {
      costo_envio: { type: Number, default: 0 },
      tiempo_preparacion: { type: Number, default: 15 },
      zonas_cobertura: { type: [String], default: [] }
    }
  }, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
});

tiendaSchema.methods.estaAbierta = function(): boolean {
  if (!this.horario || this.horario.length === 0) {
    return false;
  }

  const ahora = new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const diaActual = diasSemana[ahora.getDay()];
  
  const horarioHoy = this.horario.find(
    (h: IHorarioTienda) => h.dia.toLowerCase() === diaActual
  );

  if (!horarioHoy) {
    return false;
  }

  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
  const [aperturaH, aperturaM] = horarioHoy.apertura.split(':').map(Number);
  const [cierreH, cierreM] = horarioHoy.cierre.split(':').map(Number);
  
  const apertura = aperturaH * 60 + aperturaM;
  const cierre = cierreH * 60 + cierreM;

  return horaActual >= apertura && horaActual < cierre;
};

tiendaSchema.statics.actualizarEstadosPorHorario = async function() {
  const tiendas = await this.find({ 
    estado: { $in: ['activa', 'cerrada'] } // Solo actualiza activas/cerradas, no suspendidas
  });

  let actualizadas = 0;

  for (const tienda of tiendas) {
    const deberiaEstarAbierta = tienda.estaAbierta();
    const estadoActual = tienda.estado;

    if (deberiaEstarAbierta && estadoActual === 'cerrada') {
      tienda.estado = 'activa';
      await tienda.save();
      actualizadas++;
    } else if (!deberiaEstarAbierta && estadoActual === 'activa') {
      tienda.estado = 'cerrada';
      await tienda.save();
      actualizadas++;
    }
  }

  return { actualizadas, total: tiendas.length };
};

tiendaSchema.virtual('productos', {
  ref: 'Producto',
  localField: '_id',
  foreignField: 'tienda_id'
});

tiendaSchema.index({ latitud: 1, longitud: 1 });

const TiendaModel= model<ITienda,ITiendaModel>('Tienda', tiendaSchema);
export default TiendaModel;
