# PitchPro — app native iOS (SwiftUI)

App native SwiftUI, séparée du site web, connectée au **même projet Supabase**
(mêmes comptes, mêmes données). Le site web (`pitchfoot.onrender.com`) et cette
app se partagent le même backend — c'est ce qui les fait "communiquer".

## Installation (une seule fois)

```
brew install xcodegen
```

## Ouvrir le projet dans Xcode

À chaque fois que ces fichiers changent (nouveau fichier Swift, `project.yml`
modifié) :

```
cd native-ios
xcodegen generate
open PitchPro.xcodeproj
```

Au premier lancement, Xcode télécharge automatiquement la dépendance Supabase
(barre de progression en haut de la fenêtre) — attends que ça termine avant de
lancer l'app (▶️).

## Étape Supabase à faire une fois (pour Google/Apple)

Dashboard Supabase → **Authentication → URL Configuration → Redirect URLs** →
ajoute :
```
pitchpro://login-callback
```
Sans ça, la connexion Google/Apple s'ouvre mais ne revient jamais dans l'app.

## État actuel

- Connexion / inscription par email + mot de passe, **et** Google / Apple
  (même écran de connexion que le site, revient dans l'app ensuite)
- **Design aligné sur le site** : police Bebas Neue (même fichier que le web,
  policy OFL, voir `PitchPro/Resources/Fonts`), vert pitch / vert volt,
  cartes à coins nets bordées — seule la barre d'onglets tout en bas garde le
  style natif iOS (Liquid Glass), comme demandé
- Barre d'onglets native (Joueurs / Annonces / Clubs / Séances / Menu),
  universelle iPhone + iPad
- Écrans avec vraies données Supabase, tous cliquables jusqu'à la fiche
  détaillée : **Joueurs** (grille façon site), **Annonces** (+ Postuler),
  **Clubs** (+ ses annonces), **Séances** (+ S'inscrire), **Préparateurs**
  (+ leurs séances), **Ebooks** (+ débloquer/télécharger)
- **Abonnements façon Insta** : bouton Suivre/Abonné + compteur
  abonnés/abonnements sur les fiches joueur et préparateur
  (`FollowButton.swift`, table `public.follows`, partagée avec le site)
- **Messagerie réelle** : bouton Contacter sur les fiches joueur/préparateur,
  liste de conversations avec avatar + dernier message, fil de discussion
  avec bulles. Démarrer une conversation nécessite de suivre l'autre compte
  (ou d'avoir déjà une relation candidature/réservation) — la règle est
  appliquée côté base (`can_message()`), donc identique sur le site et
  l'app. Pas de canal realtime côté natif : le fil se rafraîchit tout seul
  toutes les 4s pendant qu'il est ouvert
- **Notifications** : cloche avec badge non-lus en haut à droite de tous les
  écrans de liste (Joueurs, Annonces, Clubs, Séances, Préparateurs, Ebooks),
  + écran dédié depuis le Menu. Tap = marque comme lu, et pour les
  notifications de message, ouvre directement le fil de discussion
  correspondant (comme sur le site)
- **Tableau de bord** : un contenu différent par type de compte, comme sur le
  site — joueur (vues, candidatures, complétion du profil), club (annonces,
  candidatures reçues avec Accepter/Refuser/Message/Profil, short-list),
  préparateur (séances publiées/actives, dernières séances), admin (lien vers
  la console web)
- **Premium** : les 3 plans avec leurs tarifs, "Choisir ce plan" enregistre
  une demande en attente (pas de paiement en ligne, comme sur le site —
  activation manuelle par un admin)
- **Mot de passe oublié** : depuis l'écran de connexion, envoie le lien de
  réinitialisation vers la page web `/reset-password` (pas d'écran natif
  dédié — on réutilise le site, même projet Supabase)
- Menu entièrement fonctionnel (plus aucun "Bientôt disponible") ;
  déconnexion fonctionnelle

## Pas encore fait

- Édition de profil (joueur / club / préparateur), statistiques, parcours club
- Créer une nouvelle annonce depuis l'app (le club voit ses annonces
  existantes dans son tableau de bord, mais la création reste web-only)
- Notifications push (les notifications existent en base et s'affichent dans
  l'écran dédié, mais rien ne déclenche encore de notification push iOS)

## Point d'attention pour la prochaine build

`SubscriptionRepository.swift` utilise `.maybeSingle()` et `.upsert(...)` —
deux méthodes du SDK Supabase jamais utilisées ailleurs dans cette app
jusqu'ici (tout le reste utilise `.single()` et `.insert()`/`.update()`
simples, déjà éprouvés). Si une erreur de compilation apparaît sur ce
fichier précisément, c'est le premier endroit à regarder.

## Si le build échoue

Je ne peux pas compiler Swift de mon côté (pas d'Xcode ici) — si Xcode signale
une erreur, copie-colle le message exact (fichier + ligne + texte de
l'erreur), je corrige à l'aveugle sur cette base.
