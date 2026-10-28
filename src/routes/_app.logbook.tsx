import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Empty, PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/logbook")({
  head: () => ({ meta: [{ title: "E-Logbook — National E-SIWES" }, { name: "description", content: "Record daily SIWES activities." }, { property: "og:title", content: "E-Logbook — National E-SIWES" }, { property: "og:description", content: "Record daily SIWES activities." }] }),
  component: Logbook,
});

function weekOf(start: string, d: string) {
  return Math.max(1, Math.floor((new Date(d).getTime() - new Date(start).getTime()) / (7 * 864e5)) + 1);
}

function Logbook() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);

  const { data: placement, isLoading } = useQuery({
    queryKey: ["active-placement", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => (await supabase.from("placements").select("*, organizations(name)").eq("student_id", profile!.id).eq("status", "approved").order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const { data: entries = [] } = useQuery({
    queryKey: ["log", placement?.id],
    enabled: !!placement,
    queryFn: async () => (await supabase.from("logbook_entries").select("*").eq("placement_id", placement!.id).order("entry_date", { ascending: false })).data ?? [],
  });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const activities = (fd["activities"] || "").trim();
    const entryDate = fd["entry_date"] || new Date().toISOString().slice(0, 10);
    const skills = (fd["skills"] || "").trim();

    if (activities.length < 10) {
      toast.error("Describe your activities (at least 10 characters)");
      return;
    }
    if (!placement) {
      toast.error("No active placement found");
      return;
    }

    const payload = {
      entry_date: entryDate,
      week_number: weekOf(placement.start_date, entryDate),
      activities: activities.slice(0, 4000),
      skills: skills.slice(0, 1000),
    };

    const { error } = editing
      ? await supabase.from("logbook_entries").update({ ...payload, status: "submitted" }).eq("id", editing)
      : await supabase.from("logbook_entries").insert({ ...payload, student_id: profile!.id, placement_id: placement.id });

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Entry resubmitted" : "Entry submitted");
    form.reset();
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["log"] });
    qc.invalidateQueries({ queryKey: ["student-dash"] });
    qc.invalidateQueries({ queryKey: ["sup-log"] });
    qc.invalidateQueries({ queryKey: ["sup-dash"] });
    qc.invalidateQueries({ queryKey: ["supervised"] });
  }

  if (isLoading) return null;
  if (!placement)
    return (
      <div>
        <PageHeader title="E-Logbook" />
        <Empty>Your logbook opens once a placement is approved. <Link to="/placements" className="font-semibold text-secondary">View placements</Link></Empty>
      </div>
    );

  const editEntry = entries.find((x) => x.id === editing);
  const weeks = [...new Set(entries.map((e) => e.week_number))].sort((a, b) => b - a);

  return (
    <div>
      <PageHeader title="E-Logbook" subtitle={`${placement.organizations?.name} · ${placement.start_date} → ${placement.end_date}`} />
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <form key={editing ?? "new"} onSubmit={submit} className="h-fit space-y-4 rounded-lg border bg-card p-6 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold text-primary">{editing ? "Correct entry" : "New daily entry"}</h2>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" name="entry_date" required min={placement.start_date} max={placement.end_date} defaultValue={editEntry?.entry_date ?? new Date().toISOString().slice(0, 10)} /></div>
          <div className="space-y-1.5"><Label>Activities carried out</Label><Textarea name="activities" rows={6} required defaultValue={editEntry?.activities} /></div>
          <div className="space-y-1.5"><Label>Skills / lessons learnt</Label><Textarea name="skills" rows={3} defaultValue={editEntry?.skills} /></div>
          <div className="flex gap-2">
            <Button className="flex-1">{editing ? "Resubmit" : "Submit entry"}</Button>
            {editing && <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>}
          </div>
        </form>
        <div className="space-y-8">
          {entries.length === 0 && <Empty>No entries yet — record what you did today.</Empty>}
          {weeks.map((w) => (
            <section key={w}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Week {w}</h3>
              <div className="space-y-3">
                {entries.filter((e) => e.week_number === w).map((e) => (
                  <article key={e.id} className="rounded-lg border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">{new Date(e.entry_date).toDateString()}</span>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm">{e.activities}</p>
                    {e.skills && <p className="mt-2 text-sm text-muted-foreground">Skills: {e.skills}</p>}
                    {e.supervisor_comment && <p className="mt-3 rounded-md bg-muted p-3 text-sm"><b>Supervisor:</b> {e.supervisor_comment}</p>}
                    {e.status === "needs_correction" && <Button size="sm" variant="outline" className="mt-3" onClick={() => setEditing(e.id)}>Correct & resubmit</Button>}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
