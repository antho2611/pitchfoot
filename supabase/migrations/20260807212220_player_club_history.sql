CREATE TABLE public.player_club_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  club_name text NOT NULL,
  season_start text NOT NULL,
  season_end text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_club_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_club_history TO authenticated;
GRANT ALL ON public.player_club_history TO service_role;
ALTER TABLE public.player_club_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "club_history_public_read" ON public.player_club_history FOR SELECT USING (true);
CREATE POLICY "club_history_write_own" ON public.player_club_history FOR ALL TO authenticated
  USING (player_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (player_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
