import { DollarSign }  from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Estimación de costos — Infrale 3D" };

export default function CostosPage() {
  return (
    <ComingSoon
      title="Estimación de costos"
      description="Estima y controla el presupuesto de obra con desglose por partidas y elementos del modelo."
      moduleCode="PL"
      moduleColor="#0E4DA4"
      icon={<DollarSign className="w-7 h-7" />}
    />
  );
}
