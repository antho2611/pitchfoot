ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

GRANT SELECT (latitude, longitude) ON public.clubs TO anon;
GRANT SELECT (latitude, longitude) ON public.clubs TO authenticated;

CREATE INDEX IF NOT EXISTS clubs_lat_lon_idx ON public.clubs (latitude, longitude);