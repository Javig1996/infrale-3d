import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Infrale 3D — Gestión de Infraestructuras",
  description: "Plataforma web para gestionar infraestructuras 3D de proyectos eléctricos, civiles y mecánicos.",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
