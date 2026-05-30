export type ModuleId = "pl" | "cp" | "op" | "mt";

export interface ModuleNavItem {
  label:    string;
  href:     string;
  iconName: string;
}

export interface ModuleConfig {
  id:          ModuleId;
  code:        string;
  name:        string;
  color:       string;
  textColor:   string;
  description: string;
  features:    string[];
  nav:         ModuleNavItem[];
}

export const MODULES: Record<ModuleId, ModuleConfig> = {
  pl: {
    id:          "pl",
    code:        "PL",
    name:        "Planificación",
    color:       "#0E4DA4",
    textColor:   "#ffffff",
    description: "Gestiona cronogramas, equipos y estimaciones de costos del proyecto",
    features:    ["Cronograma de obra", "Time Liner", "Asignación de equipo", "Estimación de costos"],
    nav: [
      { label: "Dashboard",            href: "/dashboard",                  iconName: "LayoutDashboard" },
      { label: "Proyectos",            href: "/proyectos",                  iconName: "FolderKanban"    },
      { label: "Cronograma de obra",   href: "/planificacion/cronograma",   iconName: "CalendarRange"   },
      { label: "Time Liner",           href: "/planificacion/time-liner",   iconName: "Clock4"          },
      { label: "Asignación de equipo", href: "/planificacion/equipo",       iconName: "Users"           },
      { label: "Estimación de costos", href: "/planificacion/costos",       iconName: "DollarSign"      },
    ],
  },
  cp: {
    id:          "cp",
    code:        "CP",
    name:        "Control de proyecto",
    color:       "#1257B4",
    textColor:   "#ffffff",
    description: "Controla reportes y cumplimiento de hitos del proyecto",
    features:    ["Reportes", "Cumplimiento de hitos"],
    nav: [
      { label: "Dashboard",             href: "/dashboard",       iconName: "LayoutDashboard" },
      { label: "Proyectos",             href: "/proyectos",       iconName: "FolderKanban"    },
      { label: "Reportes",              href: "/control/reportes",iconName: "FileText"        },
      { label: "Cumplimiento de hitos", href: "/control/hitos",   iconName: "Flag"            },
    ],
  },
  op: {
    id:          "op",
    code:        "OP",
    name:        "Operación",
    color:       "#0891B2",
    textColor:   "#ffffff",
    description: "Monitorea equipos, gestiona alarmas y KPIs operativos en tiempo real",
    features:    ["Monitoreo de equipos", "Gestión de alarmas", "KPI operativos"],
    nav: [
      { label: "Dashboard",             href: "/dashboard",            iconName: "LayoutDashboard" },
      { label: "Proyectos",             href: "/proyectos",            iconName: "FolderKanban"    },
      { label: "Monitoreo de equipos",  href: "/operacion/monitoreo",  iconName: "Activity"        },
      { label: "Gestión de alarmas",    href: "/operacion/alarmas",    iconName: "Bell"            },
      { label: "KPI operativos",        href: "/operacion/kpi",        iconName: "TrendingUp"      },
    ],
  },
  mt: {
    id:          "mt",
    code:        "MT",
    name:        "Mantenimiento",
    color:       "#0A3C80",
    textColor:   "#ffffff",
    description: "Gestiona calendario, órdenes de trabajo e historial de elementos",
    features:    ["Calendario", "Órdenes de trabajo", "Historial de elementos", "Control de costos"],
    nav: [
      { label: "Dashboard",              href: "/dashboard",                 iconName: "LayoutDashboard" },
      { label: "Proyectos",              href: "/proyectos",                 iconName: "FolderKanban"    },
      { label: "Calendario",             href: "/mantenimiento/calendario",  iconName: "Calendar"        },
      { label: "Órdenes de trabajo",     href: "/mantenimiento/ordenes",     iconName: "Wrench"          },
      { label: "Historial de elementos", href: "/mantenimiento/historial",   iconName: "History"         },
      { label: "Control de costos",      href: "/mantenimiento/costos",      iconName: "Database"        },
    ],
  },
};

export const MODULE_LIST = Object.values(MODULES);
export const MODULE_KEY  = "infrale_module";

export function getModule(id: string | null): ModuleConfig | null {
  if (!id) return null;
  return MODULES[id as ModuleId] ?? null;
}
