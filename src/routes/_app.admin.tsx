import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, GraduationCap, Users, Briefcase, CheckCircle2, XCircle, Search, TrendingUp } from "lucide-react";
import { Empty, PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "National Admin — E-SIWES" },
      { name: "description", content: "National SIWES oversight." },
    ],
  }),
  component: Admin,
});

function StatCard({
  label,
  value,
  icon: Icon,
  color = "blue",
}: {
  label: string;
  value: number | string;
  icon: typeof Building2;
  color?: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-primary font-display">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function Admin() {
  const { roles } = useAuth();
  const qc = useQueryClient();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [q, setQ] = useState("");
  const isAdmin = roles.includes("super_admin");

  useEffect(() => {
    supabase.rpc("public_stats").then(({ data }) => setStats(data as Record<string, number>));
  }, []);

  const { data } = useQuery({
    queryKey: ["admin"],
    enabled: isAdmin,
    queryFn: async () => {
      const [i, p, s] = await Promise.all([
        supabase.from("institutions").select("*").order("created_at", { ascending: false }),
        supabase.from("placements").select("status, institutions(name)"),
        supabase.from("profiles").select("id,full_name,matric_no,department,email,institution_id,institutions(name)").order("full_name"),
      ]);
      return { institutions: i.data ?? [], placements: p.data ?? [], students: s.data ?? [] };
    },
  });

  async function setStatus(id: string, status: "approved" | "suspended") {
    const { error } = await supabase.from("institutions").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Institution ${status}`);
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  if (!isAdmin) return <Empty>National administrator access only. Contact the system administrator.</Empty>;

  const byInst = Object.entries(
    (data?.placements ?? []).reduce<Record<string, number>>((a, p) => {
      const n = p.institutions?.name ?? "?";
      a[n] = (a[n] ?? 0) + 1;
      return a;
    }, {})
  )
    .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const filteredStudents = (data?.students ?? []).filter((s) =>
    `${s.full_name} ${s.matric_no} ${s.department} ${s.email}`.toLowerCase().includes(q.toLowerCase())
  );

  const filteredInstitutions = (data?.institutions ?? []).filter((i) =>
    `${i.name} ${i.type} ${i.state} ${i.email}`.toLowerCase().includes(q.toLowerCase())
  );

  const statsObj = stats as Record<string, number> | undefined;

  return (
    <div>
      <PageHeader
        title="National Overview"
        subtitle="Manage institutions, students and placements nationwide."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Institutions" value={statsObj?.["institutions"] ?? "—"} icon={Building2} color="blue" />
        <StatCard label="Students" value={statsObj?.["students"] ?? "—"} icon={GraduationCap} color="purple" />
        <StatCard label="Organizations" value={statsObj?.["organizations"] ?? "—"} icon={TrendingUp} color="green" />
        <StatCard label="Placements" value={statsObj?.["placements"] ?? "—"} icon={Briefcase} color="orange" />
      </div>

      {/* Chart */}
      {byInst.length > 0 && (
        <div className="mt-8 rounded-xl border bg-card p-6">
          <h2 className="mb-6 font-semibold text-primary">Placement applications by institution</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byInst}>
                <XAxis dataKey="name" fontSize={11} tick={{ fill: "var(--color-muted-foreground)" }} />
                <YAxis allowDecimals={false} fontSize={11} tick={{ fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="count" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="institutions">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <TabsList>
              <TabsTrigger value="institutions">
                <Building2 className="w-4 h-4 mr-1.5" />
                Institutions
              </TabsTrigger>
              <TabsTrigger value="students">
                <GraduationCap className="w-4 h-4 mr-1.5" />
                All students
              </TabsTrigger>
            </TabsList>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 w-72 max-w-full"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="institutions">
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">State</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground text-sm">No institutions found.</td>
                    </tr>
                  ) : filteredInstitutions.map((i) => (
                    <tr key={i.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-primary">{i.name}</div>
                        <div className="text-xs text-muted-foreground">{i.email}</div>
                      </td>
                      <td className="p-4 text-muted-foreground">{i.type}</td>
                      <td className="p-4 text-muted-foreground">{i.state}</td>
                      <td className="p-4">
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {i.status !== "approved" && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => setStatus(i.id, "approved")}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                          )}
                          {i.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => setStatus(i.id, "suspended")}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Suspend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Matric No.</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Institution</th>
                    <th className="p-4">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.filter((s) => !!s.matric_no).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground text-sm">No students found.</td>
                    </tr>
                  ) : filteredStudents.filter((s) => !!s.matric_no).map((s) => (
                    <tr key={s.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-primary">{s.full_name}</td>
                      <td className="p-4 text-muted-foreground">{s.matric_no}</td>
                      <td className="p-4 text-muted-foreground">{s.department}</td>
                      <td className="p-4 text-muted-foreground">{s.institutions?.name ?? "—"}</td>
                      <td className="p-4 text-muted-foreground">{s.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
