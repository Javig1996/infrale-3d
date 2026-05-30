import { History }     from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Historial de elementos — Infrale 3D" };

export default function HistorialPage() {
  return (
    <ComingSoon
      title="Historial de elementos"
      description="Consulta el historial completo de intervenciones, reemplazos y estados de cada elemento del modelo."
      moduleCode="MT"
      moduleColor="#0A3C80"
      icon={<History className="w-7 h-7" />}
    />
  );
}
