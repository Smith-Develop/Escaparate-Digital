import Link from "next/link";

type Props = {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <h2 className="font-display text-xl">{title}</h2>
      <p className="max-w-xs text-sm leading-relaxed text-ink-muted">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
