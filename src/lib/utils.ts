import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  }).format(new Date(date));
}

export function formatDateRelative(date: string | Date | null): string {
  if (!date) return "—";
  const d    = new Date(date);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60)   return "ahora mismo";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
  return formatDate(date);
}

export const PROJECT_TYPES = [
  { value: "electrico",  label: "Eléctrico",  color: "badge-electrico"  },
  { value: "civil",      label: "Civil",       color: "badge-civil"      },
  { value: "mecanico",   label: "Mecánico",    color: "badge-mecanico"   },
] as const;

export type ProjectType = typeof PROJECT_TYPES[number]["value"];

export const MEMBER_ROLES = [
  { value: "admin",   label: "Administrador", class: "badge-admin"   },
  { value: "editor",  label: "Editor",         class: "badge-editor"  },
  { value: "viewer",  label: "Visualizador",   class: "badge-viewer"  },
] as const;

export type MemberRole = typeof MEMBER_ROLES[number]["value"];

export function getProjectTypeBadge(type: string) {
  return PROJECT_TYPES.find(t => t.value === type) ?? PROJECT_TYPES[0];
}

export function getRoleBadge(role: string) {
  return MEMBER_ROLES.find(r => r.value === role) ?? MEMBER_ROLES[2];
}
