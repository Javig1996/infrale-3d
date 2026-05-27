import { createClient }   from "@/lib/supabase/server";
import { notFound }       from "next/navigation";
import Link               from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { OperacionClient }  from "@/components/operacion/operacion-client";

interface Props { params: { id: string } }

export default async function OperacionPage({ params }: Props) {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projectRaw } = await (supabase as any)
    .from("projects")
    .select("id, name, type")
    .eq("id", params.id)
    .single();

  if (!projectRaw) notFound();
  const project = projectRaw as { id: string; name: string; type: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: elementsRaw } = await (supabase as any)
    .from("model_elements")
    .select(`
      id, name, element_type, ifc_guid, properties,
      element_technical_info (id, manufacturer, model, serial_number, installation_date, warranty_expiry, specifications, notes),
      element_documents (id, name, file_url, file_size, document_type, created_at)
    `)
    .eq("project_id", params.id)
    .order("element_type");

  type TechInfo = {
    id: string; manufacturer: string; model: string; serial_number: string;
    installation_date: string; warranty_expiry: string; specifications: Record<string, string>; notes: string;
  };
  type DocRow = { id: string; name: string; file_url: string; file_size: number; document_type: string; created_at: string };
  type ElementRow = {
    id: string; name: string; element_type: string; ifc_guid: string; properties: Record<string, unknown>;
    element_technical_info: TechInfo[];
    element_documents: DocRow[];
  };
  const elements = (elementsRaw ?? []) as ElementRow[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/proyectos/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-brand-300" />
            Operación
          </h1>
          <p className="text-sm text-slate-500">{project.name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-brand-200">{elements.length}</p>
          <p className="text-xs text-slate-500">Elementos</p>
        </div>
      </div>

      <OperacionClient projectId={params.id} elements={elements} />
    </div>
  );
}
