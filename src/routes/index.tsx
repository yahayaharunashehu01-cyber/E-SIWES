import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Factory,
  GraduationCap,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_UNIVERSITY_ID, DEFAULT_UNIVERSITY_NAME, UNIVERSITY_TAGLINE } from "@/lib/university";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `E-SIWES — ${DEFAULT_UNIVERSITY_NAME}` },
      {
        name: "description",
        content: `Official Students Industrial Work Experience Scheme (SIWES) platform for ${DEFAULT_UNIVERSITY_NAME}.`,
      },
      { property: "og:title", content: `E-SIWES — ${DEFAULT_UNIVERSITY_NAME}` },
      {
        property: "og:description",
        content: `Apply for placements, record daily e-logbook entries, and get supervised online at ${DEFAULT_UNIVERSITY_NAME}.`,
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: GraduationCap,
    title: "University Student Portal",
    text: "Student profile, eligibility, placement applications and documents in one centralized place.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: BookOpen,
    title: "Electronic Logbook",
    text: "Daily training activities and weekly logs, submitted and signed off digitally.",
    color: "text-violet-600 bg-violet-50",
  },
  {
    icon: ClipboardCheck,
    title: "Directorate Approvals",
    text: "The SIWES Directorate reviews placement applications and assigns supervisors in minutes.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Factory,
    title: "Verified Industry Directory",
    text: "Accredited partner organizations offering SIWES training slots across sectors.",
    color: "text-orange-600 bg-orange-50",
  },
  {
    icon: Users,
    title: "Faculty Supervision",
    text: "Supervisors evaluate daily entries, request corrections, and sign off weekly summaries.",
    color: "text-teal-600 bg-teal-50",
  },
  {
    icon: ShieldCheck,
    title: "Institutional Security",
    text: "Role-enforced data privacy connecting students, faculty supervisors, and the university admin.",
    color: "text-red-600 bg-red-50",
  },
];

const portals = [
  {
    icon: GraduationCap,
    label: "Student Portal",
    desc: "Apply for placements & maintain your daily e-logbook",
    gradient: "from-blue-600 to-indigo-700",
    role: "student" as const,
    cta: { mode: "signin" as const, role: "student" as const },
    signup: true,
    features: [
      "Submit placement applications",
      "Daily e-logbook activities",
      "Track supervisor sign-offs",
    ],
  },
  {
    icon: ClipboardCheck,
    label: "Supervisor Portal",
    desc: "Review and approve assigned students' logs",
    gradient: "from-emerald-600 to-teal-700",
    role: "industry_supervisor" as const,
    cta: { mode: "signin" as const, role: "industry_supervisor" as const },
    signup: false,
    features: [
      "View assigned students under your faculty",
      "Review daily logbook activities",
      "Leave feedback & sign off entries",
    ],
  },
];

function Landing() {
  const [stats, setStats] = useState<{
    students: number;
    placements: number;
    organizations: number;
    supervisors: number;
  }>({
    students: 0,
    placements: 0,
    organizations: 0,
    supervisors: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const [stu, plc, org, sup] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("institution_id", DEFAULT_UNIVERSITY_ID)
          .not("matric_no", "eq", ""),
        supabase
          .from("placements")
          .select("id", { count: "exact" })
          .eq("status", "approved"),
        supabase.from("organizations").select("id", { count: "exact" }),
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("institution_id", DEFAULT_UNIVERSITY_ID)
          .eq("matric_no", ""),
      ]);

      setStats({
        students: stu.count ?? 0,
        placements: plc.count ?? 0,
        organizations: org.count ?? 0,
        supervisors: sup.count ?? 0,
      });
    }

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="rounded-md bg-background/95 px-3 py-1.5 flex items-center gap-2">
            <Logo />
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              · {DEFAULT_UNIVERSITY_NAME}
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/auth" search={{ mode: "portal" }}>Sign in</Link>
            </Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/auth" search={{ mode: "signup", role: "student" }}>Student Registration</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={hero}
          alt={`${DEFAULT_UNIVERSITY_NAME} students on industrial training`}
          width={1600}
          height={1104}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="bg-hero absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-40 md:pb-36 md:pt-52">
          <p className="mb-5 inline-block rounded-full border border-accent/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {DEFAULT_UNIVERSITY_NAME} · {UNIVERSITY_TAGLINE}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] text-primary-foreground md:text-6xl text-balance-tight">
            University SIWES Training, Fully Digital.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-primary-foreground/80">
            A unified management portal connecting university students, faculty supervisors, and the SIWES Directorate — from placement application to final signed logbook.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/auth" search={{ mode: "signup", role: "student" }}>Student Sign Up</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/auth" search={{ mode: "portal" }}>Open Dedicated Portal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Institutional Stats */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x md:grid-cols-4">
          {[
            [stats.students, "Registered Students"],
            [stats.placements, "Approved Placements"],
            [stats.organizations, "Partner Companies"],
            [stats.supervisors, "Faculty Supervisors"],
          ].map(([val, label], idx) => (
            <div key={idx} className="px-6 py-8">
              <div className="font-display text-3xl font-semibold text-primary">{val}</div>
              <div className="mt-1 text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl mb-14">
          <h2 className="text-3xl font-semibold text-primary md:text-4xl">Your role in the SIWES scheme.</h2>
          <p className="mt-4 text-muted-foreground">
            Access the dedicated portal customized for your role in the {DEFAULT_UNIVERSITY_NAME} SIWES scheme.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
          {portals.map((p) => (
            <div key={p.role} className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-shadow flex flex-col justify-between">
              <div>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} mb-5`}>
                  <p.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-primary">{p.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 flex flex-col gap-2">
                <Button asChild className={`w-full bg-gradient-to-r ${p.gradient} text-white border-0 hover:opacity-90`}>
                  <Link to="/auth" search={p.cta}>
                    Sign In — {p.label} <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                {p.signup ? (
                  <Button asChild variant="ghost" className="w-full text-muted-foreground text-xs">
                    <Link to="/auth" search={{ mode: "signup", role: p.role }}>
                      New student? Create account
                    </Link>
                  </Button>
                ) : (
                  <p className="text-center text-xs text-muted-foreground pt-1">Account provisioned by the SIWES Directorate</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/40 border-y">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl font-semibold text-primary md:text-4xl">Everything SIWES, without the paperwork.</h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built for {DEFAULT_UNIVERSITY_NAME} faculties, departments, students, and partnering industrial hosts.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="bg-card p-8">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-primary">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-10">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {DEFAULT_UNIVERSITY_NAME} · {UNIVERSITY_TAGLINE}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
