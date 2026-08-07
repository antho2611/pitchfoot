-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','player','club');
CREATE TYPE public.availability_status AS ENUM ('recherche_club','immediate','fin_saison','essai','ouvert');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  account_type public.app_role NOT NULL DEFAULT 'player',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- PLAYERS
CREATE TABLE public.players (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  birth_date date,
  nationality text,
  height_cm int,
  weight_kg int,
  strong_foot text,
  main_position text,
  secondary_positions text[] NOT NULL DEFAULT '{}',
  city text,
  country text,
  current_club text,
  previous_clubs text,
  championship text,
  level text,
  experience_years int NOT NULL DEFAULT 0,
  agent text,
  bio text,
  photo_url text,
  cv_url text,
  video_urls text[] NOT NULL DEFAULT '{}',
  gallery_urls text[] NOT NULL DEFAULT '{}',
  trophies text,
  availability public.availability_status NOT NULL DEFAULT 'ouvert',
  is_premium boolean NOT NULL DEFAULT false,
  views_count int NOT NULL DEFAULT 0,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_public_read" ON public.players FOR SELECT USING (true);
CREATE POLICY "players_write_own" ON public.players FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "players_update_own" ON public.players FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "players_delete_own" ON public.players FOR DELETE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

-- PLAYER STATS
CREATE TABLE public.player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season text NOT NULL DEFAULT '2025/2026',
  matches int NOT NULL DEFAULT 0,
  minutes int NOT NULL DEFAULT 0,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  shots_on_target int NOT NULL DEFAULT 0,
  clean_sheets int NOT NULL DEFAULT 0,
  saves int NOT NULL DEFAULT 0,
  interceptions int NOT NULL DEFAULT 0,
  tackles int NOT NULL DEFAULT 0,
  duels_won int NOT NULL DEFAULT 0,
  pass_accuracy int NOT NULL DEFAULT 0,
  recoveries int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_stats TO authenticated;
GRANT ALL ON public.player_stats TO service_role;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats_public_read" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "stats_write_own" ON public.player_stats FOR ALL TO authenticated
  USING (player_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (player_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- CLUBS
CREATE TABLE public.clubs (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  logo_url text,
  description text,
  stadium text,
  championship text,
  level text,
  city text,
  country text,
  website text,
  contact_email text,
  phone text,
  social_links text,
  history text,
  is_verified boolean NOT NULL DEFAULT false,
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clubs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clubs_public_read" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "clubs_insert_own" ON public.clubs FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "clubs_update_own" ON public.clubs FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "clubs_delete_own" ON public.clubs FOR DELETE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

-- LISTINGS
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  position text,
  level text,
  championship text,
  city text,
  availability_required public.availability_status,
  min_age int,
  max_age int,
  description text,
  season text,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_public_read" ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_write_own" ON public.listings FOR ALL TO authenticated
  USING (club_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (club_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- APPLICATIONS
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, player_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_read" ON public.applications FOR SELECT TO authenticated
  USING (player_id = auth.uid() OR club_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "applications_insert_player" ON public.applications FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());
CREATE POLICY "applications_update" ON public.applications FOR UPDATE TO authenticated
  USING (club_id = auth.uid() OR player_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "applications_delete" ON public.applications FOR DELETE TO authenticated
  USING (player_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- SAVED PLAYERS
CREATE TABLE public.saved_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, player_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_players TO authenticated;
GRANT ALL ON public.saved_players TO service_role;
ALTER TABLE public.saved_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_read" ON public.saved_players FOR SELECT TO authenticated
  USING (club_id = auth.uid() OR player_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "saved_write_club" ON public.saved_players FOR ALL TO authenticated
  USING (club_id = auth.uid()) WITH CHECK (club_id = auth.uid());

-- PROFILE VIEWS
CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views_read_own" ON public.profile_views FOR SELECT TO authenticated
  USING (player_id = auth.uid() OR viewer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "views_insert" ON public.profile_views FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

-- CONVERSATIONS + MESSAGES
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_a, participant_b)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_read" ON public.conversations FOR SELECT TO authenticated
  USING (participant_a = auth.uid() OR participant_b = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());
CREATE POLICY "conv_update" ON public.conversations FOR UPDATE TO authenticated
  USING (participant_a = auth.uid() OR participant_b = auth.uid());

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id AND (c.participant_a = _user_id OR c.participant_b = _user_id)
  )
$$;

CREATE POLICY "messages_read" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_read_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_delete_own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- REPORTS
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_read" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- INDEXES
CREATE INDEX idx_players_position ON public.players(main_position);
CREATE INDEX idx_players_availability ON public.players(availability);
CREATE INDEX idx_listings_club ON public.listings(club_id);
CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);