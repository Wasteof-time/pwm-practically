import Link from "next/link";

const VERSIONS = [
  { id: "v1", href: "/v1", name: "Challenges", title: "Open Challenges mode" },
  { id: "v2", href: "/v2", name: "Basics", title: "Open Basics mode" },
  { id: "v3", href: "/v3", name: "Advanced", title: "Open Advanced mode" },
] as const;

type VersionId = (typeof VERSIONS)[number]["id"];

type VersionNavProps = {
  current: VersionId;
};

export function VersionNav({ current }: VersionNavProps) {
  const others = VERSIONS.filter((v) => v.id !== current);

  return (
    <nav
      aria-label="Switch mode"
      className="flex shrink-0 items-center gap-1.5"
    >
      {others.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          title={v.title}
          className="inline-flex items-center justify-center rounded-full border border-border/90 bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground/90 shadow-sm transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-[0.98] sm:px-4 sm:py-2"
        >
          {v.name}
        </Link>
      ))}
    </nav>
  );
}
