import { Schema, model, Document } from 'mongoose';

export type UserRole = 'cliente' | 'repartidor' | 'admin';

export interface IUsuario extends Document {
  uid: string;   // UID de Firebase
  email: string;
  nombre: string;
  rol: UserRole;
  activo: boolean;
  fecha_creacion: Date;
}

const userSchema = new Schema<IUsuario>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  nombre: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'repartidor', 'admin'], default: 'cliente' },
  activo: { type: Boolean, default: true },
  fecha_creacion: { type: Date, default: Date.now },
},{
  timestamps: true,
});

export default model<IUsuario>('Usuario', userSchema);
