import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: string;
};

export function Header({ title, subtitle, action, back }: Props) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-safe">
      <div className="min-w-0">
        {back && (
          <Link
            href={back}
            className="mb-1 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <span aria-hidden>←</span> Volver
          </Link>
        )}
        <h1 className="truncate font-display text-3xl tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
