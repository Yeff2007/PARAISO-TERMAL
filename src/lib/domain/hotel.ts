export type HotelContent = {
  id: string;
  name: string;
  description?: string;
  contact?: { phone?: string; email?: string; address?: string };
  location?: { latitude?: number; longitude?: number; mapUrl?: string };
  policies?: string[];
  amenities?: string[];
  images?: ImageAsset[];
};

export type ImageAsset = {
  id?: string;
  url: string;
  alt?: string;
  title?: string;
  sortOrder?: number;
};

/** Datos ya usados como respaldo en la portada; la API pública del PMS no expone hotel/contacto. */
export const paraisoHotelContent: HotelContent = {
  id: 'paraiso-termal',
  name: 'Paraíso Termal',
  contact: {
    phone: '+57 311 506 0379',
    email: 'paraisotermal@hotmail.com',
    address: 'Kilómetro 32, vía Machetá–Guateque, Boyacá, Colombia.',
  },
  location: { mapUrl: 'https://maps.google.com/?q=Paraiso+Termal+Macheta+Guateque' },
};
