import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/Shell";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — PitchPro" },
      {
        name: "description",
        content: "Comment PitchPro collecte, utilise et protège vos données personnelles.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <LegalPage title="Politique de confidentialité" updated="12 août 2026">
        <LegalSection title="Responsable du traitement">
          <p>
            Anthony Seguin, éditeur du site PitchPro, est responsable du traitement des données
            personnelles décrit ci-dessous. Contact :{" "}
            <a className="underline" href="mailto:anth.seguin@gmail.com">
              anth.seguin@gmail.com
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="Données collectées">
          <ul className="list-disc space-y-1 pl-5">
            <li>Identité et contact : email, prénom, nom, ville, pays, nationalité.</li>
            <li>
              Profil sportif : poste, statistiques par saison, parcours en club, palmarès, photo, CV
              et vidéos que vous choisissez de mettre en ligne.
            </li>
            <li>Contenu que vous publiez : annonces, messages échangés avec d'autres membres.</li>
            <li>
              Données techniques minimales nécessaires au fonctionnement du compte (identifiant de
              session).
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Finalités et base légale">
          <p>
            Ces données sont traitées pour permettre la création et la gestion de votre compte, la
            mise en relation entre joueurs, clubs et préparateurs, la messagerie, et la gestion des
            abonnements Premium — sur la base de l'exécution du contrat qui vous lie à PitchPro
            (utilisation du service) et, pour les communications, de votre consentement.
          </p>
        </LegalSection>

        <LegalSection title="Destinataires et sous-traitants">
          <p>Vos données sont hébergées et traitées par les prestataires suivants :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase, Inc.</strong> — base de données, authentification et stockage des
              fichiers (photos, CV, vidéos).
            </li>
            <li>
              <strong>Render Services, Inc.</strong> — hébergement de l'application web.
            </li>
            <li>
              <strong>Brevo (Sendinblue SAS)</strong> — envoi des emails transactionnels
              (confirmation de compte, notifications).
            </li>
          </ul>
          <p>
            Vos données ne sont ni vendues ni cédées à des tiers à des fins publicitaires. Votre
            profil (informations sportives que vous choisissez de rendre visibles) est consultable
            par les autres utilisateurs du site dans le cadre normal du service.
          </p>
        </LegalSection>

        <LegalSection title="Durée de conservation">
          <p>
            Vos données sont conservées tant que votre compte est actif. Elles sont supprimées
            définitivement dès la suppression de votre compte, à votre initiative depuis la page «
            Mon profil », ou sur simple demande par email.
          </p>
        </LegalSection>

        <LegalSection title="Vos droits">
          <p>
            Conformément au Règlement général sur la protection des données (RGPD), vous disposez
            d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition sur
            vos données. Vous pouvez :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Modifier vos informations directement depuis votre page de profil.</li>
            <li>
              Supprimer définitivement votre compte et toutes vos données depuis la page « Mon
              profil ».
            </li>
            <li>
              Nous contacter à{" "}
              <a className="underline" href="mailto:anth.seguin@gmail.com">
                anth.seguin@gmail.com
              </a>{" "}
              pour toute autre demande relative à vos données.
            </li>
          </ul>
          <p>
            Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (
            <a className="underline" href="https://www.cnil.fr" target="_blank" rel="noreferrer">
              cnil.fr
            </a>
            ).
          </p>
        </LegalSection>

        <LegalSection title="Cookies et stockage local">
          <p>
            PitchPro n'utilise pas de cookies publicitaires ou de traceurs tiers. Seul le stockage
            local de votre navigateur (localStorage) est utilisé, à des fins strictement techniques,
            pour maintenir votre session connectée.
          </p>
        </LegalSection>
      </LegalPage>
    </PageShell>
  );
}
