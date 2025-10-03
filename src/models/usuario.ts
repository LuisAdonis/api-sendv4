import { Schema, model, Document } from 'mongoose';

export type UserRole = 'cliente' | 'repartidor' | 'admin';

interface IHorario {
  dia: string;
  apertura: string; 
  cierre: string;
}

interface ITarea {
  tarea1: string;
  descripcion: string;
  infoAdicinal: string;
}

const HorarioSchema = new Schema<IHorario>({
  dia: { type: String, required: true },
  apertura: { type: String, required: true },
  cierre: { type: String, required: true },
});

const TareaSchema = new Schema<ITarea>({
  tarea1: { type: String, default: "" },
  descripcion: { type: String, default: "" },
  infoAdicinal: { type: String, default: "" },
});


export interface IUsuario extends Document {
  uid: string;
  email: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;
  fecha_creacion: Date;
  permisos: string[];
  configuraciones: {
    horario: IHorario[];
    tareas: ITarea[];
  };
}

const userSchema = new Schema<IUsuario>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  nombre: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'repartidor', 'admin'], default: 'cliente' },
  activo: { type: Boolean, default: true },
  fecha_creacion: { type: Date, default: Date.now },
  permisos: [{ type: String }],
   configuraciones: {
    horario: [HorarioSchema],
    tareas: [TareaSchema],
  },

}, {
  timestamps: true,
});

export default model<IUsuario>('Usuario', userSchema);
