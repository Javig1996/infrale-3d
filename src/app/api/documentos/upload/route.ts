import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }        from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const file      = formData.get("file") as File | null;
    const elementId = formData.get("element_id") as string | null;
    const projectId = formData.get("project_id") as string | null;
    const userId    = formData.get("user_id") as string | null;
    const docType   = formData.get("doc_type") as string ?? "otro";

    if (!file || !elementId || !projectId || !userId) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const filePath = `${projectId}/${elementId}/${Date.now()}_${file.name}`;
    const bytes    = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(filePath, Buffer.from(bytes), {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadErr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json({ error: (uploadErr as any).message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: doc, error: dbErr } = await (supabase as any)
      .from("element_documents")
      .insert({
        element_id:    elementId,
        project_id:    projectId,
        name:          file.name,
        file_url:      urlData.publicUrl,
        file_size:     file.size,
        file_type:     file.type,
        document_type: docType,
        uploaded_by:   userId,
      })
      .select("id, name, file_url, file_size, document_type, created_at")
      .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    return NextResponse.json({ doc });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
