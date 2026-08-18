import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — PitchPro" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte PitchPro." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("8 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour.");
      navigate({ to: "/tableau-de-bord" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-pitch";

  return (
    <PageShell>
      <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <h1 className="font-display text-5xl uppercase leading-none">
          Nouveau <span className="bg-pitch px-2 text-volt">mot de passe</span>
        </h1>
        {!ready ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Ouvrez cette page depuis le lien reçu par email pour réinitialiser votre mot de passe.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-3">
            <input
              className={input}
              type="password"
              placeholder="Nouveau mot de passe"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
            />
            <input
              className={input}
              type="password"
              placeholder="Confirmer le mot de passe"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              maxLength={72}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-pitch py-3 font-display text-xl uppercase text-volt disabled:opacity-50"
            >
              {busy ? "…" : "Mettre à jour"}
            </button>
          </form>
        )}
      </section>
    </PageShell>
  );
}
