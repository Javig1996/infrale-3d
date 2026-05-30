import { Database }   from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Control de costos — Infrale 3D" };

export default function CostosMantenimientoPage() {
  return (
    <ComingSoon
      title="Control de costos"
      description="Seguimiento de costos asociados a mantenimientos ejecutados con análisis por tipo y periodo."
      moduleCode="MT"
      moduleColor="#0A3C80"
      icon={<Database className="w-7 h-7" />}
    />
  );
}
