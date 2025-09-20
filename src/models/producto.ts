import { Schema, model, Document, Types } from 'mongoose';
export type EstadoProducto = 'disponible' | 'no-disponible' | 'suspendido' | 'eliminado';

export interface IProducto extends Document {
  tienda_id: Types.ObjectId;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url: string;
  disponible: EstadoProducto;
  horario_disponible?: IHorarioDisponible[];
  stock?: number;
}

export interface IHorarioDisponible {
  dia: string;
  desde: string;
  hasta: string;
}
const horarioSchema = new Schema<IHorarioDisponible>(
  {
    dia: { type: String, required: true },
    desde: { type: String, required: true },
    hasta: { type: String, required: true }
  },
  { _id: false }
);

const productoSchema = new Schema<IProducto>(
  {
    tienda_id: { type: Schema.Types.ObjectId, ref: 'Tienda', required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    categoria: { type: String, required: true },
    imagen_url: { type: String, default: 'sinimagen' },
    horario_disponible: { type: [horarioSchema], default: [] },
    disponible: {
      type: String,
      enum: ['disponible', 'no-disponible', 'suspendido', 'eliminado'],
      default: 'no-disponible',
    },
  }, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
});

export default model<IProducto>('Producto', productoSchema);
