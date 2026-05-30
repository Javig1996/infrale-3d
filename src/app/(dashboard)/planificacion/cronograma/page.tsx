import { CalendarRange } from "lucide-react";
import { ComingSoon }    from "@/components/ui/coming-soon";

export const metadata = { title: "Cronograma de obra — Infrale 3D" };

export default function CronogramaPage() {
  return (
    <ComingSoon
      title="Cronograma de obra"
      description="Visualiza y gestiona el cronograma completo de la obra con diagramas de Gantt y línea base."
      moduleCode="PL"
      moduleColor="#0E4DA4"
      icon={<CalendarRange className="w-7 h-7" />}
    />
  );
}
