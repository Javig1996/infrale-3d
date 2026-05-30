import { Clock4 }      from "lucide-react";
import { ComingSoon }  from "@/components/ui/coming-soon";

export const metadata = { title: "Time Liner — Infrale 3D" };

export default function TimeLinerPage() {
  return (
    <ComingSoon
      title="Time Liner"
      description="Línea de tiempo interactiva para vincular hitos del proyecto con el modelo 3D."
      moduleCode="PL"
      moduleColor="#0E4DA4"
      icon={<Clock4 className="w-7 h-7" />}
    />
  );
}
