import { TrendingUp }  from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "KPI operativos — Infrale 3D" };

export default function KpiPage() {
  return (
    <ComingSoon
      title="KPI operativos"
      description="Panel de indicadores clave de desempeño operativo con tendencias y comparativas históricas."
      moduleCode="OP"
      moduleColor="#0891B2"
      icon={<TrendingUp className="w-7 h-7" />}
    />
  );
}
