-- FOLLOWS (Instagram-style social graph between any two profiles)
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_public_read" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- MESSAGING GATE
-- A new conversation may only be started if the initiator follows the other
-- participant, or a real recruiting relationship already exists between them
-- (application, coach reservation, saved player). Existing conversations keep
-- working regardless (conv_read / messages_insert are unchanged), matching
-- "once connected, stay connected".
CREATE OR REPLACE FUNCTION public.can_message(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.follows WHERE follower_id = _a AND following_id = _b)
    OR EXISTS (
      SELECT 1 FROM public.applications ap
      WHERE (ap.player_id = _a AND ap.club_id = _b) OR (ap.player_id = _b AND ap.club_id = _a)
    )
    OR EXISTS (
      SELECT 1 FROM public.coach_reservations cr
      WHERE (cr.player_id = _a AND cr.coach_id = _b) OR (cr.player_id = _b AND cr.coach_id = _a)
    )
    OR EXISTS (
      SELECT 1 FROM public.saved_players sp
      WHERE (sp.player_id = _a AND sp.club_id = _b) OR (sp.player_id = _b AND sp.club_id = _a)
    )
$$;
REVOKE ALL ON FUNCTION public.can_message(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_message(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "conv_insert" ON public.conversations;
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    (participant_a = auth.uid() OR participant_b = auth.uid())
    AND public.can_message(
      auth.uid(),
      CASE WHEN participant_a = auth.uid() THEN participant_b ELSE participant_a END
    )
  );

-- REALTIME (so follower counts / follow state can live-update like the chat already does)
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
