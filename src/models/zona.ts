import { Schema, model, Document, Types } from 'mongoose';

export interface IPunto {
    latitud: number;
    longitud: number;
}

export interface IZona extends Document {
    nombre: string;
    descripcion?: string;
    ciudadId: Types.ObjectId;
    poligono: IPunto[];
    color: string;
    activa: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const puntoSchema = new Schema<IPunto>({
    latitud: {
        type: Number,
        required: [true, 'La latitud es requerida'],
        min: [-90, 'La latitud debe estar entre -90 y 90'],
        max: [90, 'La latitud debe estar entre -90 y 90']
    },
    longitud: {
        type: Number,
        required: [true, 'La longitud es requerida'],
        min: [-180, 'La longitud debe estar entre -180 y 180'],
        max: [180, 'La longitud debe estar entre -180 y 180']
    }
}, { _id: false });

const zonaSchema = new Schema<IZona>({
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    ciudadId: {
        type: Schema.Types.ObjectId,
        ref: 'Ciudades',
        required: [true, 'El ID de ciudad es requerido']
    },
    poligono: {
        type: [puntoSchema],
        required: [true, 'El polígono es requerido'],
        validate: {
            validator: function (v: IPunto[]) {
                return v && v.length >= 3;
            },
            message: 'El polígono debe tener al menos 3 puntos'
        }
    },
    color: {
        type: String,
        default: '#3B82F6',
        validate: {
            validator: function (v: string) {
                return /^#[0-9A-F]{6}$/i.test(v);
            },
            message: 'El color debe estar en formato hexadecimal (#RRGGBB)'
        }
    },
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para optimización
zonaSchema.index({ ciudadId: 1 });
zonaSchema.index({ activa: 1 });
zonaSchema.index({ nombre: 1, ciudadId: 1 });

export default model<IZona>('Zona', zonaSchema);
