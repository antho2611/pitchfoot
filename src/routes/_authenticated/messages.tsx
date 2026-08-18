import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Send, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/messaging";

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
  avatarUrl: string | null;
  preview: string;
  last_message_at: string;
};

function initials(name: string) {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return letters || "?";
}

function Avatar({ url, name, size = 44 }: { url: string | null; name: string; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-pitch font-display text-volt"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

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
      const profileIds = others.length ? others : ["00000000-0000-0000-0000-000000000000"];
      const convIds = rows.length ? rows.map((r) => r.id) : ["00000000-0000-0000-0000-000000000000"];

      const [{ data: profiles }, { data: lastMessages }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url").in("id", profileIds),
        supabase
          .from("messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false }),
      ]);

      const previewByConv = new Map<string, string>();
      for (const m of lastMessages ?? []) {
        if (!previewByConv.has(m.conversation_id)) previewByConv.set(m.conversation_id, m.content);
      }

      return rows.map((r) => {
        const other = r.participant_a === user!.id ? r.participant_b : r.participant_a;
        const profile = profiles?.find((p) => p.id === other);
        return {
          id: r.id,
          other,
          name: profile?.display_name || "Utilisateur",
          avatarUrl: profile?.avatar_url ?? null,
          preview: previewByConv.get(r.id) ?? "Nouvelle conversation",
          last_message_at: r.last_message_at,
        };
      });
    },
  });

  const active = c ?? convs?.[0]?.id;
  const activeConv = convs?.find((conv) => conv.id === active);

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
    if (activeConv) {
      void notify(activeConv.other, "message", "Nouveau message", content.slice(0, 140), `/messages?c=${active}`);
    }
    void refetch();
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-5xl uppercase">Messagerie</h1>
        <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-[300px_1fr]">
          <aside className="max-h-[70vh] overflow-y-auto bg-card">
            {convs?.length ? (
              convs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate({ to: "/messages", search: { c: conv.id } })}
                  className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors ${
                    active === conv.id ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <Avatar url={conv.avatarUrl} name={conv.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg uppercase leading-tight">{conv.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{conv.preview}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center">
                <MessageCircle className="mx-auto size-8 text-foreground/20" />
                <p className="mt-3 text-sm text-muted-foreground">Aucune conversation.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Suivez des joueurs ou des coachs pour pouvoir leur écrire.
                </p>
                <Link to="/joueurs" className="label-xs mt-3 inline-block underline underline-offset-4">
                  Découvrir des joueurs
                </Link>
              </div>
            )}
          </aside>

          <div className="flex h-[70vh] flex-col bg-card">
            {activeConv && (
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Avatar url={activeConv.avatarUrl} name={activeConv.name} size={32} />
                <p className="font-display text-lg uppercase leading-none">{activeConv.name}</p>
              </div>
            )}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages?.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] px-3.5 py-2 text-sm ${
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
