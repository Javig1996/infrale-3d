import { Users }       from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Asignación de equipo — Infrale 3D" };

export default function EquipoPage() {
  return (
    <ComingSoon
      title="Asignación de equipo"
      description="Gestiona la asignación de personas y recursos a cada actividad del proyecto."
      moduleCode="PL"
      moduleColor="#0E4DA4"
      icon={<Users className="w-7 h-7" />}
    />
  );
}
