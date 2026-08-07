import { supabase } from "@/integrations/supabase/client";

/** Finds or creates a conversation between the current user and another user. */
export async function openConversation(me: string, other: string) {
  const [a, b] = [me, other].sort();
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ participant_a: a, participant_b: b })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function notify(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string,
) {
  await supabase.from("notifications").insert({ user_id: userId, type, title, body, link });
}
