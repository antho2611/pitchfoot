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
- Barre d'onglets native (Joueurs / Annonces / Clubs / Séances / Menu)
- Écrans avec vraies données Supabase : **Joueurs, Annonces, Clubs, Séances,
  Préparateurs** (dans Menu)
- Menu : liens vers Ebooks, Premium, Tableau de bord, Messagerie,
  Notifications — pour l'instant en "Bientôt disponible", Déconnexion
  fonctionnelle

## Pas encore fait

- Contenu réel des écrans Ebooks / Premium / Tableau de bord / Messagerie /
  Notifications
- Édition de profil (joueur / club / préparateur), statistiques, parcours club
- Détail d'un joueur/club/annonce en tapant sur une ligne de liste

## Si le build échoue

Je ne peux pas compiler Swift de mon côté (pas d'Xcode ici) — si Xcode signale
une erreur, copie-colle le message exact (fichier + ligne + texte de
l'erreur), je corrige à l'aveugle sur cette base.
