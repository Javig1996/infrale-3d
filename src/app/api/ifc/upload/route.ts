import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }        from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const file      = formData.get("file") as File | null;
    const projectId = formData.get("project_id") as string | null;
    const name      = formData.get("name") as string | null;
    const userId    = formData.get("user_id") as string | null;

    if (!file || !projectId || !userId) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".ifc")) {
      return NextResponse.json({ error: "Solo se permiten archivos .ifc" }, { status: 400 });
    }

    const supabase  = createAdminClient();
    const filePath  = `${projectId}/${Date.now()}_${file.name}`;
    const bytes     = await file.arrayBuffer();
    const buffer    = Buffer.from(bytes);

    const { error: uploadErr } = await supabase.storage
      .from("ifc-models")
      .upload(filePath, buffer, { contentType: "application/octet-stream", upsert: false });

    if (uploadErr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json({ error: (uploadErr as any).message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("ifc-models").getPublicUrl(filePath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: model, error: dbErr } = await (supabase as any)
      .from("ifc_models")
      .insert({
        project_id:  projectId,
        name:        name || file.name.replace(".ifc", ""),
        file_url:    urlData.publicUrl,
        file_size:   file.size,
        uploaded_by: userId,
        status:      "procesado",
      })
      .select("id, name, file_url, file_size, created_at")
      .single();

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ model });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
