import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/organizations")({
  head: () => ({ meta: [{ title: "Organizations — National E-SIWES" }, { name: "description", content: "Approved industrial organizations directory." }, { property: "og:title", content: "Organizations — National E-SIWES" }, { property: "og:description", content: "Industrial organizations directory." }] }),
  component: Orgs,
});

function Orgs() {
  const { roles, profile } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const canAdd = roles.some((r) => ["org_admin", "institution_admin", "super_admin"].includes(r));
  const { data: rows = [] } = useQuery({
    queryKey: ["orgs-full"],
    queryFn: async () => (await supabase.from("organizations").select("*").order("name")).data ?? [],
  });

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const name = (fd["name"] || "").trim();
    const sector = (fd["sector"] || "").trim();
    const state = (fd["state"] || "").trim();
    const address = (fd["address"] || "").trim();
    const email = (fd["email"] || "").trim();
    const slots = Math.max(0, Math.min(500, Number(fd["slots"]) || 0));

    if (name.length < 2) {
      toast.error("Enter a name");
      return;
    }
    const { error } = await supabase.from("organizations").insert({
      name: name.slice(0, 150),
      sector: sector.slice(0, 80),
      state: state.slice(0, 50),
      address: address.slice(0, 200),
      email: email.slice(0, 255),
      slots,
      created_by: profile!.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Organization added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["orgs-full"] });
    qc.invalidateQueries({ queryKey: ["orgs"] });
  }

  const shown = rows.filter((r) => `${r.name} ${r.sector} ${r.state}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader
        title="Industrial organizations"
        subtitle={`${rows.length} organizations accepting SIWES students`}
        action={canAdd && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus /> Add organization</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add organization</DialogTitle></DialogHeader>
              <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2"><Label>Name</Label><Input name="name" required /></div>
                <div className="space-y-1.5"><Label>Sector</Label><Input name="sector" /></div>
                <div className="space-y-1.5"><Label>State</Label><Input name="state" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input name="address" /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" /></div>
                <div className="space-y-1.5"><Label>Available slots</Label><Input name="slots" type="number" defaultValue={5} /></div>
                <Button className="sm:col-span-2">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />
      <Input className="mb-6 max-w-sm" placeholder="Search by name, sector or state" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((o) => (
          <div key={o.id} className="rounded-lg border bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-secondary">{o.sector}</div>
            <div className="mt-2 font-display text-lg font-semibold text-primary">{o.name}</div>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {o.address || o.state}</div>
            <div className="mt-4 flex justify-between text-sm"><span>{o.slots} slots</span><span className="text-muted-foreground">{o.email}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
