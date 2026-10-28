import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_UNIVERSITY_NAME, DEFAULT_UNIVERSITY_SHORT } from "@/lib/university";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: `${DEFAULT_UNIVERSITY_SHORT} Portal` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { session, roles, loading } = useAuth();
  const [email, setEmail] = useState("admin@fudma.edu.ng");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) {
      const isAdmin = roles.includes("institution_admin") || roles.includes("super_admin");
      if (isAdmin) {
        navigate({ to: "/institution" });
      } else {
        supabase.auth.signOut();
        setError("This portal is restricted to the SIWES Directorate admin account.");
      }
    }
  }, [session, roles, loading, navigate]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        if (
          signInError.message?.toLowerCase().includes("email not confirmed") ||
          (signInError as { code?: string }).code === "email_not_confirmed"
        ) {
          setError(
            "EMAIL_NOT_CONFIRMED: Go to your Supabase Dashboard and fix this in 30 seconds:\n\n"
          );
          setBusy(false);
          return;
        }

        if (signInError.message?.toLowerCase().includes("invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials.");
          setBusy(false);
          return;
        }
        setError(signInError.message ?? "Login failed. Please try again.");
        setBusy(false);
        return;
      }

      if (data.session) {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id);

        const userRoles = (roleRows ?? []).map((r) => r.role);
        const isAdmin = userRoles.includes("institution_admin") || userRoles.includes("super_admin");

        if (!isAdmin) {
          await supabase.auth.signOut();
          setError("Access denied. This portal is restricted to the SIWES Directorate admin account.");
          setBusy(false);
          return;
        }

        toast.success("Welcome back, SIWES Directorate Admin!");
        navigate({ to: "/institution" });
      }
    } catch (_err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg mb-4">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight text-center">SIWES Directorate</h1>
            <p className="text-xs text-slate-500 mt-1 text-center">{DEFAULT_UNIVERSITY_NAME}</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-6">
            <Lock className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="text-[11px] text-violet-300 font-medium">Restricted access — SIWES Directorate Admin only</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-sm text-slate-300">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-500 focus:border-violet-500/60 h-11"
                placeholder="admin@fudma.edu.ng"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-sm text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPass ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-500 focus:border-violet-500/60 h-11 pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              disabled={busy || !password}
              className="w-full h-11 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:opacity-95 text-white font-semibold text-sm shadow-lg transition-all"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Sign In to Directorate
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/60 space-y-2">
            <div className="flex items-start gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-600" />
              <span>This page is not indexed or linked from any public page.</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-600" />
              <span>Only the institutional superadmin account can log in here.</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-700">&copy; {new Date().getFullYear()} {DEFAULT_UNIVERSITY_NAME}</p>
      </div>
    </div>
  );
}
