import { Outlet, Link, useLocation } from "react-router";
import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { signOut } from "~/lib/auth.client";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Visão Geral" },
  { to: "/dashboard/agents", icon: Bot, label: "Agentes" },
  { to: "/dashboard/conversations", icon: MessageSquare, label: "Conversas" },
  { to: "/dashboard/documents", icon: FileText, label: "Documentos" },
  { to: "/dashboard/settings", icon: Settings, label: "Configurações" },
];

export default function DashboardLayout() {
  const location = useLocation();

  function isActive(path: string) {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* ─── Sidebar ───────────────────────────────── */}
      <aside className="w-64 bg-surface-900 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-surface-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">GabiOS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${
                    active
                      ? "bg-primary-600 text-white"
                      : "text-surface-400 hover:text-white hover:bg-surface-800"
                  }
                `}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-surface-800">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* ─── Main content ──────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-surface-200 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold text-surface-900">
            {navItems.find((n) => isActive(n.to))?.label || "Dashboard"}
          </h1>
        </header>

        {/* Page content */}
        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
