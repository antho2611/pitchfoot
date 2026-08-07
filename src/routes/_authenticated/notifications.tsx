import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — PitchPro" },
      { name: "description", content: "Vos alertes candidatures, messages et vues de profil." },
      { property: "og:title", content: "Notifications — PitchPro" },
      { property: "og:description", content: "Toutes vos alertes PitchPro." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const { data, refetch } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  async function markAll() {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    void refetch();
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h1 className="font-display text-5xl uppercase">Notifications</h1>
          <button onClick={markAll} className="label-xs shrink-0 underline underline-offset-4">
            Tout marquer comme lu
          </button>
        </div>

        <div className="mt-8 space-y-3">
          {data?.length ? (
            data.map((n) => (
              <div
                key={n.id}
                className={`border p-4 ${n.is_read ? "border-border bg-card" : "border-pitch bg-volt/10"}`}
              >
                <p className="font-display text-xl uppercase">{n.title}</p>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <p className="label-xs mt-2 text-foreground/40">
                  {new Date(n.created_at).toLocaleString("fr-FR")}
                </p>
                {n.link && (
                  <Link to={n.link} className="label-xs mt-2 inline-block underline underline-offset-4">
                    Ouvrir
                  </Link>
                )}
              </div>
            ))
          ) : (
            <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Aucune notification.
            </p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
