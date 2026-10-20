type Props = { label: string; className?: string; imageUrl?: string; priority?: boolean };
const hotelPhotos: Array<[string, string]> = [
  ['naturaleza viva', '/images/eden-nature.jpg'],
  ['gastronomía', '/images/churrasco.jpg'],
  ['restaurante', '/images/churrasco.jpg'],
  ['piscinas termales entre montañas', '/images/termales-piscina.png'],
  ['experiencia spa', '/images/spa-bienestar.png'],
  ['pasaporte', '/images/pasaporte-epico.jpg'],
  ['camping', '/images/camping-naturaleza.png'],
];
export default function ImagePlaceholder({ label, className = '', imageUrl, priority = false }: Props) {
  // No conservar dependencia visual con el antiguo sitio público. Si el PMS
  // devuelve por error una imagen alojada allí, usamos la copia local del proyecto.
  const fromOldWebsite = isOldWebsiteAsset(imageUrl);
  const photoUrl = (!fromOldWebsite ? imageUrl : undefined) || hotelPhotos.find(([key]) => label.toLocaleLowerCase('es').includes(key))?.[1];
  return <div className={`image-placeholder ${className}`} role="img" aria-label={label}>
    {photoUrl && <img className="hotel-photo" src={photoUrl} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'}/>}
    <span className="placeholder-symbol">✳</span><b>{label}</b>{!photoUrl && <small>Fotografía del hotel pendiente de agregar</small>}
  </div>;
}

function isOldWebsiteAsset(url?: string) {
  if (!url) return false;
  try {
    const host = new URL(url, 'https://local.invalid').hostname.toLowerCase();
    return host === 'paraisotermal.com.co' || host === 'www.paraisotermal.com.co';
  } catch {
    return false;
  }
}
