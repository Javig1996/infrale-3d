import { createClient }   from "@/lib/supabase/server";
import { notFound }       from "next/navigation";
import Link               from "next/link";
import { ArrowLeft, Box } from "lucide-react";
import { IFCViewer }      from "@/components/ifc/ifc-viewer";

interface Props {
  params: { id: string; modelId: string };
}

export default async function VisorPage({ params }: Props) {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modelRaw } = await (supabase as any)
    .from("ifc_models")
    .select("id, filename, r2_url, size_bytes, uploaded_at, project_id")
    .eq("id", params.modelId)
    .eq("project_id", params.id)
    .single();

  type IFCModelRow = { id: string; filename: string; r2_url: string; size_bytes: number | null; uploaded_at: string };
  const model = modelRaw as IFCModelRow | null;
  if (!model) notFound();

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center gap-4">
        <Link href={`/proyectos/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-brand-300" />
          <h1 className="text-lg font-semibold text-slate-100">{model.filename}</h1>
        </div>
        {model.size_bytes && (
          <div className="ml-auto text-xs text-slate-500">
            {(model.size_bytes / 1024 / 1024).toFixed(2)} MB
          </div>
        )}
      </div>

      <div className="flex-1">
        <IFCViewer fileUrl={model.r2_url} modelName={model.filename} />
      </div>
    </div>
  );
}
