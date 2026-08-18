import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { follow, unfollow, isFollowing, followCounts } from "@/lib/follows";
import { notify } from "@/lib/messaging";

type Tone = "dark" | "light";

export function FollowButton({
  targetId,
  targetName,
  tone = "light",
  size = "md",
}: {
  targetId: string;
  targetName?: string;
  tone?: Tone;
  size?: "md" | "lg";
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  const { data: following, isLoading } = useQuery({
    queryKey: ["is-following", user?.id, targetId],
    enabled: !!user && user.id !== targetId,
    queryFn: () => isFollowing(user!.id, targetId),
  });

  if (user?.id === targetId) return null;

  const pad = size === "lg" ? "px-6 py-3 text-xl" : "px-5 py-2.5 text-lg";
  const filled = "bg-volt text-pitch";
  const outline = tone === "dark" ? "border border-white/25 text-white" : "border border-pitch text-pitch";

  async function toggle() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setPending(true);
    try {
      if (following) {
        await unfollow(user.id, targetId);
      } else {
        await follow(user.id, targetId);
        void notify(targetId, "follow", "Nouvel abonné", `${targetName ?? "Quelqu'un"} a commencé à vous suivre.`);
      }
      await qc.invalidateQueries({ queryKey: ["is-following", user.id, targetId] });
      await qc.invalidateQueries({ queryKey: ["follow-counts", targetId] });
    } catch {
      toast.error("Action impossible pour le moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={() => void toggle()}
      disabled={pending || isLoading}
      className={`inline-flex items-center gap-2 font-display uppercase disabled:opacity-50 ${pad} ${
        following ? outline : filled
      }`}
    >
      {following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {following ? "Abonné" : "Suivre"}
    </button>
  );
}

export function FollowCounts({ userId, tone = "light" }: { userId: string; tone?: Tone }) {
  const { data } = useQuery({
    queryKey: ["follow-counts", userId],
    queryFn: () => followCounts(userId),
  });

  return (
    <p className={`text-sm uppercase tracking-widest ${tone === "dark" ? "text-white/60" : "text-muted-foreground"}`}>
      <span className="font-semibold">{data?.followers ?? 0}</span> abonnés ·{" "}
      <span className="font-semibold">{data?.following ?? 0}</span> abonnements
    </p>
  );
}
