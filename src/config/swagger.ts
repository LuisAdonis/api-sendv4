import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "Api SendV4 con Express + TS + Mongo",
            version: "1.0.0",
            description: "Esta sera la version final antes de venta",
        },
        components: {
            schemas: {
                Ciudad: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "650fa9b9c8a1b2c3d4e5f678" },
                        codigo: { type: "string", example: "UIO" },
                        nombre: { type: "string", example: "Quito" },
                        descripcion: { type: "string", example: "Capital de Ecuador" },
                        createdAt: { type: "string", format: "date-time", example: "2025-09-23T20:00:00Z" },
                        updatedAt: { type: "string", format: "date-time", example: "2025-09-23T20:00:00Z" },

                    }
                },
                CiudadInput: {
                    type: "object",
                    required: ["codigo", "nombre", "descripcion"],
                    properties: {
                        codigo: { type: "string", example: "UIO" },
                        nombre: { type: "string", example: "Quito" },
                        descripcion: { type: "string", example: "Capital de Ecuador" }
                    }
                },
                HorarioTienda: {
                    type: "object",
                    properties: {
                        dia: { type: "string", example: "Lunes" },
                        apertura: { type: "string", example: "08:00" },
                        cierre: { type: "string", example: "18:00" }
                    }
                },
                Tienda: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        nombre: { type: "string", example: "Tienda 1" },
                        logo: { type: "string", example: "/uploads/tiendas/abc/logo.png" },
                        logo_banner: { type: "string", example: "/uploads/tiendas/abc/banner.png" },
                        direccion: { type: "string", example: "Av. Siempre Viva 123" },
                        latitud: { type: "number", example: -0.180653 },
                        longitud: { type: "number", example: -78.467834 },
                        telefono: { type: "string", example: "0987654321" },
                        email: { type: "string", example: "tienda@correo.com" },
                        estado: { type: "string", enum: ["activa", "cerrada", "suspendida", "eliminada"], example: "activa" },
                        tipo: { type: "string", example: "supermercado" },
                        ciudad_id: { type: "string" },
                        horario: { type: "array", items: { $ref: '#/components/schemas/HorarioTienda' } },
                        calificacion: { type: "number", example: 4.5 },
                        config_envio: {
                            type: "object",
                            properties: {
                                costo_envio: { type: "number", example: 2.5 },
                                tiempo_preparacion: { type: "number", example: 15 },
                                zonas_cobertura: { type: "array", items: { type: "string" } }
                            }
                        },
                        productos: { type: "array", items: { type: "string" } }
                    }
                },
                Usuario: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        uid: { type: "string", example: "firebase-uid-12345" },
                        email: { type: "string", example: "usuario@correo.com" },
                        nombre: { type: "string", example: "Juan Pérez" },
                        rol: { type: "string", enum: ["cliente", "repartidor", "admin"], example: "cliente" },
                        activo: { type: "boolean", example: true },
                        fecha_creacion: { type: "string", format: "date-time", example: "2025-09-23T20:00:00Z" },
                        createdAt: { type: "string", format: "date-time", example: "2025-09-23T20:00:00Z" },
                        updatedAt: { type: "string", format: "date-time", example: "2025-09-23T20:00:00Z" }
                    }
                },
                UsuarioInput: {
                    type: "object",
                    required: ["uid", "email", "nombre"],
                    properties: {
                        uid: { type: "string", example: "firebase-uid-12345" },
                        email: { type: "string", example: "usuario@correo.com" },
                        nombre: { type: "string", example: "Juan Pérez" },
                        rol: { type: "string", enum: ["cliente", "repartidor", "admin"], example: "cliente" },
                        activo: { type: "boolean", example: true }
                    }
                },
                HorarioDisponible: {
                    type: "object",
                    properties: {
                        dia: { type: "string", example: "Lunes" },
                        desde: { type: "string", example: "08:00" },
                        hasta: { type: "string", example: "18:00" }
                    }
                },
                Producto: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        tienda_id: { type: "string" },
                        nombre: { type: "string", example: "Producto 1" },
                        descripcion: { type: "string", example: "Descripción del producto" },
                        precio: { type: "number", example: 10.5 },
                        categoria: { type: "string", example: "bebidas" },
                        imagen_url: { type: "string", example: "/uploads/producto/abc/producto.png" },
                        disponible: { type: "string", enum: ["disponible", "no-disponible", "suspendido", "eliminado"], example: "disponible" },
                        horario_disponible: { type: "array", items: { $ref: "#/components/schemas/HorarioDisponible" } },
                        stock: { type: "number", example: 100 },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }

    },
    apis: ["./src/routes/*.ts"], // Rutas donde pondrás anotaciones
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
