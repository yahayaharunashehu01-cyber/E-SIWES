import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  Factory,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, useAuth, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles?: AppRole[] };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "My profile", icon: UserRound },
  // Student
  { to: "/placements", label: "Placements", icon: Briefcase, roles: ["student"] },
  { to: "/logbook", label: "E-Logbook", icon: BookOpen, roles: ["student"] },
  // Supervisor
  { to: "/supervise", label: "Assigned students", icon: ClipboardList, roles: ["industry_supervisor", "institution_supervisor"] },
  // University admin
  { to: "/institution", label: "SIWES Directorate", icon: Building2, roles: ["institution_admin", "coordinator"] },
  // Common
  { to: "/organizations", label: "Partner Organizations", icon: Factory },
];

const roleColors: Record<AppRole, string> = {
  super_admin: "bg-orange-500/20 text-orange-300",
  institution_admin: "bg-violet-500/20 text-violet-300",
  coordinator: "bg-violet-500/20 text-violet-300",
  student: "bg-blue-500/20 text-blue-300",
  industry_supervisor: "bg-emerald-500/20 text-emerald-300",
  institution_supervisor: "bg-teal-500/20 text-teal-300",
  org_admin: "bg-cyan-500/20 text-cyan-300",
};

function AppLayout() {
  const { session, loading, roles, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white/60 text-sm mt-3">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const items = NAV.filter((n) => !n.roles || n.roles.some((r) => roles.includes(r)));
  const primaryRole = roles[0];
  const roleColor = primaryRole ? roleColors[primaryRole] : "bg-slate-500/20 text-slate-300";

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between p-5 pb-0">
          <Logo inverted />
          <button
            onClick={() => setOpen(false)}
            className="md:hidden rounded-lg p-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 mt-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${roleColor}`}>
            {roles.map((r) => ROLE_LABELS[r]).join(", ")}
          </span>
        </div>

        {/* Nav */}
        <nav className="mt-6 flex-1 px-3 space-y-0.5">
          {items.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeProps={{
                className:
                  "bg-sidebar-accent !text-sidebar-primary font-semibold shadow-sm",
              }}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {n.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="mx-3 mb-5 rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-sidebar-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">
                {profile?.full_name || profile?.email}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/50">{profile?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-primary transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-foreground/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="min-w-0 flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden sticky top-0 z-10">
          <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <Logo />
          <div className="w-9" />
        </div>

        <div className="mx-auto w-full max-w-6xl p-5 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
