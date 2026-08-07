ALTER TABLE public.coach_annonces
  ADD COLUMN IF NOT EXISTS reserved_count integer NOT NULL DEFAULT 0;

CREATE TYPE public.reservation_status AS ENUM ('en_attente','acceptee','refusee','annulee');

CREATE TABLE public.coach_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid NOT NULL REFERENCES public.coach_annonces(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  status public.reservation_status NOT NULL DEFAULT 'en_attente',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (annonce_id, player_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_reservations TO authenticated;
GRANT ALL ON public.coach_reservations TO service_role;

ALTER TABLE public.coach_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players see their reservations"
  ON public.coach_reservations FOR SELECT TO authenticated
  USING (auth.uid() = player_id OR auth.uid() = coach_id);

CREATE POLICY "Players create their reservations"
  ON public.coach_reservations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Coach or player updates reservation"
  ON public.coach_reservations FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id OR auth.uid() = player_id)
  WITH CHECK (auth.uid() = coach_id OR auth.uid() = player_id);

CREATE POLICY "Player deletes own reservation"
  ON public.coach_reservations FOR DELETE TO authenticated
  USING (auth.uid() = player_id);

CREATE TRIGGER coach_reservations_updated_at
  BEFORE UPDATE ON public.coach_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_reserved_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _annonce uuid := COALESCE(NEW.annonce_id, OLD.annonce_id);
  _count integer;
  _cap integer;
BEGIN
  SELECT count(*) INTO _count FROM public.coach_reservations
    WHERE annonce_id = _annonce AND status = 'acceptee';

  UPDATE public.coach_annonces
     SET reserved_count = _count,
         status = CASE
           WHEN capacity IS NOT NULL AND _count >= capacity AND status = 'active' THEN 'complete'::public.coach_listing_status
           WHEN capacity IS NOT NULL AND _count < capacity AND status = 'complete' THEN 'active'::public.coach_listing_status
           ELSE status END
   WHERE id = _annonce
   RETURNING capacity INTO _cap;

  RETURN NULL;
END;
$$;

CREATE TRIGGER coach_reservations_count
  AFTER INSERT OR UPDATE OR DELETE ON public.coach_reservations
  FOR EACH ROW EXECUTE FUNCTION public.sync_reserved_count();

ALTER TABLE public.coach_annonces
  ADD CONSTRAINT coach_annonces_capacity_positive CHECK (capacity IS NULL OR capacity > 0);