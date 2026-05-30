import { Calendar }   from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Calendario de mantenimiento — Infrale 3D" };

export default function CalendarioPage() {
  return (
    <ComingSoon
      title="Calendario"
      description="Vista de calendario con todos los mantenimientos programados preventivos y correctivos."
      moduleCode="MT"
      moduleColor="#0A3C80"
      icon={<Calendar className="w-7 h-7" />}
    />
  );
}
