import { Schema, model, Document, Types } from 'mongoose';

export interface ICiudad extends Document {
    codigo: string;
    nombre: string;
    descripcion: string;
}

const ciudadSchema = new Schema<ICiudad>({
    codigo: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
},);

export default model<ICiudad>('Ciudad', ciudadSchema);
