import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FREE_SEARCH_QUOTA, PLANS, planForAccount, useSubscription, type PlanId } from "@/lib/premium";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Abonnements Premium — PitchPro" },
      {
        name: "description",
        content:
          "Premium Joueur à 5 €/mois et Premium Club à 450 €/mois : visibilité accrue, filtres avancés, recherches illimitées et export des profils.",
      },
      { property: "og:title", content: "Abonnements Premium — PitchPro" },
      {
        property: "og:description",
        content: "Débloquez la visibilité, les filtres avancés et l'export des profils.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PremiumPage,
});

function PremiumPage() {
  const { user, accountType } = useAuth();
  const navigate = useNavigate();
  const { subscription, isPremium, refetch } = useSubscription();
  const [busy, setBusy] = useState<string | null>(null);

  async function choose(planId: PlanId) {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (planId !== planForAccount(accountType)) {
      toast.error("Ce plan ne correspond pas à votre type de compte.");
      return;
    }
    setBusy(planId);
    try {
      const { error } = await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          plan: planId,
          status: "pending",
          amount_cents: PLANS[planId].amountCents,
          currency: "EUR",
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      await refetch();
      toast.success("Demande enregistrée — le paiement sera disponible très bientôt.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (!user) return;
    setBusy("cancel");
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", cancel_at_period_end: true })
        .eq("user_id", user.id);
      if (error) throw error;
      await refetch();
      toast.success("Abonnement annulé.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageShell>
      <section className="border-b border-pitch/10 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="label-xs text-foreground/40">Abonnements</p>
          <h1 className="mt-3 font-display text-6xl uppercase leading-[0.9] sm:text-7xl">
            Passez en <span className="bg-pitch px-2 text-volt">Premium</span>
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Visibilité accrue pour les joueurs, filtres avancés, recherches illimitées et export des
            profils pour les clubs. Les comptes gratuits disposent de {FREE_SEARCH_QUOTA} recherches
            filtrées par mois.
          </p>
          {isPremium && (
            <p className="mt-4 inline-block bg-volt px-3 py-1 font-display text-lg uppercase text-pitch">
              Votre compte est Premium
            </p>
          )}
          {subscription?.status === "pending" && (
            <p className="mt-4 border border-pitch/20 bg-card p-4 text-sm">
              Votre demande d'abonnement <strong>{PLANS[subscription.plan].name}</strong> est
              enregistrée. Elle sera activée dès la mise en ligne du paiement en ligne.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3">
        {(Object.values(PLANS) as (typeof PLANS)[keyof typeof PLANS][]).map((plan) => {
          const mine = !!user && plan.id === planForAccount(accountType);
          return (
            <article
              key={plan.id}
              className={`flex flex-col border-2 p-8 ${
                mine ? "border-pitch bg-card" : "border-border bg-card/60"
              }`}
            >
              <p className="label-xs text-foreground/40">
                {plan.audience === "player" ? "Pour les joueurs" : "Pour les clubs"}
              </p>
              <h2 className="mt-2 font-display text-4xl uppercase">{plan.name}</h2>
              <p className="mt-2 font-display text-5xl">{plan.priceLabel}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-pitch" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {isPremium && mine ? (
                <button
                  onClick={cancel}
                  disabled={busy === "cancel"}
                  className="mt-8 w-full border-2 border-pitch py-3 font-display text-xl uppercase disabled:opacity-50"
                >
                  Annuler l'abonnement
                </button>
              ) : (
                <button
                  onClick={() => choose(plan.id)}
                  disabled={busy === plan.id || (!!user && !mine)}
                  className="mt-8 w-full bg-pitch py-3 font-display text-xl uppercase text-volt disabled:opacity-40"
                >
                  {!user
                    ? "Créer un compte"
                    : !mine
                      ? "Réservé aux " + (plan.audience === "player" ? "joueurs" : plan.audience === "club" ? "clubs" : "préparateurs")
                      : busy === plan.id
                        ? "…"
                        : "Choisir ce plan"}
                </button>
              )}
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Le paiement en ligne sera activé prochainement. En attendant, votre demande est
          enregistrée et notre équipe active votre accès manuellement.{" "}
          <Link to="/tableau-de-bord" className="underline">
            Voir mon tableau de bord
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
