import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

const SITE_URL = "https://pitchfoot.onrender.com";

/**
 * Fil d'ariane : navigation contextuelle + JSON-LD BreadcrumbList pour les
 * moteurs de recherche (liens simples <a>, lisibles sans exécuter le JS).
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Fil d'ariane" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="font-medium uppercase tracking-wide text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="font-medium uppercase tracking-wide text-foreground/70"
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="size-3 text-muted-foreground/50" />}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
