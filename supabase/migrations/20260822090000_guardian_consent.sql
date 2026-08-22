-- RGPD (art. 8 / considérant 38) : les CGU autorisent l'inscription de mineurs
-- "sous la responsabilité d'un représentant légal" mais rien ne capturait cet
-- accord jusqu'ici. On stocke la confirmation donnée par l'utilisateur lors de
-- l'enregistrement de son profil, quand sa date de naissance indique qu'il est
-- mineur.
alter table public.players
  add column guardian_consent boolean not null default false;

comment on column public.players.guardian_consent is
  'Confirmation (déclarative) qu''un représentant légal a autorisé la création du profil, requise quand birth_date indique un utilisateur mineur.';
