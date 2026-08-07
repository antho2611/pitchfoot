-- 1. Contact details: hide phone / contact_email from anonymous visitors
REVOKE SELECT ON public.clubs FROM anon;
GRANT SELECT (id, name, logo_url, description, stadium, championship, level, city, country, website, social_links, history, is_verified, is_premium, created_at) ON public.clubs TO anon;

REVOKE SELECT ON public.preparateurs FROM anon;
GRANT SELECT (id, full_name, headline, bio, qualifications, specialties, price_info, photo_url, city, country, latitude, longitude, radius_km, website, is_premium, is_verified, views_count, created_at, updated_at) ON public.preparateurs TO anon;

-- 2. Storage: media files readable only by their owner
DROP POLICY IF EXISTS "media_read_auth" ON storage.objects;
CREATE POLICY "media_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Notifications: only self or a real counterparty
CREATE OR REPLACE FUNCTION public.can_notify(_target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _target = auth.uid()
     OR EXISTS (
       SELECT 1 FROM public.conversations c
       WHERE (c.participant_a = auth.uid() AND c.participant_b = _target)
          OR (c.participant_b = auth.uid() AND c.participant_a = _target)
     )
     OR EXISTS (
       SELECT 1 FROM public.applications a
       WHERE (a.player_id = auth.uid() AND a.club_id = _target)
          OR (a.club_id = auth.uid() AND a.player_id = _target)
     )
     OR EXISTS (
       SELECT 1 FROM public.coach_reservations r
       WHERE (r.player_id = auth.uid() AND r.coach_id = _target)
          OR (r.coach_id = auth.uid() AND r.player_id = _target)
     )
$$;

DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
CREATE POLICY "notif_insert_related" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.can_notify(user_id));

-- 4. SECURITY DEFINER functions: no public/anon execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_reserved_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_premium_flag() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.has_attended_coach(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_attended_coach(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_premium(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_premium(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.register_search() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_search() TO authenticated;

REVOKE ALL ON FUNCTION public.can_notify(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_notify(uuid) TO authenticated;