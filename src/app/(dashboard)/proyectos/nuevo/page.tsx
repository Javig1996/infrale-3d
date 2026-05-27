import { ProjectForm } from "@/components/proyectos/project-form";
import { ArrowLeft }   from "lucide-react";
import Link            from "next/link";

export const metadata = { title: "Nuevo proyecto — Infrale 3D" };

export default function NuevoProyectoPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/proyectos" className="btn-ghost -ml-2 mb-4 inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Volver a proyectos
        </Link>
        <h1 className="text-2xl font-bold text-slate-100">Nuevo proyecto</h1>
        <p className="text-sm text-slate-500 mt-1">Completa los datos para crear tu proyecto de infraestructura 3D</p>
      </div>
      <ProjectForm />
    </div>
  );
}
