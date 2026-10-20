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
