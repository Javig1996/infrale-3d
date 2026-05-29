"use client";

import { useState, useEffect } from "react";
import { usePathname }         from "next/navigation";
import { Sidebar }             from "./sidebar";
import { Header }              from "./header";
import { PageTransition }      from "@/components/ui/page-transition";
import type { Profile }        from "@/types/database";

interface DashboardShellProps {
  children:  React.ReactNode;
  profile:   Profile | null;
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Cierra sidebar en navegación mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Bloquea scroll del body cuando sidebar mobile está abierto
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          profile={profile}
          onMenuClick={() => setSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
