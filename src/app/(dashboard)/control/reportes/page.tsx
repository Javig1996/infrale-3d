import { FileText }    from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Reportes — Infrale 3D" };

export default function ReportesPage() {
  return (
    <ComingSoon
      title="Reportes"
      description="Genera reportes automáticos de avance, costos y cumplimiento para stakeholders del proyecto."
      moduleCode="CP"
      moduleColor="#1257B4"
      icon={<FileText className="w-7 h-7" />}
    />
  );
}
