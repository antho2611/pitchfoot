import { PageShell } from "@/components/layout/Shell";
import { Breadcrumb } from "@/components/Breadcrumb";

type Props = {
  /** Ex. "Ce joueur n'existe pas." */
  message: string;
  /** Ex. { label: "Joueurs", href: "/joueurs" } */
  section: { label: string; href: string };
};

/** 404 pour une fiche précise (joueur/club/annonce introuvable), avec fil
 * d'ariane et actions immédiatement visibles — remplace un simple <p>. */
export function EntityNotFound({ message, section }: Props) {
  return (
    <PageShell>
      <Breadcrumb
        items={[{ label: "Accueil", href: "/" }, section, { label: "Introuvable" }]}
      />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-24">
        <h1 className="font-display text-2xl uppercase">{message}</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <a
            href="/"
            className="inline-flex items-center justify-center bg-pitch px-5 py-2.5 font-display text-lg uppercase text-volt transition-colors hover:bg-field"
          >
            Retour à l'accueil
          </a>
          <a
            href={section.href}
            className="inline-flex items-center justify-center border border-border px-5 py-2.5 font-display text-lg uppercase transition-colors hover:border-pitch"
          >
            Voir {section.label.toLowerCase()}
          </a>
        </div>
      </div>
    </PageShell>
  );
}
