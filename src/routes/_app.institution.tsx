import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import {
  Plus,
  Users,
  Building2,
  Copy,
  Check,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Search,
  UserCheck,
} from "lucide-react";
import { Empty, PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_UNIVERSITY_ID,
  DEFAULT_UNIVERSITY_NAME,
  UNIVERSITY_TAGLINE,
  UNIVERSITY_FACULTIES,
  UNIVERSITY_DEPARTMENTS,
} from "@/lib/university";

export const Route = createFileRoute("/_app/institution")({
  head: () => ({
    meta: [
      { title: "My Institution — National E-SIWES" },
      { name: "description", content: "Manage students, supervisors under faculties & departments, and placements." },
      { property: "og:title", content: "My Institution — National E-SIWES" },
      { property: "og:description", content: "Manage students and placements." },
    ],
  }),
  component: InstitutionPage,
});

const DEFAULT_FACULTIES = UNIVERSITY_FACULTIES;
const SUGGESTED_DEPARTMENTS = UNIVERSITY_DEPARTMENTS;


function InstitutionPage() {
  const { profile, refresh } = useAuth();
  const instId = profile?.institution_id || DEFAULT_UNIVERSITY_ID;

  useEffect(() => {
    if (profile && !profile.institution_id) {
      supabase.from("profiles").update({ institution_id: DEFAULT_UNIVERSITY_ID }).eq("id", profile.id).then(() => refresh());
    }
  }, [profile, refresh]);

  return (
    <div>
      <PageHeader
        title={`${DEFAULT_UNIVERSITY_NAME}`}
        subtitle={`${UNIVERSITY_TAGLINE} · Administration`}
        action={
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Directorate Active
          </span>
        }
      />
      <Tabs defaultValue="placements">
        <TabsList className="mb-4">
          <TabsTrigger value="placements">Placement applications</TabsTrigger>
          <TabsTrigger value="supervisors">Supervisors (by Faculty & Dept)</TabsTrigger>
          <TabsTrigger value="students">Enrolled Students</TabsTrigger>
        </TabsList>
        <TabsContent value="placements" className="mt-4">
          <PlacementReview institutionId={instId} />
        </TabsContent>
        <TabsContent value="supervisors" className="mt-4">
          <Supervisors institutionId={instId} />
        </TabsContent>
        <TabsContent value="students" className="mt-4">
          <Students institutionId={instId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── TAB 1: PLACEMENT REVIEW & SUPERVISOR ASSIGNMENT ─── */
function PlacementReview({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["inst-placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placements")
        .select("*, profiles:student_id(full_name,matric_no,department), supervisor:industry_supervisor_id(id,full_name,email,department), organizations(name)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading placements with relations:", error);
        return [];
      }
      return data ?? [];
    },
  });

  const { profile } = useAuth();
  const { data: supervisors = [] } = useQuery({
    queryKey: ["inst-supervisors", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, department, matric_no")
        .order("full_name");
      // Exclude students and admin self
      return (data ?? []).filter((s) => (!s.matric_no || s.matric_no.trim() === "") && s.id !== profile?.id);
    },
  });

  async function decide(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("placements")
      .update({ status, reviewer_note: (notes[id] ?? "").slice(0, 500) })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Placement ${status}`);
    qc.invalidateQueries({ queryKey: ["inst-placements"] });
    qc.invalidateQueries({ queryKey: ["university-admin-dash"] });
    qc.invalidateQueries({ queryKey: ["my-placements"] });
    qc.invalidateQueries({ queryKey: ["student-dash"] });
  }

  async function assign(id: string, emailToAssign?: string) {
    const targetEmail = (emailToAssign || emails[id] || "").trim();
    if (!targetEmail) {
      toast.error("Select or enter a supervisor email address");
      return;
    }

    // Look up supervisor in loaded supervisors list
    const targetSup = supervisors.find(
      (s) => s.email.toLowerCase() === targetEmail.toLowerCase() || s.id === emailToAssign
    );
    const supId = targetSup?.id;
    const supName = targetSup?.full_name || targetEmail;
    const supDept = targetSup?.department || "";
    const noteString = `Supervisor: ${supName} (${targetEmail})${supDept ? ` · ${supDept}` : ""}`;

    // 1. Direct update placements table with industry_supervisor_id and reviewer_note
    const { error: directError } = await supabase
      .from("placements")
      .update({
        reviewer_note: noteString,
        ...(supId ? { industry_supervisor_id: supId } : {}),
      })
      .eq("id", id);

    // 2. Also try RPC to ensure triggers/relationships sync
    await supabase.rpc("assign_supervisor", {
      _placement: id,
      _email: targetEmail,
    });

    if (directError && !supId) {
      toast.error(directError.message);
      return;
    }

    toast.success(`Supervisor (${supName}) assigned successfully`);
    qc.invalidateQueries({ queryKey: ["inst-placements"] });
    qc.invalidateQueries({ queryKey: ["university-admin-dash"] });
    qc.invalidateQueries({ queryKey: ["supervised"] });
    qc.invalidateQueries({ queryKey: ["sup-dash"] });
    qc.invalidateQueries({ queryKey: ["student-dash"] });
    qc.invalidateQueries({ queryKey: ["my-placements"] });
    qc.invalidateQueries({ queryKey: ["active-placement"] });
  }

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const approvedCount = rows.filter((r) => r.status === "approved").length;
  const rejectedCount = rows.filter((r) => r.status === "rejected").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
          className="capitalize"
        >
          Pending ({pendingCount})
        </Button>
        <Button
          size="sm"
          variant={filter === "approved" ? "default" : "outline"}
          onClick={() => setFilter("approved")}
          className="capitalize"
        >
          Approved ({approvedCount})
        </Button>
        <Button
          size="sm"
          variant={filter === "rejected" ? "default" : "outline"}
          onClick={() => setFilter("rejected")}
          className="capitalize"
        >
          Rejected ({rejectedCount})
        </Button>
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className="capitalize"
        >
          All ({rows.length})
        </Button>
      </div>
      {shown.length === 0 && <Empty>No {filter === "all" ? "" : filter} applications.</Empty>}
      <div className="space-y-3">
        {shown.map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-primary">
                  {r.profiles?.full_name} <span className="font-normal text-muted-foreground">· {r.profiles?.matric_no}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {r.profiles?.department} → {r.organizations?.name} ({r.role_title})
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.start_date} → {r.end_date}
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>

            {r.status === "pending" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Input
                  className="max-w-sm"
                  placeholder="Note to student (optional)"
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                />
                <Button size="sm" onClick={() => decide(r.id, "approved")}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}>
                  Reject
                </Button>
              </div>
            )}

            {r.status === "approved" && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Supervisor Assignment Status:
                  </span>
                  {r.industry_supervisor_id ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Supervisor Assigned: {r.supervisor?.full_name || "Assigned"} ({r.supervisor?.email})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      ⚠ Awaiting Supervisor Assignment
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm pt-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {r.industry_supervisor_id ? "Reassign Supervisor:" : "Select Supervisor:"}
                  </span>

                  {supervisors.length > 0 && (() => {
                    const studentDept = r.profiles?.department || "";
                    const studentFaculty = studentDept.includes("—") ? (studentDept.split("—")[0]?.trim().toLowerCase() || "") : "";
                    const studentDeptOnly = studentDept.includes("—") ? (studentDept.split("—")[1]?.trim().toLowerCase() || "") : studentDept.toLowerCase();

                    // Sort supervisors: exact department match first, then faculty match, then others
                    const sortedSupervisors = [...supervisors].sort((a, b) => {
                      const aDept = (a.department || "").toLowerCase();
                      const bDept = (b.department || "").toLowerCase();

                      const aDeptMatch = studentDeptOnly && aDept.includes(studentDeptOnly);
                      const bDeptMatch = studentDeptOnly && bDept.includes(studentDeptOnly);
                      if (aDeptMatch && !bDeptMatch) return -1;
                      if (!aDeptMatch && bDeptMatch) return 1;

                      const aFacMatch = studentFaculty && aDept.includes(studentFaculty);
                      const bFacMatch = studentFaculty && bDept.includes(studentFaculty);
                      if (aFacMatch && !bFacMatch) return -1;
                      if (!aFacMatch && bFacMatch) return 1;

                      return (a.full_name || "").localeCompare(b.full_name || "");
                    });

                    const currentSelectedVal = emails[r.id] ?? r.supervisor?.email ?? "";

                    return (
                      <Select
                        value={currentSelectedVal}
                        onValueChange={(val) => {
                          setEmails({ ...emails, [r.id]: val });
                          assign(r.id, val);
                        }}
                      >
                        <SelectTrigger className="w-[340px]">
                          <SelectValue placeholder="Select matched supervisor…" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedSupervisors.map((s) => {
                            const sDept = (s.department || "").toLowerCase();
                            const isDeptMatch = studentDeptOnly && sDept.includes(studentDeptOnly);
                            const isFacMatch = !isDeptMatch && studentFaculty && sDept.includes(studentFaculty);

                            return (
                              <SelectItem key={s.id} value={s.email}>
                                {s.full_name}
                                {isDeptMatch ? " (★ Dept Match)" : isFacMatch ? " (Faculty Match)" : ""}
                                {" — "}
                                {s.department ? s.department.split("—")[1]?.trim() || s.department : s.email}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    );
                  })()}

                  <div className="flex items-center gap-2">
                    <Input
                      className="w-56"
                      placeholder="or enter email manually"
                      value={emails[r.id] ?? ""}
                      onChange={(e) => setEmails({ ...emails, [r.id]: e.target.value })}
                    />
                    <Button size="sm" variant="outline" onClick={() => assign(r.id)}>
                      {r.industry_supervisor_id ? "Reassign" : "Assign"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TAB 2: SUPERVISORS UNDER FACULTY & DEPARTMENT ─── */
function Supervisors({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [faculty, setFaculty] = useState(DEFAULT_FACULTIES[0]);
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { profile } = useAuth();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["inst-supervisors", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, department, phone, created_at, matric_no")
        .order("full_name");
      // Exclude students (those with matric_no) and current admin self
      return (data ?? []).filter((r) => (!r.matric_no || r.matric_no.trim() === "") && r.id !== profile?.id);
    },
  });

  const { data: allPlacements = [] } = useQuery({
    queryKey: ["inst-placements-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("placements").select("id, industry_supervisor_id, status");
      return data ?? [];
    },
  });

  async function createSupervisor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const fullName = (fd["full_name"] || "").trim();
    const email = (fd["email"] || "").trim().toLowerCase();
    const password = (fd["password"] || "").trim();
    const phone = (fd["phone"] || "").trim();

    if (!fullName || fullName.length < 2) {
      toast.error("Enter supervisor's full name");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!department.trim()) {
      toast.error("Enter supervisor's department");
      return;
    }

    setBusy(true);
    try {
      const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || (typeof process !== "undefined" ? process.env["SUPABASE_URL"] : undefined);
      const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || (typeof process !== "undefined" ? process.env["SUPABASE_PUBLISHABLE_KEY"] : undefined);

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials not found in environment.");
      }

      // Use isolated temporary client so admin's session is never replaced!
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const fullDept = `${faculty} — ${department.trim()}`;

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "industry_supervisor",
            department: fullDept,
            institution_id: institutionId,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      // Ensure profile has department & institution linked
      if (authData.user) {
        await tempClient
          .from("profiles")
          .update({
            department: fullDept,
            institution_id: institutionId,
            phone,
          })
          .eq("id", authData.user.id);
      }

      toast.success(`Supervisor ${fullName} created successfully under ${faculty}!`);
      setOpen(false);
      setDepartment("");
      qc.invalidateQueries({ queryKey: ["inst-supervisors"] });
      qc.invalidateQueries({ queryKey: ["university-admin-dash"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to provision supervisor");
    } finally {
      setBusy(false);
    }
  }

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email);
    setCopied(email);
    toast.success(`Copied ${email}`);
    setTimeout(() => setCopied(null), 2000);
  }

  const shown = rows.filter((r) =>
    `${r.full_name} ${r.email} ${r.department}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border bg-card">
        <div>
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Institutional Supervisors Directory
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Only Institution Admins can create supervisor accounts. Supervisors are assigned to students by Faculty & Department.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Supervisor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Provision New Supervisor
              </DialogTitle>
              <DialogDescription className="text-xs">
                Create a supervisor account attached to a specific Faculty and Department in your institution.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createSupervisor} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="sup_full_name">Full Name</Label>
                <Input id="sup_full_name" name="full_name" placeholder="e.g. Dr. Aminu Kano" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sup_email">Official Email Address</Label>
                <Input id="sup_email" name="email" type="email" placeholder="e.g. aminu.kano@institution.edu.ng" required />
              </div>

              <div className="space-y-1.5">
                <Label>Faculty</Label>
                <Select value={faculty} onValueChange={setFaculty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_FACULTIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="sup_dept">Department</Label>
                  {faculty && SUGGESTED_DEPARTMENTS[faculty] && (
                    <span className="text-[11px] text-muted-foreground">Pick suggestion below or type</span>
                  )}
                </div>
                <Input
                  id="sup_dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  required
                />
                {(() => {
                  const depts = faculty ? SUGGESTED_DEPARTMENTS[faculty] : undefined;
                  if (!depts || depts.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {depts.map((d: string) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setDepartment(d)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground border transition-colors"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sup_password">Initial Password</Label>
                  <Input
                    id="sup_password"
                    name="password"
                    defaultValue="Supervisor@2026"
                    placeholder="Min 8 characters"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sup_phone">Phone (optional)</Label>
                  <Input id="sup_phone" name="phone" placeholder="+234..." />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {busy ? "Provisioning supervisor…" : "Create Supervisor Account"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Filter by name, department, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Supervisor List */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading supervisors…</div>
      ) : shown.length === 0 ? (
        <Empty>
          No supervisors registered yet. Click <b>"Add Supervisor"</b> above to provision a supervisor under a Faculty & Department.
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((sup) => {
            const assignedCount = allPlacements.filter(
              (p) => p.industry_supervisor_id === sup.id
            ).length;
            const deptParts = sup.department ? sup.department.split("—") : [];
            const facultyName = deptParts[0]?.trim();
            const deptName = deptParts[1]?.trim() || sup.department;

            return (
              <div
                key={sup.id}
                className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-primary">{sup.full_name}</h3>
                      <button
                        onClick={() => copyEmail(sup.email)}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5 group"
                      >
                        <span>{sup.email}</span>
                        {copied === sup.email ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Supervisor
                    </span>
                  </div>

                  {facultyName && (
                    <div className="mt-3">
                      <span className="text-[11px] font-medium text-slate-500 block truncate">{facultyName}</span>
                      <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded bg-muted text-primary">
                        {deptName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <b>{assignedCount}</b> student{assignedCount !== 1 ? "s" : ""} assigned
                  </span>
                  {sup.phone && <span>{sup.phone}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── TAB 3: STUDENTS ─── */
function Students({ institutionId }: { institutionId: string }) {
  const [q, setQ] = useState("");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["inst-students", institutionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`institution_id.eq.${institutionId},institution_id.is.null`)
        .not("matric_no", "is", null)
        .not("matric_no", "eq", "")
        .order("full_name");
      return data ?? [];
    },
  });

  const shown = rows.filter(
    (r) => r.matric_no && `${r.full_name} ${r.matric_no} ${r.department}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <Input
        className="mb-4 max-w-sm"
        placeholder="Search name, matric, department"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {shown.length === 0 ? (
        <Empty>No students linked yet. Students link themselves from their profile.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Matric</th>
                <th className="p-3">Department</th>
                <th className="p-3">Level</th>
                <th className="p-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 font-medium">{s.full_name}</td>
                  <td className="p-3">{s.matric_no}</td>
                  <td className="p-3">{s.department}</td>
                  <td className="p-3">{s.level}</td>
                  <td className="p-3">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
