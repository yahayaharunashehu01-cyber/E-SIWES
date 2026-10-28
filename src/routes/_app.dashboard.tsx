import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Building2,
  GraduationCap,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_UNIVERSITY_ID, DEFAULT_UNIVERSITY_NAME, UNIVERSITY_TAGLINE } from "@/lib/university";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: `Dashboard — ${DEFAULT_UNIVERSITY_NAME} E-SIWES` },
      { name: "description", content: "Your university SIWES dashboard." },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  color = "blue",
}: {
  label: string;
  value: number | string;
  icon: typeof BookOpen;
  to?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-violet-50 text-violet-600 border-violet-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  const body = (
    <div className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-primary font-display">{value}</p>
        </div>
        <div className={`rounded-xl p-3 border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {to && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-secondary">
          View details <ArrowRight className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );

  return to ? <Link to={to}>{body}</Link> : body;
}

/* ─── 1. STUDENT DASHBOARD ─── */
function StudentDashboard() {
  const { profile } = useAuth();

  const { data } = useQuery({
    queryKey: ["student-dash", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const [pl, lg] = await Promise.all([
        supabase
          .from("placements")
          .select("id,status,role_title,start_date,end_date,industry_supervisor_id,reviewer_note,supervisor:industry_supervisor_id(full_name,email,department),organizations(name)")
          .eq("student_id", profile!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("logbook_entries")
          .select("id,status,entry_date,week_number")
          .eq("student_id", profile!.id)
          .order("entry_date", { ascending: false }),
      ]);
      return { placements: pl.data ?? [], logs: lg.data ?? [] };
    },
  });

  const placements = data?.placements ?? [];
  const logs = data?.logs ?? [];
  const activePlacement = placements.find((x) => x.status === "approved");
  const profileDone = !!(profile?.full_name && profile?.matric_no && profile?.department);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(" ")[0] || "Student"} 👋`}
        subtitle={`${DEFAULT_UNIVERSITY_NAME} · ${profile?.matric_no ? `${profile.matric_no} (${profile.department})` : "Student Portal"}`}
      />

      {!profileDone && (
        <Link
          to="/profile"
          className="mb-8 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-amber-900">
              <b>Complete your student profile</b> — Set your Matriculation Number, Faculty, and Department to enable placements.
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-600 shrink-0" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Placement status"
          value={activePlacement ? "Active" : placements.length > 0 ? "Under review" : "Not applied"}
          icon={Briefcase}
          to="/placements"
          color={activePlacement ? "green" : placements.length > 0 ? "orange" : "blue"}
        />
        <StatCard
          label="Logbook entries"
          value={logs.length}
          icon={BookOpen}
          to="/logbook"
          color="blue"
        />
        <StatCard
          label="Approved entries"
          value={logs.filter((x) => x.status === "approved").length}
          icon={CheckCircle2}
          to="/logbook"
          color="green"
        />
        <StatCard
          label="Needs correction"
          value={logs.filter((x) => x.status === "needs_correction").length}
          icon={Clock}
          to="/logbook"
          color={logs.some((x) => x.status === "needs_correction") ? "red" : "blue"}
        />
      </div>

      {/* Main placement card */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="font-semibold text-primary">Current SIWES Placement</h2>
            <Link to="/placements" className="text-xs text-secondary font-medium hover:underline">
              {activePlacement ? "View details" : "Apply now"}
            </Link>
          </div>

          {activePlacement ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Organization</p>
                <p className="text-base font-semibold text-primary">{activePlacement.organizations?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium text-primary">{activePlacement.role_title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium text-primary">
                    {activePlacement.start_date} → {activePlacement.end_date}
                  </p>
                </div>
              </div>

              {/* Assigned Instructor / Supervisor */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium">Assigned Faculty Supervisor</p>
                {activePlacement.supervisor ? (
                  <div className="mt-1 flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div>
                      <p className="text-sm font-semibold text-emerald-950">{activePlacement.supervisor.full_name}</p>
                      <p className="text-xs text-emerald-800">{activePlacement.supervisor.email} · {activePlacement.supervisor.department}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                      Active Supervisor
                    </span>
                  </div>
                ) : activePlacement.reviewer_note?.includes("Supervisor:") ? (
                  <div className="mt-1 flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div>
                      <p className="text-sm font-semibold text-emerald-950">
                        {activePlacement.reviewer_note.replace("Assigned Supervisor:", "").replace("Supervisor:", "").trim()}
                      </p>
                      <p className="text-xs text-emerald-800">Assigned Faculty Supervisor</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                      Active Supervisor
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                    Your placement is approved. The SIWES Directorate is currently assigning your faculty supervisor.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link
                  to="/logbook"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Open Daily E-Logbook
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No approved placement yet.</p>
              <Link
                to="/placements"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
              >
                Apply for industrial placement <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Recent log entries */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="font-semibold text-primary">Recent E-Logbook Entries</h2>
            <Link to="/logbook" className="text-xs text-secondary font-medium hover:underline">
              View all
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No entries logged yet. Record your daily training activities.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {logs.slice(0, 4).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium text-primary">{entry.entry_date}</span>
                    <span className="text-xs text-muted-foreground ml-2">Week {entry.week_number}</span>
                  </div>
                  <StatusBadge status={entry.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── 2. SUPERVISOR DASHBOARD ─── */
function SupervisorDashboard() {
  const { profile } = useAuth();

  const { data } = useQuery({
    queryKey: ["sup-dash", profile?.id, profile?.email],
    enabled: !!profile?.id,
    queryFn: async () => {
      // 1. Fetch placements assigned directly by supervisor ID
      const { data: directPlacements, error: plErr } = await supabase
        .from("placements")
        .select(
          "id,status,role_title,start_date,end_date,industry_supervisor_id,reviewer_note,profiles:student_id(id,full_name,matric_no,department,email,phone),organizations(name,state)"
        )
        .eq("industry_supervisor_id", profile!.id)
        .order("created_at", { ascending: false });

      if (plErr) {
        console.error("Error loading supervisor placements:", plErr);
      }

      let placementsList = directPlacements ?? [];

      // Fallback: If no direct placements by id, check if any placement mentions supervisor's email in reviewer_note
      if (placementsList.length === 0 && profile?.email) {
        const { data: notePlacements } = await supabase
          .from("placements")
          .select(
            "id,status,role_title,start_date,end_date,industry_supervisor_id,reviewer_note,profiles:student_id(id,full_name,matric_no,department,email,phone),organizations(name,state)"
          )
          .ilike("reviewer_note", `%${profile.email}%`);

        if (notePlacements && notePlacements.length > 0) {
          placementsList = notePlacements;
          // Auto-link supervisor ID in background
          for (const np of notePlacements) {
            if (!np.industry_supervisor_id) {
              await supabase
                .from("placements")
                .update({ industry_supervisor_id: profile!.id })
                .eq("id", np.id);
            }
          }
        }
      }

      // 2. Fetch logbook entries for these placements
      const placementIds = placementsList.map((p) => p.id);
      let pendingCount = 0;
      let approvedCount = 0;
      let needsCorrectionCount = 0;
      let totalLogs = 0;
      let recentLogs: any[] = [];

      if (placementIds.length > 0) {
        const { data: logs } = await supabase
          .from("logbook_entries")
          .select("id,status,entry_date,week_number,activities,skills,supervisor_comment,placement_id,student_id,profiles:student_id(full_name,matric_no)")
          .in("placement_id", placementIds)
          .order("entry_date", { ascending: false });

        if (logs) {
          totalLogs = logs.length;
          pendingCount = logs.filter((l) => l.status === "submitted").length;
          approvedCount = logs.filter((l) => l.status === "approved").length;
          needsCorrectionCount = logs.filter((l) => l.status === "needs_correction").length;
          recentLogs = logs.slice(0, 5);
        }
      }

      return {
        placements: placementsList,
        pendingCount,
        approvedCount,
        needsCorrectionCount,
        totalLogs,
        recentLogs,
      };
    },
  });

  const placements = data?.placements ?? [];
  const pendingCount = data?.pendingCount ?? 0;
  const approvedCount = data?.approvedCount ?? 0;
  const recentLogs = data?.recentLogs ?? [];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(" ")[0] || "Supervisor"} 👋`}
        subtitle={`Faculty Supervisor · ${DEFAULT_UNIVERSITY_NAME} (${profile?.department || "SIWES Faculty"})`}
      />

      {/* Dynamic 4-card stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Students assigned"
          value={placements.length}
          icon={Users}
          to="/supervise"
          color="blue"
        />
        <StatCard
          label="Awaiting review"
          value={pendingCount}
          icon={Clock}
          to="/supervise"
          color={pendingCount > 0 ? "orange" : "blue"}
        />
        <StatCard
          label="Approved log entries"
          value={approvedCount}
          icon={CheckCircle2}
          to="/supervise"
          color="green"
        />
        <StatCard
          label="Active placements"
          value={placements.filter((p) => p.status === "approved").length}
          icon={Briefcase}
          to="/supervise"
          color="purple"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Your Assigned University Students */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-primary">Your Assigned University Students</h2>
            <Link to="/supervise" className="text-xs text-secondary font-medium hover:underline">
              Open Supervise Portal ({placements.length})
            </Link>
          </div>
          {placements.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-primary">No students assigned to you yet.</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                The SIWES Directorate assigns students under your department using your email: <b>{profile?.email}</b>
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {placements.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4 text-sm hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="font-semibold text-primary">{p.profiles?.full_name || "Assigned Student"}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {p.profiles?.matric_no} · {p.profiles?.department || "Department"}
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {p.organizations?.name} ({p.role_title || "Intern"})
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <StatusBadge status={p.status} />
                    <Link
                      to="/supervise"
                      className="text-xs font-semibold text-secondary hover:underline inline-flex items-center gap-1"
                    >
                      View logbook <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions Awaiting Your Review */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-primary">Recent E-Logbook Submissions</h2>
            <Link to="/supervise" className="text-xs text-secondary font-medium hover:underline">
              Review all ({pendingCount} pending)
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No logbook entries submitted yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Student training activity entries will appear here for your review and grading.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-primary">{log.profiles?.full_name || "Student"}</span>
                      <span className="text-xs text-muted-foreground ml-2">Week {log.week_number} · {log.entry_date}</span>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                  <p className="text-xs text-foreground/80 mt-1.5 line-clamp-2">{log.activities}</p>
                  <div className="mt-2 flex items-center justify-end">
                    <Link
                      to="/supervise"
                      className="text-xs font-semibold text-secondary hover:underline inline-flex items-center gap-1"
                    >
                      {log.status === "submitted" ? "Review & Grade Entry →" : "View Details →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── 3. UNIVERSITY SIWES DIRECTORATE ADMIN DASHBOARD ─── */
function UniversityAdminDashboard() {
  const { profile, refresh } = useAuth();
  const instId = profile?.institution_id || DEFAULT_UNIVERSITY_ID;

  useEffect(() => {
    if (profile && !profile.institution_id) {
      supabase
        .from("profiles")
        .update({ institution_id: DEFAULT_UNIVERSITY_ID })
        .eq("id", profile.id)
        .then(() => refresh());
    }
  }, [profile, refresh]);

  const { data, refetch } = useQuery({
    queryKey: ["university-admin-dash", instId],
    queryFn: async () => {
      const [profilesRes, placementsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,email,department,phone,matric_no,level,institution_id"),
        supabase
          .from("placements")
          .select("id,status,role_title,institution_id,profiles:student_id(full_name,matric_no),organizations(name)")
          .order("created_at", { ascending: false }),
      ]);

      const allProfiles = profilesRes.data ?? [];
      const allPlacements = placementsRes.data ?? [];

      // Partition students: must have a matriculation number
      const studentsList = allProfiles.filter(
        (p) => p.matric_no && p.matric_no.trim() !== ""
      );

      // Partition supervisors: no matric number, not the current admin
      const supervisorsList = allProfiles.filter(
        (p) => (!p.matric_no || p.matric_no.trim() === "") && p.id !== profile?.id
      );

      return {
        students: studentsList,
        placements: allPlacements,
        supervisors: supervisorsList,
      };
    },
  });

  const students = data?.students ?? [];
  const placements = data?.placements ?? [];
  const supervisors = data?.supervisors ?? [];
  const pendingPlacements = placements.filter((p) => p.status === "pending");
  const approvedPlacements = placements.filter((p) => p.status === "approved");

  return (
    <div>
      <PageHeader
        title={`SIWES Directorate Dashboard 👋`}
        subtitle={`${DEFAULT_UNIVERSITY_NAME} · ${UNIVERSITY_TAGLINE}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Enrolled students"
          value={students.length}
          icon={GraduationCap}
          to="/institution"
          color="blue"
        />
        <StatCard
          label="Provisioned supervisors"
          value={supervisors.length}
          icon={UserCheck}
          to="/institution"
          color="purple"
        />
        <StatCard
          label="Pending applications"
          value={pendingPlacements.length}
          icon={Clock}
          to="/institution"
          color="orange"
        />
        <StatCard
          label="Approved placements"
          value={approvedPlacements.length}
          icon={ClipboardCheck}
          to="/institution"
          color="green"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-primary">Placement Applications</h2>
            <Link to="/institution" className="text-xs text-secondary font-medium hover:underline">
              Review all ({pendingPlacements.length} pending)
            </Link>
          </div>
          {placements.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No placement applications yet.</div>
          ) : (
            <div>
              {placements.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b px-6 py-3.5 text-sm last:border-0">
                  <div>
                    <div className="font-medium text-primary">{p.profiles?.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.profiles?.matric_no} · {p.organizations?.name} ({p.role_title})
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supervisors & Faculties */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-primary">Provisioned Faculty Supervisors</h2>
            <Link to="/institution" className="text-xs text-secondary font-medium hover:underline">
              Manage / Add
            </Link>
          </div>
          {supervisors.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No faculty supervisors provisioned yet. Click "Manage / Add" to create supervisor accounts.
            </div>
          ) : (
            <div>
              {supervisors.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b px-6 py-3.5 text-sm last:border-0">
                  <div>
                    <div className="font-medium text-primary">{s.full_name}</div>
                    <div className="text-xs text-muted-foreground">{s.department || s.email}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Supervisor
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-xs mt-3">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (roles.includes("institution_admin") || roles.includes("coordinator") || roles.includes("super_admin")) {
    return <UniversityAdminDashboard />;
  }
  if (roles.includes("industry_supervisor") || roles.includes("institution_supervisor")) {
    return <SupervisorDashboard />;
  }
  return <StudentDashboard />;
}
