import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Send } from "lucide-react";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: z.object({ c: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Messagerie — PitchPro" },
      { name: "description", content: "Discutez en direct avec les clubs et les joueurs." },
      { property: "og:title", content: "Messagerie — PitchPro" },
      { property: "og:description", content: "Messagerie temps réel PitchPro." },
    ],
  }),
  component: MessagesPage,
});

type Conv = {
  id: string;
  other: string;
  name: string;
  last_message_at: string;
};

function MessagesPage() {
  const { user } = useAuth();
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const { data: convs } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Conv[]> => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      const rows = data ?? [];
      const others = rows.map((r) => (r.participant_a === user!.id ? r.participant_b : r.participant_a));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", others.length ? others : ["00000000-0000-0000-0000-000000000000"]);
      return rows.map((r) => {
        const other = r.participant_a === user!.id ? r.participant_b : r.participant_a;
        return {
          id: r.id,
          other,
          name: profiles?.find((p) => p.id === other)?.display_name ?? "Utilisateur",
          last_message_at: r.last_message_at,
        };
      });
    },
  });

  const active = c ?? convs?.[0]?.id;

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", active],
    enabled: !!active,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", active!)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!active) return;
    const channel = supabase
      .channel(`conv-${active}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` },
        () => void refetch(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [active, refetch]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !active || !user) return;
    setText("");
    await supabase.from("messages").insert({
      conversation_id: active,
      sender_id: user.id,
      content: content.slice(0, 2000),
    });
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", active);
    void refetch();
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-5xl uppercase">Messagerie</h1>
        <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-[260px_1fr]">
          <aside className="max-h-[70vh] overflow-y-auto bg-card">
            {convs?.length ? (
              convs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate({ to: "/messages", search: { c: conv.id } })}
                  className={`block w-full border-b border-border px-4 py-3 text-left ${
                    active === conv.id ? "bg-secondary" : ""
                  }`}
                >
                  <p className="truncate font-display text-lg uppercase">{conv.name}</p>
                  <p className="label-xs text-foreground/40">
                    {new Date(conv.last_message_at).toLocaleDateString("fr-FR")}
                  </p>
                </button>
              ))
            ) : (
              <p className="p-4 text-sm text-muted-foreground">Aucune conversation.</p>
            )}
          </aside>

          <div className="flex h-[70vh] flex-col bg-card">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages?.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] px-3 py-2 text-sm ${
                    m.sender_id === user?.id
                      ? "ml-auto bg-pitch text-white"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {m.content}
                  <span className="mt-1 block text-[10px] opacity-50">
                    {new Date(m.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={active ? "Votre message…" : "Sélectionnez une conversation"}
                disabled={!active}
                maxLength={2000}
                className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-pitch"
              />
              <button
                type="submit"
                disabled={!active}
                className="grid w-12 shrink-0 place-items-center bg-pitch text-volt disabled:opacity-40"
                aria-label="Envoyer"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
