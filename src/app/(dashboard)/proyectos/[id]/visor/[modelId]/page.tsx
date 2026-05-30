import { createClient }     from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CockpitShell }       from "@/components/cockpit/cockpit-shell";
import type { Profile }       from "@/types/database";

interface Props {
  params: { id: string; modelId: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("ifc_models").select("filename").eq("id", params.modelId).single();
  return { title: data ? `${data.filename} — Cockpit · Infrale 3D` : "Cockpit — Infrale 3D" };
}

export default async function VisorPage({ params }: Props) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* ── Datos en paralelo ── */
  const [
    { data: modelRaw },
    { data: projectRaw },
    { data: profileRaw },
    { data: elementsRaw },
    { data: maintenanceRaw },
  ] = await Promise.all([
    // Modelo IFC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("ifc_models")
      .select("id, filename, r2_url, size_bytes, project_id")
      .eq("id", params.modelId)
      .eq("project_id", params.id)
      .single(),

    // Proyecto (nombre)
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", params.id)
      .single(),

    // Perfil del usuario
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single(),

    // Elementos con progreso, fichas y documentos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("model_elements")
      .select(`
        id, name, element_type, ifc_guid,
        element_progress ( progress_percentage, status, notes, updated_at ),
        element_technical_info ( manufacturer, model, serial_number, installation_date, warranty_expiry, notes ),
        element_documents ( id, name, file_url, file_size, document_type, created_at )
      `)
      .eq("project_id", params.id)
      .order("name", { ascending: true })
      .limit(500),

    // Registros de mantenimiento
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("maintenance_records")
      .select("id, element_id, maintenance_date, type, technician_name, description, result, next_maintenance_date")
      .eq("project_id", params.id)
      .order("maintenance_date", { ascending: false })
      .limit(100),
  ]);

  type IFCModelRow = { id: string; filename: string; r2_url: string; size_bytes: number | null };
  type ProjectRow  = { id: string; name: string };

  const model   = modelRaw   as IFCModelRow | null;
  const project = projectRaw as ProjectRow  | null;

  if (!model) notFound();

  const profile = profileRaw as Pick<Profile, "full_name"> & { email?: string } | null;

  return (
    <CockpitShell
      fileUrl={model.r2_url}
      modelName={model.filename}
      modelId={model.id}
      projectId={params.id}
      projectName={project?.name ?? "Proyecto"}
      sizeBytes={model.size_bytes}
      profile={{
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? user.email ?? "",
      }}
      elements={elementsRaw ?? []}
      maintenanceRecords={maintenanceRaw ?? []}
    />
  );
}
