import { Link } from "@tanstack/react-router";
import { DEFAULT_UNIVERSITY_SHORT, DEFAULT_UNIVERSITY_LOCATION } from "@/lib/university";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 font-display text-sm font-bold text-white shadow-sm">
        FD
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display text-base font-bold tracking-tight ${
            inverted ? "text-sidebar-foreground" : "text-primary"
          }`}
        >
          {DEFAULT_UNIVERSITY_SHORT} <span className="text-emerald-600 font-normal">E-SIWES</span>
        </span>
        <span
          className={`block text-[10px] tracking-wider uppercase font-medium ${
            inverted ? "text-sidebar-foreground/60" : "text-muted-foreground"
          }`}
        >
          {DEFAULT_UNIVERSITY_LOCATION}
        </span>
      </span>
    </Link>
  );
}
