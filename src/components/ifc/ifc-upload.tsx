"use client";

import { useState, useRef }  from "react";
import { Upload, Loader2, FileBox, CheckCircle, AlertCircle } from "lucide-react";
import { createClient }      from "@/lib/supabase/client";
import { useRouter }         from "next/navigation";

interface Props {
  projectId: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function IFCUpload({ projectId }: Props) {
  const router               = useRouter();
  const inputRef             = useRef<HTMLInputElement>(null);
  const [dragging, setDrag]  = useState(false);
  const [uploading, setUpl]  = useState(false);
  const [progress, setProg]  = useState(0);
  const [error, setError]    = useState<string | null>(null);
  const [done, setDone]      = useState(false);
  const [fileName, setFile]  = useState<string | null>(null);

  async function upload(file: File) {
    if (!file.name.toLowerCase().endsWith(".ifc")) {
      setError("Solo se aceptan archivos .ifc"); return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError("El archivo no puede superar 500 MB"); return;
    }
    setError(null); setUpl(true); setDone(false); setFile(file.name); setProg(2);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Sesión expirada. Recarga la página."); setUpl(false); return; }

    const filePath = `${projectId}/${Date.now()}_${file.name}`;

    // Upload directo al Storage vía XHR para obtener progreso real
    const uploadErr = await new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          // progreso del 2% al 80% durante la subida
          setProg(Math.round(2 + (e.loaded / e.total) * 78));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(null);
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            resolve(body.error ?? body.message ?? `Error ${xhr.status}`);
          } catch {
            resolve(`Error ${xhr.status}: ${xhr.statusText}`);
          }
        }
      };

      xhr.onerror = () => resolve("Error de conexión al subir el archivo. Verifica tu internet.");
      xhr.ontimeout = () => resolve("Tiempo de espera agotado.");

      xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/ifc-models/${filePath}`);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "false");
      xhr.timeout = 10 * 60 * 1000; // 10 min para archivos grandes
      xhr.send(file);
    });

    if (uploadErr) {
      setError(uploadErr);
      setUpl(false);
      return;
    }
    setProg(85);

    const { data: urlData } = supabase.storage.from("ifc-models").getPublicUrl(filePath);
    setProg(90);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbErr } = await (supabase as any).from("ifc_models").insert({
      project_id:  projectId,
      filename:    file.name.replace(/\.ifc$/i, ""),
      r2_key:      filePath,
      r2_url:      urlData.publicUrl,
      size_bytes:  file.size,
      uploaded_by: session.user.id,
    });

    if (dbErr) { setError(`Error al guardar el modelo: ${dbErr.message}`); setUpl(false); return; }

    setProg(100); setDone(true); setUpl(false);
    setTimeout(() => { setDone(false); setFile(null); setProg(0); router.refresh(); }, 2000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging  ? "border-brand-300 bg-brand-300/10" :
          done      ? "border-green-500/50 bg-green-500/5" :
          "border-surface-border hover:border-surface-active hover:bg-surface-hover"
        }`}
      >
        <input ref={inputRef} type="file" accept=".ifc" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />

        {done ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <p className="text-sm text-green-400 font-medium">Modelo subido correctamente</p>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 text-brand-300 animate-spin" />
            <p className="text-sm text-slate-300 truncate max-w-[240px]">{fileName}</p>
            <div className="w-full max-w-xs">
              <div className="bg-surface-border rounded-full h-1.5">
                <div
                  className="bg-brand-300 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 text-right">{progress}%</p>
            </div>
            <p className="text-xs text-slate-600">
              {progress < 80 ? "Subiendo archivo…" : progress < 95 ? "Registrando modelo…" : "Finalizando…"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-300/10 border border-brand-300/20 flex items-center justify-center">
              <FileBox className="w-6 h-6 text-brand-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Arrastra tu modelo IFC aquí</p>
              <p className="text-xs text-slate-500 mt-1">o haz clic para seleccionar · Solo archivos .ifc · máx. 500 MB</p>
            </div>
            <button type="button" className="btn-secondary text-xs px-3 py-1.5">
              <Upload className="w-3.5 h-3.5" /> Seleccionar archivo
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error al subir el modelo</p>
            <p className="text-xs mt-0.5 text-red-300/80">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
