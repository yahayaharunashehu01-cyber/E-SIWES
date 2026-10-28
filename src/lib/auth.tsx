import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "National Super Admin",
  institution_admin: "Institution Admin",
  coordinator: "SIWES Coordinator",
  student: "Student",
  industry_supervisor: "Industrial Supervisor",
  institution_supervisor: "Institutional Supervisor",
  org_admin: "Organization Admin",
};

type AuthCtx = {
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setRoles([]);
      setLoading(false);
      return;
    }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", s.user.id),
    ]);
    const fetchedRoles = (r ?? []).map((x) => x.role);
    const metaRole = (s.user.user_metadata?.["role"] || s.user.app_metadata?.["role"]) as AppRole | undefined;
    if (metaRole && !fetchedRoles.includes(metaRole)) {
      fetchedRoles.push(metaRole);
    }
    let userProfile = p;
    if (!userProfile && s?.user) {
      // Fallback synthetic profile from user session metadata so UI never renders blank
      userProfile = {
        id: s.user.id,
        email: s.user.email || "",
        full_name: (s.user.user_metadata?.["full_name"] || s.user.user_metadata?.["name"] || "") as string,
        matric_no: (s.user.user_metadata?.["matric_no"] || "") as string,
        department: (s.user.user_metadata?.["department"] || "") as string,
        level: (s.user.user_metadata?.["level"] || "") as string,
        phone: (s.user.user_metadata?.["phone"] || "") as string,
        institution_id: (s.user.user_metadata?.["institution_id"] || null) as string | null,
        created_at: new Date().toISOString(),
      };
    }
    setProfile(userProfile ?? null);
    setRoles(fetchedRoles);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(true);
      load(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      load(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return (
    <Ctx.Provider
      value={{
        session,
        profile,
        roles,
        loading,
        refresh: () => load(session),
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
