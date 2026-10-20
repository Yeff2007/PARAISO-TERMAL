import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Paraíso Termal | Naturaleza, bienestar y descanso',
  description: 'Descubre las experiencias termales, hospedaje, spa y planes de Paraíso Termal.',
  openGraph: { title: 'Paraíso Termal', description: 'Naturaleza, bienestar y descanso.', type: 'website' }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
