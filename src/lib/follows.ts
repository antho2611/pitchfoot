import { supabase } from "@/integrations/supabase/client";

export async function isFollowing(follower: string, following: string) {
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", follower)
    .eq("following_id", following)
    .maybeSingle();
  return !!data;
}

export async function follow(follower: string, following: string) {
  const { error } = await supabase.from("follows").insert({ follower_id: follower, following_id: following });
  if (error) throw error;
}

export async function unfollow(follower: string, following: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", follower)
    .eq("following_id", following);
  if (error) throw error;
}

export async function followCounts(userId: string) {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export function isPermissionError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? "");
  return /row-level security/i.test(message);
}
