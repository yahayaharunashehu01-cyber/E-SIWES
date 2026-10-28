import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Users, CheckCircle2, AlertTriangle, Clock, BookOpen, ChevronRight, User } from "lucide-react";
import { Empty, PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/supervise")({
  head: () => ({
    meta: [
      { title: "Assigned students — E-SIWES" },
      { name: "description", content: "Review student logbooks." },
    ],
  }),
  component: Supervise,
});

function Supervise() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"students" | "logbook">("students");

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ["supervised", profile?.id, profile?.email],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placements")
        .select(
          "*, profiles:student_id(id,full_name,matric_no,department,level,email,phone), organizations(name,sector,state)"
        )
        .eq("industry_supervisor_id", profile!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching supervised placements:", error);
      }
      let list = data ?? [];

      // Fallback: If no direct placements by id, check if any placement mentions supervisor's email in reviewer_note
      if (list.length === 0 && profile?.email) {
        const { data: notePlacements } = await supabase
          .from("placements")
          .select(
            "*, profiles:student_id(id,full_name,matric_no,department,level,email,phone), organizations(name,sector,state)"
          )
          .ilike("reviewer_note", `%${profile.email}%`);

        if (notePlacements && notePlacements.length > 0) {
          list = notePlacements;
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

      return list;
    },
  });

  const current = placements.find((p) => p.id === selected) ?? placements[0];

  const { data: entries = [] } = useQuery({
    queryKey: ["sup-log", current?.id],
    enabled: !!current?.id,
    queryFn: async () =>
      (
        await supabase
          .from("logbook_entries")
          .select("*")
          .eq("placement_id", current!.id)
          .order("entry_date", { ascending: false })
      ).data ?? [],
  });

  async function review(id: string, status: "approved" | "needs_correction") {
    const comment = (comments[id] ?? "").trim().slice(0, 1000);
    if (status === "needs_correction" && !comment) {
      toast.error("Explain what needs correcting");
      return;
    }
    const { error } = await supabase
      .from("logbook_entries")
      .update({ status, supervisor_comment: comment, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Entry approved ✓" : "Correction requested");
    qc.invalidateQueries({ queryKey: ["sup-log"] });
    qc.invalidateQueries({ queryKey: ["sup-dash"] });
    qc.invalidateQueries({ queryKey: ["student-dash"] });
    qc.invalidateQueries({ queryKey: ["log"] });
  }

  const pendingCount = entries.filter((e) => e.status === "submitted").length;
  const approvedCount = entries.filter((e) => e.status === "approved").length;

  if (isLoading) return null;

  return (
    <div>
      <PageHeader
        title="Assigned Students"
        subtitle={`${placements.length} student${placements.length !== 1 ? "s" : ""} currently assigned to you`}
      />

      {placements.length === 0 ? (
        <Empty>
          No students assigned yet. The FUDMA SIWES Directorate assigns students to you under your department using your account email <b>({profile?.email})</b>.
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Student list panel */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              Students ({placements.length})
            </div>
            {placements.map((p) => {
              const isCurrent = current?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p.id);
                    setTab("logbook");
                  }}
                  className={`w-full rounded-xl border p-4 text-left text-sm transition-all ${
                    isCurrent
                      ? "border-secondary bg-secondary/5 shadow-sm"
                      : "border-border bg-card hover:border-secondary/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{p.profiles?.full_name || "Student"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {p.profiles?.matric_no} · {p.profiles?.department}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${isCurrent ? "text-secondary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.organizations?.name}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {current && (
            <div>
              {/* Student profile card */}
              <div className="rounded-xl border bg-card p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-primary">{current.profiles?.full_name}</h2>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{current.profiles?.matric_no}</span>
                      <span>·</span>
                      <span>{current.profiles?.department}</span>
                      <span>·</span>
                      <span>Level {current.profiles?.level}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">{current.profiles?.email}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold text-primary font-display">{entries.length}</div>
                    <div className="text-xs text-muted-foreground">Total entries</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-orange-600 font-display">{pendingCount}</div>
                    <div className="text-xs text-muted-foreground">Pending review</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-emerald-600 font-display">{approvedCount}</div>
                    <div className="text-xs text-muted-foreground">Approved</div>
                  </div>
                </div>
              </div>

              {/* Logbook entries */}
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-secondary" />
                <h3 className="font-semibold text-primary">Logbook Entries</h3>
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="text-xs">{pendingCount} pending</Badge>
                )}
              </div>

              {entries.length === 0 ? (
                <Empty>No entries submitted yet by this student.</Empty>
              ) : (
                <div className="space-y-3">
                  {entries.map((e) => (
                    <article key={e.id} className="rounded-xl border bg-card p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-primary">
                          Week {e.week_number} · {new Date(e.entry_date).toDateString()}
                        </span>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">{e.activities}</p>
                      {e.skills && (
                        <div className="mt-3 rounded-lg bg-muted px-3 py-2">
                          <span className="text-xs font-semibold text-muted-foreground">Skills / lessons: </span>
                          <span className="text-xs text-muted-foreground">{e.skills}</span>
                        </div>
                      )}
                      {e.status === "submitted" ? (
                        <div className="mt-4 space-y-2">
                          <Textarea
                            placeholder="Write a comment (required if requesting corrections)"
                            rows={2}
                            value={comments[e.id] ?? ""}
                            onChange={(ev) => setComments({ ...comments, [e.id]: ev.target.value })}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => review(e.id, "approved")}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-300 text-orange-700 hover:bg-orange-50"
                              onClick={() => review(e.id, "needs_correction")}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Request correction
                            </Button>
                          </div>
                        </div>
                      ) : e.supervisor_comment ? (
                        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm">
                          <span className="font-semibold text-blue-800">Your comment: </span>
                          <span className="text-blue-700">{e.supervisor_comment}</span>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
