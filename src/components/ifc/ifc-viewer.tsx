"use client";

interface Props {
  fileUrl: string;
  modelName: string;
}

export function IFCViewer({ fileUrl, modelName }: Props) {
  const src = `/ifc-viewer/index.html?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(modelName)}`;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-surface-border" style={{ height: "600px" }}>
      <iframe
        src={src}
        className="w-full h-full"
        title={`Visor IFC — ${modelName}`}
      />
    </div>
  );
}
