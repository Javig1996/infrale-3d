"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const IFCViewerV2Inner = dynamic(
  () => import("./ifc-viewer-v2-inner").then(m => ({ default: m.IFCViewerV2Inner })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#050d1a] rounded-xl">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    ),
  }
);

interface Props {
  fileUrl: string;
  modelName: string;
}

export function IFCViewerV2({ fileUrl, modelName }: Props) {
  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-surface-border"
      style={{ height: "calc(100vh - 140px)", minHeight: "500px" }}
    >
      <IFCViewerV2Inner fileUrl={fileUrl} modelName={modelName} />
    </div>
  );
}
