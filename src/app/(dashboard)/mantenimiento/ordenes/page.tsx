import { Wrench }      from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Órdenes de trabajo — Infrale 3D" };

export default function OrdenesPage() {
  return (
    <ComingSoon
      title="Órdenes de trabajo"
      description="Crea, asigna y rastrea órdenes de trabajo de mantenimiento vinculadas a elementos del modelo 3D."
      moduleCode="MT"
      moduleColor="#0A3C80"
      icon={<Wrench className="w-7 h-7" />}
    />
  );
}
