import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  GraduationCap,
  Building2,
  ClipboardList,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_UNIVERSITY_ID, DEFAULT_UNIVERSITY_NAME, UNIVERSITY_TAGLINE } from "@/lib/university";

const search = z.object({
  mode: z.enum(["signin", "signup", "forgot", "portal"]).optional(),
  role: z.enum(["student", "institution_admin", "industry_supervisor"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: `SIWES Portal — ${DEFAULT_UNIVERSITY_NAME}` },
      { name: "description", content: "Official Students Industrial Work Experience Scheme (SIWES) Portal." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type PortalConfig = {
  role: "student" | "industry_supervisor" | "institution_admin";
  icon: typeof GraduationCap;
  title: string;
  tagline: string;
  badge: string;
  gradient: string;
  accentBorder: string;
  features: string[];
};

export const UNIVERSITY_PORTALS: PortalConfig[] = [
  {
    role: "student",
    icon: GraduationCap,
    title: "Student Portal",
    tagline: "Apply for approved SIWES placements, keep your daily electronic logbook, and track supervisor reviews in real time.",
    badge: "University Student",
    gradient: "from-blue-600 via-indigo-600 to-blue-700",
    accentBorder: "hover:border-blue-500/60 focus:border-blue-500",
    features: [
      "Submit & track placement applications",
      "Daily e-logbook entries with weekly groupings",
      "Real-time feedback & supervisor sign-offs",
    ],
  },
  {
    role: "industry_supervisor",
    icon: ClipboardList,
    title: "Supervisor Portal",
    tagline: "Oversee assigned university students under your faculty and department. Review daily logs, provide weekly feedback, and sign off entries.",
    badge: "Faculty Supervisor",
    gradient: "from-emerald-600 via-teal-600 to-emerald-700",
    accentBorder: "hover:border-emerald-500/60 focus:border-emerald-500",
    features: [
      "Provisioned by University Admin by Faculty & Dept",
      "Inspect daily student activities & weekly logs",
      "Direct correction requests & approval sign-offs",
    ],
  },
  {
    role: "institution_admin",
    icon: Building2,
    title: "Directorate Portal",
    tagline: "Official SIWES Directorate administration. Manage faculties, provision supervisors, and approve student placements.",
    badge: "SIWES Directorate",
    gradient: "from-violet-600 via-purple-600 to-violet-700",
    accentBorder: "hover:border-violet-500/60 focus:border-violet-500",
    features: [
      "Oversee all student SIWES placements",
      "Provision faculty & department supervisors",
      "Institutional compliance & weekly monitoring",
    ],
  },
];

function PortalSelection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-violet-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo inverted />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs text-slate-400 font-medium px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              {DEFAULT_UNIVERSITY_NAME}
            </span>
            <Link
              to="/"
              className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800/60"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 md:py-16">
        <div className="w-full max-w-6xl">
          {/* Section title */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {DEFAULT_UNIVERSITY_NAME} · {UNIVERSITY_TAGLINE}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold text-white tracking-tight">
              Select Your Portal
            </h1>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Log in to the official university SIWES portal. Students can register and sign in. Supervisors sign in with their provisioned account.
            </p>
          </div>

          {/* 3-Card Grid for the 3 Core University Roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {UNIVERSITY_PORTALS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.role}
                  className={`group relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/60 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${p.accentBorder}`}
                  style={{
                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Top: Icon + Badge + Title + Tagline */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                        {p.badge}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-white tracking-tight group-hover:text-white transition-colors">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed min-h-[50px]">
                      {p.tagline}
                    </p>

                    {/* Features list */}
                    <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5">
                      {p.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom: Action buttons */}
                  <div className="mt-8 pt-5 border-t border-slate-800/80 space-y-2">
                    <button
                      onClick={() => navigate({ to: "/auth", search: { mode: "signin", role: p.role } })}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${p.gradient} hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all`}
                    >
                      Sign In to {p.title.split(" ")[0]}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    {p.role === "industry_supervisor" || p.role === "institution_admin" ? (
                      <div className="w-full py-2 px-3 rounded-xl text-[11px] text-center font-medium text-slate-400 bg-slate-800/40 border border-slate-800/60">
                        {p.role === "institution_admin"
                          ? "Restricted to University SIWES Directorate"
                          : "Provisioned by Directorate under Faculty"}
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate({ to: "/auth", search: { mode: "signup", role: p.role } })}
                        className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                      >
                        New user? Create account
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center text-xs text-slate-500 space-y-2">
            <div>Official E-SIWES portal for {DEFAULT_UNIVERSITY_NAME}. All students and staff accounts are bound to this institution.</div>
            <div>
              <Link to="/admin/login" className="text-violet-400 hover:text-violet-300 font-medium underline inline-flex items-center gap-1">
                SIWES Directorate Dedicated Admin Login &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} {DEFAULT_UNIVERSITY_NAME} · Directorate of Students Industrial Work Experience Scheme
      </footer>
    </div>
  );
}

function AuthPage() {
  const { mode = "portal", role = "student" } = Route.useSearch();
  const navigate = useNavigate();
  const { session, roles, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      const isAdmin = roles.includes("institution_admin") || roles.includes("super_admin") || roles.includes("coordinator");
      if (isAdmin) {
        navigate({ to: "/institution" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [session, roles, loading, navigate]);

  if (mode === "portal") return <PortalSelection navigate={navigate} />;

  const currentPortal = (UNIVERSITY_PORTALS.find((p) => p.role === role) || UNIVERSITY_PORTALS[0])!;
  const Icon = currentPortal.icon;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    if (mode === "signup" && (role === "industry_supervisor" || role === "institution_admin")) {
      toast.error(
        role === "institution_admin"
          ? "University admin accounts cannot be created publicly. Contact the SIWES Directorate."
          : "Supervisor accounts cannot be registered publicly. They must be provisioned by the Institution Admin under a Faculty."
      );
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(fd);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message || "Validation failed");
          return;
        }

        // Bind user to default single university automatically
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: {
              full_name: parsed.data.full_name,
              role,
              institution_id: DEFAULT_UNIVERSITY_ID,
            },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        setSent(parsed.data.email);
      } else if (mode === "forgot") {
        const targetEmail = fd["email"] || "";
        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Check your email for a reset link.");
      } else {
        const email = fd["email"] || "";
        const password = fd["password"] || "";
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Navigation back to portals */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: "portal" } })}
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Switch portal
          </button>

          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            {DEFAULT_UNIVERSITY_NAME}
          </Link>
        </div>

        {/* Quick Role Switcher Pill Bar for University's 3 Core Roles */}
        <div className="mb-6 grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {UNIVERSITY_PORTALS.map((p) => {
            const active = role === p.role;
            const PillIcon = p.icon;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => navigate({ to: "/auth", search: { mode, role: p.role } })}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-slate-800 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <PillIcon className="w-3.5 h-3.5" />
                <span className="truncate">{p.title.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-7 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-800">
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${currentPortal.gradient} flex items-center justify-center shadow-lg shrink-0`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white truncate text-base">{currentPortal.title}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentPortal.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{DEFAULT_UNIVERSITY_NAME}</p>
            </div>
          </div>

          {sent ? (
            <div className="py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-white">Confirmation email sent</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                We sent an account activation link to <b className="text-slate-200">{sent}</b>. Please open your inbox to confirm your account.
              </p>
              <Button
                className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                onClick={() => {
                  setSent(null);
                  navigate({ to: "/auth", search: { mode: "signin", role } });
                }}
              >
                Return to sign in
              </Button>
            </div>
          ) : (
            <>
              {/* Mode Toggle (Sign In / Sign Up) */}
              {mode !== "forgot" && role !== "industry_supervisor" && (
                <div className="flex rounded-lg bg-slate-950 p-1 mb-6 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/auth", search: { mode: "signin", role } })}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      mode === "signin"
                        ? "bg-slate-800 text-white shadow-sm font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/auth", search: { mode: "signup", role } })}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      mode === "signup"
                        ? "bg-slate-800 text-white shadow-sm font-semibold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Informational banner for supervisor if in signup mode */}
              {role === "industry_supervisor" && mode === "signup" ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center my-4">
                  <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white text-sm">Supervisor Provisioning Required</h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Supervisor accounts cannot be registered publicly. They must be provisioned by the University Directorate under your designated Faculty and Department.
                  </p>
                  <Button
                    onClick={() => navigate({ to: "/auth", search: { mode: "signin", role: "industry_supervisor" } })}
                    className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700"
                  >
                    Switch to Supervisor Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      {mode === "signup"
                        ? `Register as a Student`
                        : mode === "forgot"
                        ? "Reset Password"
                        : `Sign in to ${currentPortal.title}`}
                    </h1>
                    <p className="mt-1 text-xs text-slate-400">
                      {mode === "signup"
                        ? `Create your student SIWES account for ${DEFAULT_UNIVERSITY_NAME}`
                        : mode === "forgot"
                        ? "Enter your email to receive a password reset link"
                        : "Enter your registered email and password to proceed"}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="full_name" className="text-xs text-slate-300">
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          placeholder="e.g. Amina Bello"
                          required
                          className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-slate-600"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs text-slate-300">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-slate-600"
                      />
                    </div>

                    {mode !== "forgot" && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="password" className="text-xs text-slate-300">
                            Password
                          </Label>
                          {mode === "signin" && (
                            <button
                              type="button"
                              onClick={() => navigate({ to: "/auth", search: { mode: "forgot", role } })}
                              className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-slate-600 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <Button
                      id="auth-submit"
                      type="submit"
                      className={`w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r ${currentPortal.gradient} hover:opacity-95 shadow-md border-0 transition-opacity`}
                      disabled={busy}
                    >
                      {busy
                        ? "Please wait…"
                        : mode === "signup"
                        ? `Create Student Account`
                        : mode === "forgot"
                        ? "Send Reset Link"
                        : "Sign In"}
                    </Button>
                  </form>

                  {/* Form Footer */}
                  <div className="mt-6 text-center text-xs text-slate-400">
                    {role === "industry_supervisor" ? (
                      <p className="text-slate-400 text-xs">
                        Need a supervisor account? Contact the SIWES Directorate to be provisioned under your faculty.
                      </p>
                    ) : mode === "signup" ? (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/auth", search: { mode: "signin", role } })}
                          className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          Sign in
                        </button>
                      </>
                    ) : mode === "forgot" ? (
                      <>
                        Remember your password?{" "}
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/auth", search: { mode: "signin", role } })}
                          className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          Back to sign in
                        </button>
                      </>
                    ) : (
                      <>
                        Don't have an account yet?{" "}
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/auth", search: { mode: "signup", role } })}
                          className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          Create one now
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
