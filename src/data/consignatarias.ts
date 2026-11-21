// Datos de la demo de /consignatarias/. "Faro Autos" es una consignataria inventada.
// Precios, kilometrajes y referencias son de muestra; las fotos son ilustrativas.

export type CarType = 'SUV' | 'Sedán' | 'Hatchback' | 'Pickup';

export interface DemoCar {
  ref: string;
  make: string;
  model: string;
  version: string;
  type: CarType;
  year: number;
  km: number;
  price: number;
  city: 'Pereira' | 'Bucaramanga';
  transmission: 'Automática' | 'Mecánica';
  fuel: 'Gasolina' | 'Diésel';
  engine: string;
  color: string;
  photo: string;
  spin?: boolean;
}

export const demoStore = {
  name: 'Faro Autos',
  domain: 'faroautos.com.co',
};

export const demoCars: DemoCar[] = [
  { ref: 'FA-0142', make: 'Toyota', model: 'Land Cruiser Prado', version: 'TX-L 4x4', type: 'SUV', year: 2020, km: 72000, price: 219900000, city: 'Pereira', transmission: 'Automática', fuel: 'Diésel', engine: '2.8 turbo', color: 'Negro', photo: 'toyota-land-cruiser.webp', spin: true },
  { ref: 'FA-0139', make: 'Mazda', model: 'CX-30', version: 'Grand Touring', type: 'SUV', year: 2022, km: 34000, price: 104900000, city: 'Pereira', transmission: 'Automática', fuel: 'Gasolina', engine: '2.0', color: 'Rojo', photo: 'mazda-cx30.webp' },
  { ref: 'FA-0131', make: 'Toyota', model: 'Hilux', version: '2.4 doble cabina 4x4', type: 'Pickup', year: 2019, km: 98000, price: 139900000, city: 'Bucaramanga', transmission: 'Mecánica', fuel: 'Diésel', engine: '2.4 turbo', color: 'Plata', photo: 'toyota-hilux.webp' },
  { ref: 'FA-0136', make: 'Nissan', model: 'Kicks', version: 'Exclusive', type: 'SUV', year: 2021, km: 39000, price: 78900000, city: 'Pereira', transmission: 'Automática', fuel: 'Gasolina', engine: '1.6', color: 'Naranja y negro', photo: 'nissan-kicks.webp' },
  { ref: 'FA-0128', make: 'Renault', model: 'Duster', version: 'Intens', type: 'SUV', year: 2021, km: 41000, price: 72500000, city: 'Bucaramanga', transmission: 'Automática', fuel: 'Gasolina', engine: '1.3 turbo', color: 'Gris', photo: 'renault-duster.webp' },
  { ref: 'FA-0125', make: 'Mazda', model: '3', version: 'Touring sedán', type: 'Sedán', year: 2019, km: 61000, price: 69900000, city: 'Bucaramanga', transmission: 'Automática', fuel: 'Gasolina', engine: '2.0', color: 'Gris', photo: 'mazda-3.webp' },
  { ref: 'FA-0133', make: 'Chevrolet', model: 'Onix', version: 'Premier sedán', type: 'Sedán', year: 2022, km: 28000, price: 66900000, city: 'Pereira', transmission: 'Automática', fuel: 'Gasolina', engine: '1.0 turbo', color: 'Blanco', photo: 'chevrolet-onix.webp' },
  { ref: 'FA-0119', make: 'Kia', model: 'Picanto', version: 'Vibrant', type: 'Hatchback', year: 2020, km: 52000, price: 45900000, city: 'Bucaramanga', transmission: 'Mecánica', fuel: 'Gasolina', engine: '1.25', color: 'Azul', photo: 'kia-picanto.webp' },
];

/** Vistas del escaparate 360°, en orden de giro. */
export const spinFrames = Array.from({ length: 8 }, (_, i) => `consignatarias/360/${String(i).padStart(2, '0')}.webp`);

export const pesos = (value: number) => `$${value.toLocaleString('es-CO')}`;
export const kms = (value: number) => `${value.toLocaleString('es-CO')} km`;
