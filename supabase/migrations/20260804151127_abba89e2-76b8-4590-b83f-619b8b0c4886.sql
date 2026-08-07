CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.has_attended_coach(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.is_conversation_member(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.is_premium(uuid) SET SCHEMA private;
ALTER FUNCTION public.can_notify(uuid) SET SCHEMA private;