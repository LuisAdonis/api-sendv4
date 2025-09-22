import { Schema, model, Document, Types } from 'mongoose';
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
  ciudad: Types.ObjectId;
  tipo: string;
  logo_banner?: string;
  calificacion?: number;
  config_envio: {
    costo_envio: number;
    tiempo_preparacion: number;
    zonas_cobertura: string[];
  };

}

const tiendaSchema = new Schema<ITienda>(
  {
    nombre: { type: String, required: true },
    direccion: { type: String, required: true },
    logo: { type: String ,default:'none'},
    logo_banner: { type: String, default: 'none' },
    calificacion: { type: Number, default: 1.2 },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    telefono: { type: String, required: true , unique: true },
    email: { type: String, required: true, unique: true },
    estado: {
      type: String,
      enum: ['activa', 'cerrada', 'suspendida', 'eliminada'],
      default: 'activa',
    },
    horario: { type: [horarioSchema], default: [] },
    ciudad: { type: Schema.Types.ObjectId, ref: 'Ciudad', },
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
tiendaSchema.virtual('productos', {
  ref: 'Producto',
  localField: '_id',
  foreignField: 'tienda_id'
});

tiendaSchema.index({ latitud: 1, longitud: 1 });

export default model<ITienda>('Tienda', tiendaSchema);
