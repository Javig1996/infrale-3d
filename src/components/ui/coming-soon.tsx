import Link from "next/link";

interface ComingSoonProps {
  title:       string;
  description: string;
  moduleCode:  string;
  moduleColor: string;
  icon:        React.ReactNode;
}

export function ComingSoon({ title, description, moduleCode, moduleColor, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Badge del módulo */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white mb-6 shadow-lg"
        style={{ background: moduleColor }}
      >
        {moduleCode}
      </div>

      {/* Icono de la funcionalidad */}
      <div className="w-16 h-16 rounded-2xl border border-surface-border bg-surface flex items-center justify-center text-slate-400 mb-6">
        {icon}
      </div>

      <h1 className="text-xl font-semibold text-slate-100 mb-2">{title}</h1>
      <p className="text-sm text-slate-400 mb-8 max-w-sm leading-relaxed">{description}</p>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border bg-surface text-xs text-slate-500 mb-8">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        En desarrollo — disponible próximamente
      </div>

      <Link href="/proyectos" className="btn-secondary text-sm">
        Ver proyectos
      </Link>
    </div>
  );
}
