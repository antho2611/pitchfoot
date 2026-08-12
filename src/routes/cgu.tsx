import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/Shell";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/cgu")({
  head: () => ({
    meta: [
      { title: "Conditions générales d'utilisation — PitchPro" },
      {
        name: "description",
        content: "Conditions générales d'utilisation du site PitchPro.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <LegalPage title="Conditions générales d'utilisation" updated="12 août 2026">
        <LegalSection title="1. Objet">
          <p>
            PitchPro est une plateforme de mise en relation entre joueurs de football amateur, clubs
            et préparateurs physiques : création de profils, publication d'annonces, recherche de
            joueurs ou de clubs, messagerie, séances de préparation physique et ressources (ebooks).
            L'utilisation du site implique l'acceptation pleine et entière des présentes CGU.
          </p>
        </LegalSection>

        <LegalSection title="2. Inscription et comptes">
          <p>
            L'inscription est ouverte aux joueurs, clubs et préparateurs physiques majeurs, ou
            mineurs sous la responsabilité d'un représentant légal pour ce qui concerne les
            informations les concernant. Chaque compte est nominatif et personnel. La complétion du
            profil (identité sportive, poste, statistiques selon le type de compte) est obligatoire
            avant l'accès aux fonctionnalités du site. L'utilisateur garantit l'exactitude des
            informations fournies et s'engage à les tenir à jour.
          </p>
        </LegalSection>

        <LegalSection title="3. Contenus publiés">
          <p>
            Chaque utilisateur reste responsable des contenus qu'il publie (texte, photos, vidéos,
            documents) et garantit détenir les droits nécessaires à leur diffusion. Sont interdits
            les contenus mensongers, injurieux, discriminatoires, ou portant atteinte aux droits de
            tiers. Tout compte ou contenu signalé peut être examiné et, le cas échéant, retiré ou
            suspendu par l'éditeur.
          </p>
        </LegalSection>

        <LegalSection title="4. Messagerie">
          <p>
            La messagerie intégrée permet aux utilisateurs d'échanger dans le cadre de leur mise en
            relation sportive. Elle ne doit pas être utilisée à des fins de démarchage commercial
            non sollicité ou de harcèlement. L'éditeur peut consulter les messages signalés dans le
            cadre du traitement d'un signalement.
          </p>
        </LegalSection>

        <LegalSection title="5. Abonnements Premium">
          <p>
            Des offres Premium sont proposées : Premium Joueur (5 €/mois), Premium Club (450 €/mois)
            et Premium Préparateur (19 €/mois), donnant accès à des fonctionnalités de visibilité et
            de recherche avancées décrites sur la page{" "}
            <a className="underline" href="/premium">
              Premium
            </a>
            . Le paiement en ligne n'est pas encore activé : toute demande d'abonnement est
            enregistrée puis activée manuellement par l'éditeur. Un abonnement peut être annulé à
            tout moment depuis le compte utilisateur ; l'annulation prend effet à la fin de la
            période en cours.
          </p>
        </LegalSection>

        <LegalSection title="6. Suppression de compte">
          <p>
            Chaque utilisateur peut supprimer définitivement son compte et l'ensemble des données
            associées depuis la page « Mon profil ». Cette action est irréversible. L'éditeur peut
            également suspendre ou supprimer un compte en cas de non-respect des présentes CGU.
          </p>
        </LegalSection>

        <LegalSection title="7. Responsabilité">
          <p>
            PitchPro est un service de mise en relation ; l'éditeur n'est pas partie aux échanges,
            recrutements, contrats ou engagements conclus entre utilisateurs et n'en garantit ni le
            résultat ni la véracité des informations échangées. Le site est fourni « en l'état »,
            sans garantie de disponibilité continue.
          </p>
        </LegalSection>

        <LegalSection title="8. Évolution des CGU">
          <p>
            Les présentes CGU peuvent être modifiées à tout moment ; la version applicable est celle
            publiée sur cette page à la date de connexion de l'utilisateur.
          </p>
        </LegalSection>

        <LegalSection title="9. Droit applicable">
          <p>
            Les présentes CGU sont soumises au droit français. Voir aussi les{" "}
            <a className="underline" href="/mentions-legales">
              mentions légales
            </a>{" "}
            et la{" "}
            <a className="underline" href="/confidentialite">
              politique de confidentialité
            </a>
            .
          </p>
        </LegalSection>
      </LegalPage>
    </PageShell>
  );
}
