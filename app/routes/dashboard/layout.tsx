import { Outlet, Link, useLocation } from "react-router";
import {
  Bot,
  Building2,
  KanbanSquare,
  MessageSquare,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Landmark
} from "lucide-react";
import { signOut } from "~/lib/auth.client";

const navItems = [
  { to: "/dashboard/agents", icon: Bot, label: "Agentes" },
  { to: "/dashboard/chat", icon: MessageSquare, label: "Chat" },
  { to: "/dashboard/tasks", icon: KanbanSquare, label: "Company Board" },
  { to: "/dashboard/organization", icon: Building2, label: "Organization" },
  { to: "/dashboard/security", icon: ShieldCheck, label: "Segurança" },
];

export default function DashboardLayout() {
  const location = useLocation();

  function isActive(path: string) {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-[#020617] flex font-sans">
      {/* ─── Sidebar ───────────────────────────────── */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">GabiOS</span>
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
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }
                `}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto text-slate-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* ─── Main content ──────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 text-slate-200">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between shrink-0 bg-slate-950/50 backdrop-blur-md">
          <h1 className="text-sm font-medium text-slate-300">
            {navItems.find((n) => isActive(n.to))?.label || "Workspace"}
          </h1>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
