import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }        from "@/lib/supabase/server";
import { Resend }                   from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  try {
    const { recordId } = await req.json();
    if (!recordId) return NextResponse.json({ error: "recordId requerido" }, { status: 400 });

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recordRaw } = await (supabase as any)
      .from("maintenance_records")
      .select(`
        id, title, description, type, priority, scheduled_date, next_maintenance_date, alert_email,
        projects (name),
        model_elements (name, element_type)
      `)
      .eq("id", recordId)
      .single();

    if (!recordRaw) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

    type RecordFull = {
      id: string; title: string; description: string; type: string; priority: string;
      scheduled_date: string; next_maintenance_date: string | null; alert_email: string | null;
      projects: { name: string } | null;
      model_elements: { name: string; element_type: string } | null;
    };
    const record = recordRaw as RecordFull;

    if (!record.alert_email) {
      return NextResponse.json({ error: "Sin email de alerta configurado" }, { status: 400 });
    }

    const from = process.env.RESEND_FROM_EMAIL ?? "alertas@infrale3d.com";

    const { error } = await resend.emails.send({
      from,
      to:      [record.alert_email],
      subject: `⚠️ Alerta de mantenimiento: ${record.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050d1a;color:#e2e8f0;padding:32px;border-radius:12px;">
          <div style="border-bottom:1px solid #1e3a5f;padding-bottom:16px;margin-bottom:24px;">
            <h1 style="color:#2563eb;font-size:20px;margin:0;">Infrale 3D</h1>
            <p style="color:#64748b;margin:4px 0 0;font-size:13px;">Sistema de Gestión de Infraestructuras</p>
          </div>

          <h2 style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">⚠️ Alerta de Mantenimiento</h2>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">Se ha programado el siguiente mantenimiento que requiere atención.</p>

          <div style="background:#0f2035;border:1px solid #1e3a5f;border-radius:8px;padding:20px;margin-bottom:20px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#64748b;font-size:13px;padding:6px 0;width:140px;">Proyecto:</td>
                <td style="color:#e2e8f0;font-size:13px;font-weight:600;">${record.projects?.name ?? "—"}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:6px 0;">Mantenimiento:</td>
                <td style="color:#e2e8f0;font-size:13px;font-weight:600;">${record.title}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:6px 0;">Tipo:</td>
                <td style="color:#e2e8f0;font-size:13px;">${record.type}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:6px 0;">Prioridad:</td>
                <td style="color:${record.priority === "critica" ? "#f87171" : record.priority === "alta" ? "#fb923c" : "#e2e8f0"};font-size:13px;font-weight:600;text-transform:uppercase;">${record.priority}</td>
              </tr>
              ${record.model_elements ? `
              <tr>
                <td style="color:#64748b;font-size:13px;padding:6px 0;">Elemento:</td>
                <td style="color:#e2e8f0;font-size:13px;">${record.model_elements.name} (${record.model_elements.element_type})</td>
              </tr>` : ""}
              <tr>
                <td style="color:#64748b;font-size:13px;padding:6px 0;">Fecha programada:</td>
                <td style="color:#00d4ff;font-size:13px;font-weight:600;">${new Date(record.scheduled_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</td>
              </tr>
              ${record.next_maintenance_date ? `
              <tr>
                <td style="color:#64748b;font-size:13px;padding:6px 0;">Próximo:</td>
                <td style="color:#e2e8f0;font-size:13px;">${new Date(record.next_maintenance_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</td>
              </tr>` : ""}
            </table>
          </div>

          ${record.description ? `
          <div style="background:#0f2035;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="color:#64748b;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Descripción</p>
            <p style="color:#94a3b8;font-size:13px;margin:0;">${record.description}</p>
          </div>` : ""}

          <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px;border-top:1px solid #1e3a5f;padding-top:16px;">
            Este mensaje fue enviado automáticamente por Infrale 3D
          </p>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
