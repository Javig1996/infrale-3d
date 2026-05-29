import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider }    from "@/components/ui/toast";
import { CommandProvider }  from "@/components/ui/command-provider";
import { TooltipProvider }  from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title:       "Infrale 3D — Gestión de Infraestructuras",
  description: "Plataforma web para gestionar infraestructuras 3D de proyectos eléctricos, civiles y mecánicos.",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        <TooltipProvider delayDuration={400}>
          <ToastProvider>
            <CommandProvider>
              {children}
            </CommandProvider>
          </ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
