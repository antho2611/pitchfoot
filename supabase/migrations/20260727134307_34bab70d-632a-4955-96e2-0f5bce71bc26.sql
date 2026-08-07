CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

CREATE TYPE public.subscription_plan AS ENUM ('player_premium','club_premium');
CREATE TYPE public.subscription_status AS ENUM ('active','trialing','canceled','expired','pending');

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  current_period_end timestamptz,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  provider text,
  provider_subscription_id text,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subs_read ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY subs_insert ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY subs_update ON public.subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY subs_delete ON public.subscriptions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.search_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period date NOT NULL DEFAULT date_trunc('month', now())::date,
  search_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);

GRANT SELECT, INSERT, UPDATE ON public.search_usage TO authenticated;
GRANT ALL ON public.search_usage TO service_role;
ALTER TABLE public.search_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_read ON public.search_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY usage_insert ON public.search_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY usage_update ON public.search_usage FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_search_usage_updated_at
BEFORE UPDATE ON public.search_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.status IN ('active','trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.register_search()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _count integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.search_usage (user_id, period, search_count)
  VALUES (_uid, date_trunc('month', now())::date, 1)
  ON CONFLICT (user_id, period)
  DO UPDATE SET search_count = public.search_usage.search_count + 1, updated_at = now()
  RETURNING search_count INTO _count;

  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_premium_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _active boolean;
BEGIN
  _active := NEW.status IN ('active','trialing')
    AND (NEW.current_period_end IS NULL OR NEW.current_period_end > now());

  IF NEW.plan = 'player_premium' THEN
    UPDATE public.players SET is_premium = _active WHERE id = NEW.user_id;
  ELSE
    UPDATE public.clubs SET is_premium = _active WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_sync_premium
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_premium_flag();