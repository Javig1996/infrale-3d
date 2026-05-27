import { createClient }   from "@/lib/supabase/server";
import { notFound }       from "next/navigation";
import dynamic            from "next/dynamic";
import Link               from "next/link";
import { ArrowLeft, Box } from "lucide-react";

const IFCViewer = dynamic(
  () => import("@/components/ifc/ifc-viewer").then(m => m.IFCViewer),
  { ssr: false }
);

interface Props {
  params: { id: string; modelId: string };
}

export default async function VisorPage({ params }: Props) {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modelRaw } = await (supabase as any)
    .from("ifc_models")
    .select("id, name, file_url, file_size, created_at, project_id")
    .eq("id", params.modelId)
    .eq("project_id", params.id)
    .single();

  const model = modelRaw as { id: string; name: string; file_url: string; file_size: number; created_at: string } | null;
  if (!model) notFound();

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/proyectos/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-brand-300" />
          <h1 className="text-lg font-semibold text-slate-100">{model.name}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span>{(model.file_size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>

      {/* Visor */}
      <div className="flex-1">
        <IFCViewer fileUrl={model.file_url} modelName={model.name} />
      </div>
    </div>
  );
}
