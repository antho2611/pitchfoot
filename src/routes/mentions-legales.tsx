import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/Shell";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — PitchPro" },
      { name: "description", content: "Mentions légales du site PitchPro." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <LegalPage title="Mentions légales" updated="12 août 2026">
        <LegalSection title="Éditeur du site">
          <p>
            Le site PitchPro est édité par Anthony Seguin, personne physique agissant à titre
            individuel (non-professionnel à ce stade).
          </p>
          <p>
            Contact :{" "}
            <a className="underline" href="mailto:anth.seguin@gmail.com">
              anth.seguin@gmail.com
            </a>
          </p>
          <p>
            Conformément à l'article 6-III de la loi n° 2004-575 du 21 juin 2004 pour la confiance
            dans l'économie numérique, l'éditeur étant une personne physique n'exerçant pas à titre
            professionnel, ses coordonnées complètes (adresse postale, téléphone) ne sont pas
            publiées mais restent disponibles auprès de l'hébergeur sur demande des autorités
            compétentes.
          </p>
        </LegalSection>

        <LegalSection title="Directeur de la publication">
          <p>Anthony Seguin.</p>
        </LegalSection>

        <LegalSection title="Hébergement">
          <p>
            Le site est hébergé par Render Services, Inc. (
            <a className="underline" href="https://render.com" target="_blank" rel="noreferrer">
              render.com
            </a>
            ).
          </p>
          <p>
            La base de données, l'authentification et le stockage des fichiers sont hébergés par
            Supabase, Inc. (
            <a className="underline" href="https://supabase.com" target="_blank" rel="noreferrer">
              supabase.com
            </a>
            ).
          </p>
        </LegalSection>

        <LegalSection title="Propriété intellectuelle">
          <p>
            La structure du site, sa charte graphique, ses textes et son code sont, sauf mention
            contraire, la propriété d'Anthony Seguin. Toute reproduction non autorisée est
            interdite. Les contenus publiés par les utilisateurs (profils, photos, vidéos, annonces)
            restent la propriété de leurs auteurs, qui garantissent disposer des droits nécessaires
            à leur publication.
          </p>
        </LegalSection>

        <LegalSection title="Responsabilité">
          <p>
            PitchPro met en relation des joueurs, clubs et préparateurs physiques de football
            amateur ; les échanges, recrutements et engagements qui en résultent relèvent de la
            seule responsabilité des utilisateurs. L'éditeur s'efforce d'assurer l'exactitude des
            informations diffusées mais ne peut garantir l'exhaustivité des contenus publiés par des
            tiers.
          </p>
        </LegalSection>

        <LegalSection title="Droit applicable">
          <p>
            Les présentes mentions légales sont soumises au droit français. Tout litige relève, à
            défaut de résolution amiable, des tribunaux français compétents.
          </p>
        </LegalSection>
      </LegalPage>
    </PageShell>
  );
}
