import { Schema, model, Document, Types } from 'mongoose';

export interface ICentroMapa {
    latitud: number;
    longitud: number;
}

export interface ICiudad extends Document {
    codigo: string;
    nombre: string;
    descripcion: string;
    zonasIds?: Types.ObjectId[];
    centroMapa?: ICentroMapa;
    zoomInicial?: number;
}

const ciudadSchema = new Schema<ICiudad>({
    codigo: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    zonasIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Zona'
    }],
    centroMapa: {
        latitud: { type: Number },
        longitud: { type: Number }
    },
    zoomInicial: {
        type: Number,
        default: 12.0
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
},);
ciudadSchema.virtual('tiendas', {
    ref: 'Tienda',
    localField: '_id',
    foreignField: 'ciudad_id'
});

export default model<ICiudad>('Ciudades', ciudadSchema);
