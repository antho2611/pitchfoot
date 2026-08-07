CREATE TABLE public.ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cover_url text,
  category text NOT NULL DEFAULT 'Préparation physique',
  content_url text,
  preview_text text,
  price_cents integer NOT NULL DEFAULT 1000,
  is_free boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ebooks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebooks TO authenticated;
GRANT ALL ON public.ebooks TO service_role;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ebooks publiés visibles par tous" ON public.ebooks
  FOR SELECT USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins gèrent les ebooks" ON public.ebooks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ebooks_updated_at BEFORE UPDATE ON public.ebooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ebook_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid NOT NULL REFERENCES public.ebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid',
  provider text,
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ebook_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ebook_purchases TO authenticated;
GRANT ALL ON public.ebook_purchases TO service_role;
ALTER TABLE public.ebook_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chacun voit sa bibliothèque" ON public.ebook_purchases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Chacun ajoute à sa bibliothèque" ON public.ebook_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins gèrent les accès" ON public.ebook_purchases
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ebook_purchases_updated_at BEFORE UPDATE ON public.ebook_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_attended_coach(_user_id uuid, _coach_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_reservations r
    WHERE r.player_id = _user_id AND r.coach_id = _coach_id AND r.status = 'acceptee'
  )
$$;

CREATE TABLE public.coach_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.preparateurs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, author_id)
);

GRANT SELECT ON public.coach_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_reviews TO authenticated;
GRANT ALL ON public.coach_reviews TO service_role;
ALTER TABLE public.coach_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avis visibles par tous" ON public.coach_reviews FOR SELECT USING (true);
CREATE POLICY "Participants peuvent déposer un avis" ON public.coach_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.has_attended_coach(auth.uid(), coach_id));
CREATE POLICY "Auteur modifie son avis" ON public.coach_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Auteur supprime son avis" ON public.coach_reviews
  FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_coach_reviews_coach ON public.coach_reviews(coach_id);
CREATE TRIGGER update_coach_reviews_updated_at BEFORE UPDATE ON public.coach_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ebooks (title, slug, summary, description, category, price_cents, is_free, preview_text) VALUES
('Reprise athlétique : 4 semaines pour repartir', 'reprise-athletique-4-semaines', 'Le protocole complet de reprise après une coupure, séance par séance.', E'Un programme progressif de 4 semaines pour retrouver son niveau athlétique après une coupure estivale ou une longue inactivité.\n\nAu sommaire : évaluation de départ, montée en charge, travail aérobie, réathlétisation musculaire, prévention des blessures et planification hebdomadaire prête à l''emploi.', 'Préparation physique', 1000, false, 'Semaine 1 — Réhabituer le corps : 3 séances de 45 minutes, intensité 60-70 %, priorité au gainage et à la mobilité.'),
('Prévention des blessures du footballeur', 'prevention-blessures-footballeur', 'Ischios, adducteurs, chevilles : les routines qui limitent les pépins.', E'Les blessures les plus fréquentes en football amateur et les protocoles de prévention validés sur le terrain.\n\nRoutines Nordic hamstring, travail excentrique, proprioception, gestion de la charge et échauffement type avant match.', 'Préparation physique', 1000, false, 'La règle des 10 % : n''augmentez jamais votre charge hebdomadaire de plus de 10 % par rapport à la semaine précédente.'),
('Préparation mentale : jouer sans pression', 'preparation-mentale-jouer-sans-pression', 'Routines de concentration, gestion du stress d''avant-match et confiance.', E'Un guide pratique de préparation mentale pour les joueurs amateurs et semi-pros.\n\nAu programme : routine d''avant-match, respiration tactique, imagerie mentale, discours interne, rebond après une contre-performance.', 'Préparation mentale', 1000, false, 'La respiration 4-6 : inspirez 4 secondes, expirez 6 secondes, cinq fois avant d''entrer sur le terrain.'),
('Le guide du gardien moderne', 'guide-gardien-moderne', 'Jeu au pied, placement, sorties aériennes et lecture du jeu.', E'Tout ce qu''un gardien amateur doit maîtriser aujourd''hui : relance sous pression, positionnement selon la ligne défensive, duels en face à face et arrêts réflexes.\n\nInclut 20 exercices à réaliser en séance individuelle ou collective.', 'Technique par poste', 1000, false, 'Le placement en arc de cercle réduit l''angle de tir de 30 % sans avancer davantage.'),
('Latéral moderne : monter et défendre', 'lateral-moderne', 'Le poste le plus exigeant physiquement, décrypté et travaillé.', E'Profil athlétique, timing des montées, couverture défensive, centres et relations avec l''ailier : le manuel du latéral complet.\n\nAvec un plan de charge spécifique au poste sur une semaine type.', 'Technique par poste', 1000, false, 'Un latéral parcourt en moyenne 10,8 km par match, dont 25 % en course à haute intensité.'),
('Bien démarrer sa recherche de club', 'bien-demarrer-recherche-club', 'Le guide offert : CV, vidéo, contacts et essais réussis.', E'Le guide gratuit PitchPro pour structurer votre recherche de club : construire un profil crédible, monter une vidéo efficace, contacter les bons interlocuteurs et réussir vos essais.\n\nOffert à tous les membres inscrits.', 'Carrière', 0, true, 'Une vidéo de 90 secondes bien montée obtient plus de réponses qu''un montage de 10 minutes.');