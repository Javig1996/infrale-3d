"use client";

import { useState, useRef }  from "react";
import { Upload, Loader2, FileBox, X, CheckCircle } from "lucide-react";
import { createClient }      from "@/lib/supabase/client";
import { useRouter }         from "next/navigation";

interface Props {
  projectId: string;
}

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
    setError(null); setUpl(true); setDone(false); setFile(file.name); setProg(10);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("No autenticado"); setUpl(false); return; }

    // Upload directo al Storage desde el browser (sin pasar por la API route)
    const filePath = `${projectId}/${Date.now()}_${file.name}`;
    setProg(30);

    const { error: uploadErr } = await supabase.storage
      .from("ifc-models")
      .upload(filePath, file, { contentType: "application/octet-stream", upsert: false });

    if (uploadErr) {
      setError(uploadErr.message); setUpl(false); return;
    }
    setProg(75);

    const { data: urlData } = supabase.storage.from("ifc-models").getPublicUrl(filePath);

    // Registrar metadata en la DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbErr } = await (supabase as any).from("ifc_models").insert({
      project_id:  projectId,
      filename:    file.name.replace(/\.ifc$/i, ""),
      r2_key:      filePath,
      r2_url:      urlData.publicUrl,
      size_bytes:  file.size,
      uploaded_by: user.id,
    });

    if (dbErr) { setError(dbErr.message); setUpl(false); return; }

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
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
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
            <Loader2 className="w-8 h-8 text-brand-300 animate-spin" />
            <p className="text-sm text-slate-300">{fileName}</p>
            <div className="w-full max-w-xs bg-surface-border rounded-full h-1.5">
              <div className="bg-brand-300 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-500">{progress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-300/10 border border-brand-300/20 flex items-center justify-center">
              <FileBox className="w-6 h-6 text-brand-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Arrastra tu modelo IFC aquí</p>
              <p className="text-xs text-slate-500 mt-1">o haz clic para seleccionar · Solo archivos .ifc</p>
            </div>
            <button type="button" className="btn-secondary text-xs px-3 py-1.5">
              <Upload className="w-3.5 h-3.5" /> Seleccionar archivo
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
