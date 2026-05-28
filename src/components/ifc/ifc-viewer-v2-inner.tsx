"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as OBC from "@thatopen/components";
import * as THREE from "three";
import { Loader2, AlertTriangle, RotateCcw, Grid3x3, Maximize2 } from "lucide-react";

interface Props {
  fileUrl: string;
  modelName: string;
}

const WASM_PATH = "https://cdn.jsdelivr.net/npm/web-ifc@0.0.77/";

export function IFCViewerV2Inner({ fileUrl, modelName }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const componentsRef  = useRef<OBC.Components | null>(null);
  const worldRef       = useRef<OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer> | null>(null);
  const modelRef       = useRef<THREE.Object3D | null>(null);
  const initialPosRef  = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  const [progress, setProgress] = useState(0);
  const [status,   setStatus]   = useState("Iniciando visor...");
  const [loaded,   setLoaded]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function prog(p: number, s: string) { setProgress(p); setStatus(s); }

  // Fijar cámara al bounding box del modelo
  async function fitCamera(world: typeof worldRef.current, model: THREE.Object3D) {
    if (!world) return;
    const box  = new THREE.Box3().setFromObject(model);
    const ctr  = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const dist = Math.max(size.x, size.y, size.z) * 1.8;
    const px   = ctr.x + dist * 0.7;
    const py   = ctr.y + dist * 0.5;
    const pz   = ctr.z + dist * 0.7;
    await world.camera.controls.setLookAt(px, py, pz, ctr.x, ctr.y, ctr.z, true);
    initialPosRef.current = {
      pos:    new THREE.Vector3(px, py, pz),
      target: ctr.clone(),
    };
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;

    (async () => {
      try {
        prog(5, "Iniciando visor 3D...");

        // Components
        const components = new OBC.Components();
        componentsRef.current = components;

        // World
        const worlds = components.get(OBC.Worlds);
        const world  = worlds.create<
          OBC.SimpleScene,
          OBC.OrthoPerspectiveCamera,
          OBC.SimpleRenderer
        >();
        worldRef.current = world;

        world.scene    = new OBC.SimpleScene(components);
        world.renderer = new OBC.SimpleRenderer(components, container);
        world.camera   = new OBC.OrthoPerspectiveCamera(components);

        // Escena
        world.scene.setup();
        world.scene.three.background = new THREE.Color(0x050d1a);

        // Iluminación adicional
        const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(50, 80, 50);
        world.scene.three.add(ambLight, dirLight);

        // Grilla
        const grids = components.get(OBC.Grids);
        grids.create(world);

        // Cámara inicial
        await world.camera.controls.setLookAt(5, 5, 5, 0, 0, 0);

        // Arrancar render loop
        components.init();

        // Resize automático
        const ro = new ResizeObserver(() => {
          if (world.renderer) {
            world.renderer.three.setSize(container.clientWidth, container.clientHeight);
            if (world.camera.three instanceof THREE.PerspectiveCamera) {
              world.camera.three.aspect = container.clientWidth / container.clientHeight;
              world.camera.three.updateProjectionMatrix();
            }
          }
        });
        ro.observe(container);

        // ── FragmentsManager — inicializar con worker desde CDN ──
        prog(20, "Inicializando motor de fragmentos...");
        const fragments = components.get(OBC.FragmentsManager);
        const workerURL = await OBC.FragmentsManager.getWorker();
        fragments.init(workerURL);

        // ── IFC Loader ──
        prog(32, "Configurando motor IFC...");
        const ifcLoader = components.get(OBC.IfcLoader);
        await ifcLoader.setup({
          wasm: { path: WASM_PATH, absolute: true },
        });

        // Descargar modelo
        prog(45, "Descargando modelo...");
        let res: Response;
        try { res = await fetch(fileUrl); }
        catch (e: unknown) { throw new Error("Error de red: " + (e instanceof Error ? e.message : e)); }
        if (!res.ok) throw new Error(`Error HTTP ${res.status} al descargar el modelo.`);

        prog(60, "Procesando geometría IFC...");
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        prog(75, "Construyendo mallas 3D...");
        const model = await ifcLoader.load(new Uint8Array(buffer), true, modelName);
        if (cancelled) return;

        modelRef.current = model.object;
        world.scene.three.add(model.object);

        prog(92, "Ajustando cámara...");
        await fitCamera(world, model.object);

        prog(100, "¡Modelo cargado!");
        if (!cancelled) setLoaded(true);

      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      if (componentsRef.current) {
        componentsRef.current.dispose();
        componentsRef.current = null;
        worldRef.current = null;
        modelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // ── Controles ─────────────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    const w   = worldRef.current;
    const ini = initialPosRef.current;
    if (!w || !ini) return;
    await w.camera.controls.setLookAt(
      ini.pos.x, ini.pos.y, ini.pos.z,
      ini.target.x, ini.target.y, ini.target.z,
      true
    );
  }, []);

  const handleWireframe = useCallback(() => {
    const model = modelRef.current;
    if (!model) return;
    const next = !wireframe;
    setWireframe(next);
    model.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => { if (m && "wireframe" in m) (m as THREE.MeshLambertMaterial).wireframe = next; });
      }
    });
  }, [wireframe]);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-[#050d1a] rounded-xl overflow-hidden">

      {/* Loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#050d1a]">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-300">{status}</p>
          <div className="w-56 h-1 bg-[#1e3a5f] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{progress}%</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#050d1a] px-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <h3 className="text-sm font-semibold text-red-400">Error al cargar el modelo</h3>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">{error}</p>
          <button
            onClick={() => { setError(null); setLoaded(false); setProgress(0); }}
            className="mt-2 px-4 py-2 rounded-lg bg-[#1e3a5f] border border-blue-500/30 text-sm text-slate-300 hover:text-white hover:bg-[#0f2035] transition-all"
          >
            ↺ Reintentar
          </button>
        </div>
      )}

      {/* Toolbar */}
      {loaded && (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={handleReset}
            title="Resetear cámara"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050d1aDD] border border-[#1e3a5f] text-slate-400 hover:text-white hover:border-blue-500 text-xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleWireframe}
            title="Alternar wireframe"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
              wireframe
                ? "bg-blue-500/20 border-blue-500/60 text-blue-300"
                : "bg-[#050d1aDD] border-[#1e3a5f] text-slate-400 hover:text-white hover:border-blue-500"
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5" /> Wireframe
          </button>
          <button
            onClick={handleFullscreen}
            title="Pantalla completa"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050d1aDD] border border-[#1e3a5f] text-slate-400 hover:text-white hover:border-blue-500 text-xs transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Status bar */}
      {loaded && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050d1aDD] border border-[#1e3a5f] text-xs text-slate-400 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-slate-300 font-medium">{modelName}</span>
          <span className="text-[#334155]">·</span>
          <span>Clic izquierdo orbita · Scroll zoom · Clic derecho pan</span>
        </div>
      )}

      {/* Canvas container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
