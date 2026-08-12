import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const searchSchema = z.object({
  role: z.enum(["player", "club", "coach"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Connexion & inscription — PitchPro" },
      {
        name: "description",
        content: "Créez votre compte joueur ou club et rejoignez le réseau PitchPro.",
      },
      { property: "og:title", content: "Connexion & inscription — PitchPro" },
      { property: "og:description", content: "Rejoignez le réseau du football amateur." },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(72),
  displayName: z.string().trim().min(2, "Nom trop court").max(80),
  firstName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
});

function AuthPage() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(role ? "signup" : "signin");
  const [accountType, setAccountType] = useState<"player" | "club" | "coach">(role ?? "player");
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    firstName: "",
    lastName: "",
  });
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function resend() {
    if (!pendingEmail) return;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
    else toast.success("Email de confirmation renvoyé.");
  }

  useEffect(() => {
    if (!loading && user) navigate({ to: "/tableau-de-bord", replace: true });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              account_type: accountType,
              display_name: parsed.data.displayName,
              first_name: parsed.data.firstName ?? "",
              last_name: parsed.data.lastName ?? "",
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Compte créé !");
          navigate({ to: "/tableau-de-bord" });
        } else {
          setPendingEmail(parsed.data.email);
          toast.success("Compte créé — confirmez votre email pour l'activer.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("Bon retour parmi nous !");
        navigate({ to: "/tableau-de-bord" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/tableau-de-bord` },
    });
    if (error) {
      toast.error(
        provider === "google"
          ? "Connexion Google impossible pour le moment."
          : "Connexion Apple impossible pour le moment.",
      );
    }
    // On success, Supabase redirects the whole page to the provider — nothing left to do here.
  }

  const input =
    "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-pitch";

  return (
    <PageShell>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="font-display text-6xl uppercase leading-[0.9]">
            {mode === "signup" ? "Rejoignez" : "Content de"}
            <br />
            <span className="bg-pitch px-2 text-volt">
              {mode === "signup" ? "le réseau" : "vous revoir"}
            </span>
          </h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            Un compte joueur pour être repéré, un compte club pour recruter, un compte préparateur
            physique pour proposer vos séances. Gratuit, sans intermédiaire.
          </p>
        </div>

        <div className="border border-pitch/10 bg-card p-6 sm:p-8">
          {pendingEmail && (
            <div className="mb-6 border-2 border-pitch bg-volt/20 p-4 text-sm">
              <p className="font-display text-2xl uppercase">Confirmez votre email</p>
              <p className="mt-2 text-foreground/80">
                Un email de confirmation vient d'être envoyé à <strong>{pendingEmail}</strong>.
                Cliquez sur le lien pour activer votre compte, puis connectez-vous.
              </p>
              <button
                type="button"
                onClick={() => void resend()}
                className="mt-3 text-xs font-bold uppercase tracking-widest underline"
              >
                Renvoyer l'email
              </button>
            </div>
          )}
          <div className="mb-6 grid grid-cols-2 gap-px bg-border">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2.5 font-display text-lg uppercase transition-colors ${
                  mode === m ? "bg-pitch text-volt" : "bg-card text-foreground/50"
                }`}
              >
                {m === "signin" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <div className="mb-5">
              <p className="label-xs mb-2 text-foreground/40">Je suis</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { v: "player", l: "Joueur" },
                    { v: "club", l: "Club" },
                    { v: "coach", l: "Préparateur" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setAccountType(o.v)}
                    className={`border-2 py-2.5 font-display text-lg uppercase ${
                      accountType === o.v ? "border-pitch bg-volt" : "border-border"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <input
                  className={input}
                  placeholder={
                    accountType === "club"
                      ? "Nom du club"
                      : accountType === "coach"
                        ? "Nom et prénom"
                        : "Nom affiché"
                  }
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  maxLength={80}
                />
                {accountType === "player" && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className={input}
                      placeholder="Prénom"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      maxLength={60}
                    />
                    <input
                      className={input}
                      placeholder="Nom"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      maxLength={60}
                    />
                  </div>
                )}
              </>
            )}
            <input
              className={input}
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={255}
            />
            <input
              className={input}
              type="password"
              placeholder="Mot de passe"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              maxLength={72}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-pitch py-3 font-display text-xl uppercase text-volt disabled:opacity-50"
            >
              {busy ? "…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
            </button>
            {mode === "signup" && (
              <p className="text-center text-xs text-muted-foreground">
                En créant un compte, vous acceptez les{" "}
                <a href="/cgu" className="underline">
                  CGU
                </a>{" "}
                et la{" "}
                <a href="/confidentialite" className="underline">
                  politique de confidentialité
                </a>
                .
              </p>
            )}
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-foreground/40">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <button
              onClick={() => void oauth("google")}
              className="w-full border-2 border-pitch py-2.5 font-display text-lg uppercase"
            >
              Continuer avec Google
            </button>
            <button
              onClick={() => void oauth("apple")}
              className="w-full border-2 border-pitch py-2.5 font-display text-lg uppercase"
            >
              Continuer avec Apple
            </button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
