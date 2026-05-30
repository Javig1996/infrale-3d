import { Bell }        from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Gestión de alarmas — Infrale 3D" };

export default function AlarmasPage() {
  return (
    <ComingSoon
      title="Gestión de alarmas"
      description="Recibe, prioriza y gestiona alarmas operativas generadas por sensores y sistemas conectados."
      moduleCode="OP"
      moduleColor="#0891B2"
      icon={<Bell className="w-7 h-7" />}
    />
  );
}
