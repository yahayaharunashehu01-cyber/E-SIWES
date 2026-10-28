import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Empty, PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

import { DEFAULT_UNIVERSITY_ID, DEFAULT_UNIVERSITY_NAME } from "@/lib/university";

export const Route = createFileRoute("/_app/placements")({
  head: () => ({ meta: [{ title: `Placements — ${DEFAULT_UNIVERSITY_NAME} E-SIWES` }, { name: "description", content: "Apply for and track SIWES placements." }] }),
  component: Placements,
});

function Placements() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [org, setOrg] = useState("");

  const [isCustomOrg, setIsCustomOrg] = useState(false);
  const [customOrgName, setCustomOrgName] = useState("");
  const [customOrgState, setCustomOrgState] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["my-placements", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => (await supabase.from("placements").select("*, supervisor:industry_supervisor_id(full_name,email,department), organizations(name,state)").eq("student_id", profile!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs"],
    queryFn: async () => (await supabase.from("organizations").select("id,name,state").order("name")).data ?? [],
  });

  async function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    const startDate = fd["start_date"] || "";
    const endDate = fd["end_date"] || "";
    const roleTitle = (fd["role_title"] || "").trim();

    if (!startDate || !endDate || endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    let targetOrgId = org;

    // If typing custom organization name
    if (isCustomOrg) {
      const orgName = customOrgName.trim();
      const orgState = customOrgState.trim() || "National";
      if (!orgName) {
        toast.error("Enter the organization name");
        return;
      }

      // Check if organization already exists with that name
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .ilike("name", orgName)
        .maybeSingle();

      if (existingOrg) {
        targetOrgId = existingOrg.id;
      } else {
        // Create new organization entry
        const { data: newOrg, error: orgErr } = await supabase
          .from("organizations")
          .insert({
            name: orgName,
            state: orgState,
            sector: "Industry / Private",
            address: orgState,
            slots: 10,
          })
          .select("id")
          .single();

        if (orgErr) {
          toast.error(orgErr.message);
          return;
        }
        targetOrgId = newOrg.id;
      }
    }

    if (!targetOrgId) {
      toast.error("Please select or enter an organization");
      return;
    }

    const instId = profile?.institution_id || DEFAULT_UNIVERSITY_ID;

    // Ensure student profile is linked to default university
    if (!profile?.institution_id) {
      await supabase.from("profiles").update({ institution_id: instId }).eq("id", profile!.id);
    }

    const { error } = await supabase.from("placements").insert({
      student_id: profile!.id,
      institution_id: instId,
      organization_id: targetOrgId,
      role_title: roleTitle.slice(0, 100),
      start_date: startDate,
      end_date: endDate,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application submitted to the SIWES Directorate");
    setOpen(false);
    setCustomOrgName("");
    setCustomOrgState("");
    qc.invalidateQueries({ queryKey: ["my-placements"] });
    qc.invalidateQueries({ queryKey: ["orgs"] });
    qc.invalidateQueries({ queryKey: ["university-admin-dash"] });
    qc.invalidateQueries({ queryKey: ["inst-placements"] });
  }

  async function withdraw(id: string) {
    const { error } = await supabase.from("placements").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-placements"] });
  }

  const hasMatric = !!profile?.matric_no;

  return (
    <div>
      <PageHeader
        title="SIWES Placements"
        subtitle={`Apply to a partner organization; ${DEFAULT_UNIVERSITY_NAME} SIWES Directorate reviews and assigns supervisors.`}
        action={
          hasMatric ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus /> New application</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Apply for placement</DialogTitle></DialogHeader>
                <form onSubmit={apply} className="space-y-4">
                  {/* Organization Selection or Direct Typing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Organization (Company / Agency)</Label>
                      <button
                        type="button"
                        onClick={() => setIsCustomOrg(!isCustomOrg)}
                        className="text-xs text-primary underline hover:text-primary/80"
                      >
                        {isCustomOrg ? "Choose from registered list" : "Type custom organization"}
                      </button>
                    </div>

                    {!isCustomOrg ? (
                      <Select value={org} onValueChange={setOrg}>
                        <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                        <SelectContent>
                          {orgs.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.name} — {o.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          placeholder="Organization name (e.g. NNPC, Zenith Bank, Ministry of Works)"
                          value={customOrgName}
                          onChange={(e) => setCustomOrgName(e.target.value)}
                          required={isCustomOrg}
                        />
                        <Input
                          placeholder="State / City (e.g. Abuja, Lagos, Katsina, Kano)"
                          value={customOrgState}
                          onChange={(e) => setCustomOrgState(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5"><Label>Role / unit</Label><Input name="role_title" placeholder="e.g. IT support intern, QA Trainee" required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Start date</Label><Input type="date" name="start_date" required /></div>
                    <div className="space-y-1.5"><Label>End date</Label><Input type="date" name="end_date" required /></div>
                  </div>
                  <Button className="w-full">Submit application</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      {!hasMatric && <Empty>Please complete your <Link to="/profile" className="font-semibold text-secondary">Matriculation Number & Department</Link> on your profile before applying for placement.</Empty>}
      {hasMatric && rows.length === 0 && <Empty>No applications submitted yet.</Empty>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-5">
            <div>
              <div className="font-semibold text-primary">{r.organizations?.name}</div>
              <div className="text-sm text-muted-foreground">{r.role_title} · {r.start_date} → {r.end_date}</div>
              {r.reviewer_note && <div className="mt-1 text-sm">Note: {r.reviewer_note}</div>}
              {r.status === "approved" && (
                <div className="mt-2 text-xs">
                  {r.supervisor ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      ✓ Faculty Supervisor: {r.supervisor.full_name} ({r.supervisor.department || r.supervisor.email})
                    </span>
                  ) : r.reviewer_note?.includes("Supervisor:") ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      ✓ {r.reviewer_note}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">Awaiting supervisor assignment from Directorate</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={r.status} />
              {r.status === "pending" && <Button size="sm" variant="ghost" onClick={() => withdraw(r.id)}>Withdraw</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
