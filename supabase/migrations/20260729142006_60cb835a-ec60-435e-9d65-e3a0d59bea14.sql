CREATE TYPE public.coach_session_type AS ENUM ('collective','individuelle');
CREATE TYPE public.coach_listing_status AS ENUM ('active','complete','expiree');

CREATE TABLE public.preparateurs (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  headline text,
  bio text,
  qualifications text,
  specialties text[] NOT NULL DEFAULT '{}',
  price_info text,
  photo_url text,
  city text,
  country text DEFAULT 'France',
  latitude double precision,
  longitude double precision,
  radius_km integer NOT NULL DEFAULT 30,
  contact_email text,
  phone text,
  website text,
  is_premium boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.preparateurs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preparateurs TO authenticated;
GRANT ALL ON public.preparateurs TO service_role;
ALTER TABLE public.preparateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY preparateurs_public_read ON public.preparateurs FOR SELECT USING (true);
CREATE POLICY preparateurs_insert_own ON public.preparateurs FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY preparateurs_update_own ON public.preparateurs FOR UPDATE TO authenticated USING ((auth.uid() = id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY preparateurs_delete_own ON public.preparateurs FOR DELETE TO authenticated USING ((auth.uid() = id) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_preparateurs_updated_at BEFORE UPDATE ON public.preparateurs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.coach_annonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.preparateurs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_type public.coach_session_type NOT NULL DEFAULT 'collective',
  session_date date NOT NULL,
  start_time time,
  end_time time,
  city text,
  location text,
  latitude double precision,
  longitude double precision,
  price_info text,
  capacity integer,
  status public.coach_listing_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX coach_annonces_coach_idx ON public.coach_annonces(coach_id);
CREATE INDEX coach_annonces_date_idx ON public.coach_annonces(session_date);

GRANT SELECT ON public.coach_annonces TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_annonces TO authenticated;
GRANT ALL ON public.coach_annonces TO service_role;
ALTER TABLE public.coach_annonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_annonces_public_read ON public.coach_annonces FOR SELECT USING (true);
CREATE POLICY coach_annonces_write_own ON public.coach_annonces FOR ALL TO authenticated
  USING ((coach_id = auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK ((coach_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_coach_annonces_updated_at BEFORE UPDATE ON public.coach_annonces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _type public.app_role;
BEGIN
  _type := COALESCE(NULLIF(NEW.raw_user_meta_data->>'account_type',''), 'player')::public.app_role;

  INSERT INTO public.profiles (id, display_name, account_type)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), _type)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _type)
  ON CONFLICT DO NOTHING;

  IF _type = 'player' THEN
    INSERT INTO public.players (id, first_name, last_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name',''), COALESCE(NEW.raw_user_meta_data->>'last_name',''))
    ON CONFLICT (id) DO NOTHING;
  ELSIF _type = 'club' THEN
    INSERT INTO public.clubs (id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name',''))
    ON CONFLICT (id) DO NOTHING;
  ELSIF _type = 'coach' THEN
    INSERT INTO public.preparateurs (id, full_name, contact_email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name',''), NEW.email)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_premium_flag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _active boolean;
BEGIN
  _active := NEW.status IN ('active','trialing')
    AND (NEW.current_period_end IS NULL OR NEW.current_period_end > now());

  IF NEW.plan = 'player_premium' THEN
    UPDATE public.players SET is_premium = _active WHERE id = NEW.user_id;
  ELSIF NEW.plan = 'coach_premium' THEN
    UPDATE public.preparateurs SET is_premium = _active WHERE id = NEW.user_id;
  ELSE
    UPDATE public.clubs SET is_premium = _active WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$;