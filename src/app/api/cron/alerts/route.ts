import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }        from "@/lib/supabase/server";
import { Resend }                   from "resend";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today    = new Date();
  const in7days  = new Date(today); in7days.setDate(today.getDate() + 7);

  // Registros vencidos o próximos a vencer (en 7 días) con email configurado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recordsRaw } = await (supabase as any)
    .from("maintenance_records")
    .select(`
      id, title, type, priority, scheduled_date, alert_email,
      projects (name),
      model_elements (name, element_type)
    `)
    .eq("status", "pendiente")
    .not("alert_email", "is", null)
    .lte("scheduled_date", in7days.toISOString().split("T")[0]);

  const records = (recordsRaw ?? []) as {
    id: string; title: string; type: string; priority: string; scheduled_date: string; alert_email: string;
    projects: { name: string } | null;
    model_elements: { name: string } | null;
  }[];

  const from    = process.env.RESEND_FROM_EMAIL ?? "alertas@infrale3d.com";
  let   sent    = 0;
  const errors: string[] = [];

  for (const record of records) {
    const isOverdue = new Date(record.scheduled_date) < today;
    const { error } = await resend.emails.send({
      from,
      to:      [record.alert_email],
      subject: `${isOverdue ? "🔴 VENCIDO" : "⚠️ Próximo"}: ${record.title} — ${record.projects?.name ?? "Proyecto"}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050d1a;color:#e2e8f0;padding:32px;border-radius:12px;">
          <h1 style="color:#2563eb;font-size:18px;">${isOverdue ? "🔴 Mantenimiento Vencido" : "⚠️ Mantenimiento Próximo"}</h1>
          <p><strong>${record.title}</strong></p>
          <p>Proyecto: ${record.projects?.name ?? "—"}</p>
          ${record.model_elements ? `<p>Elemento: ${record.model_elements.name}</p>` : ""}
          <p>Tipo: ${record.type} · Prioridad: ${record.priority}</p>
          <p>Fecha: <strong style="color:#00d4ff;">${new Date(record.scheduled_date).toLocaleDateString("es-ES")}</strong></p>
          <p style="color:#475569;font-size:12px;margin-top:24px;">Enviado automáticamente por Infrale 3D</p>
        </div>
      `,
    });
    if (error) errors.push(`${record.id}: ${error.message}`);
    else sent++;
  }

  return NextResponse.json({ processed: records.length, sent, errors });
}
