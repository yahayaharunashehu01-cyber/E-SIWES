import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Building2, GraduationCap, ShieldCheck, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEFAULT_UNIVERSITY_ID, DEFAULT_UNIVERSITY_NAME, UNIVERSITY_FACULTIES, UNIVERSITY_DEPARTMENTS } from "@/lib/university";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: `My Profile — ${DEFAULT_UNIVERSITY_NAME}` },
      { name: "description", content: "Manage your university SIWES profile." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().max(20).optional().default(""),
  matric_no: z.string().trim().max(30).optional().default(""),
  level: z.string().trim().max(10).optional().default(""),
});

function ProfilePage() {
  const { profile, roles, session, refresh } = useAuth();
  const isStudent = roles.includes("student");
  const isSupervisor = roles.includes("industry_supervisor");
  const isInstAdmin = roles.includes("institution_admin");

  const [faculty, setFaculty] = useState<string>(() => {
    const dept = profile?.department;
    if (dept && dept.includes("—")) {
      return dept.split("—")[0]?.trim() || UNIVERSITY_FACULTIES[0] || "Faculty of Computing & Information Technology";
    }
    return UNIVERSITY_FACULTIES[0] || "Faculty of Computing & Information Technology";
  });

  const [department, setDepartment] = useState<string>(() => {
    const dept = profile?.department;
    if (dept && dept.includes("—")) {
      return dept.split("—")[1]?.trim() || "";
    }
    return dept || "";
  });

  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    const parsed = schema.safeParse(fd);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check your entries");
      return;
    }

    const fullDepartment = department.trim() ? `${faculty} — ${department.trim()}` : faculty;
    const userId = profile?.id || session?.user?.id;
    if (!userId) {
      toast.error("User session not found. Please log in again.");
      return;
    }

    setSaving(true);
    const updateData = {
      id: userId,
      email: profile?.email || session?.user?.email || "",
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || "",
      matric_no: isStudent ? (parsed.data.matric_no || "") : "",
      level: isStudent ? (parsed.data.level || "300") : "",
      department: fullDepartment,
      institution_id: DEFAULT_UNIVERSITY_ID,
    };

    // Use upsert so if profile record wasn't created yet by trigger, it gets created cleanly
    const { error } = await supabase.from("profiles").upsert(updateData, { onConflict: "id" });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved successfully!");
    refresh();
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Loading your profile details…</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refresh()}>
          Retry Loading
        </Button>
      </div>
    );
  }

  const currentRoleLabel = isStudent
    ? "University Student"
    : isSupervisor
    ? "Faculty Supervisor"
    : "SIWES Directorate Admin";

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle={`${profile.email} · ${currentRoleLabel}`}
      />

      {/* University Banner */}
      <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border bg-card max-w-2xl">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Assigned Institution</div>
          <div className="font-semibold text-primary">{DEFAULT_UNIVERSITY_NAME}</div>
        </div>
      </div>

      <form onSubmit={save} className="grid max-w-2xl gap-5 rounded-xl border bg-card p-6 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" defaultValue={profile.full_name} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" placeholder="+234..." defaultValue={profile.phone} />
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <Input disabled value={currentRoleLabel} className="bg-muted text-muted-foreground" />
        </div>

        {isStudent && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="matric_no">Matriculation number</Label>
              <Input
                id="matric_no"
                name="matric_no"
                placeholder="e.g. 190404012"
                defaultValue={profile.matric_no || ""}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="level">Level</Label>
              <Select name="level" defaultValue={profile.level || "300"}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                  <SelectItem value="500">500 Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Faculty and Department selector for ALL user roles */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label>
            {isStudent
              ? "Faculty"
              : isSupervisor
              ? "Assigned Faculty"
              : "Institutional Faculty / Directorate"}
          </Label>
          <Select
            value={faculty}
            onValueChange={(val) => {
              setFaculty(val);
              // auto suggest first department if empty
              const depts = UNIVERSITY_DEPARTMENTS[val];
              if (depts && depts.length > 0 && depts[0]) {
                setDepartment(depts[0]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIVERSITY_FACULTIES.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="dept_input">
              {isStudent
                ? "Department"
                : isSupervisor
                ? "Supervising Department"
                : "Department / Directorate Unit"}
            </Label>
            {UNIVERSITY_DEPARTMENTS[faculty] && (
              <span className="text-[11px] text-muted-foreground">Pick a suggestion or type</span>
            )}
          </div>
          <Input
            id="dept_input"
            name="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Computer Science"
            required
          />
          {UNIVERSITY_DEPARTMENTS[faculty] && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {UNIVERSITY_DEPARTMENTS[faculty].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDepartment(d)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    department.toLowerCase() === d.toLowerCase()
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2 pt-2">
          <Button className="w-full sm:w-auto" disabled={saving}>
            {saving ? "Saving changes…" : "Save profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
