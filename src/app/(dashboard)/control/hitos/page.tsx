import { Flag }        from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Cumplimiento de hitos — Infrale 3D" };

export default function HitosPage() {
  return (
    <ComingSoon
      title="Cumplimiento de hitos"
      description="Monitorea el cumplimiento de hitos críticos del proyecto con semáforos y alertas automáticas."
      moduleCode="CP"
      moduleColor="#1257B4"
      icon={<Flag className="w-7 h-7" />}
    />
  );
}
