import { Activity }   from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Monitoreo de equipos — Infrale 3D" };

export default function MonitoreoPage() {
  return (
    <ComingSoon
      title="Monitoreo de equipos"
      description="Monitoreo en tiempo real del estado operativo de equipos e instalaciones vinculados al modelo 3D."
      moduleCode="OP"
      moduleColor="#0891B2"
      icon={<Activity className="w-7 h-7" />}
    />
  );
}
