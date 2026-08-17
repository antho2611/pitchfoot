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

## État actuel (phase 1)

- Connexion / inscription par email + mot de passe (même compte que sur le site)
- Barre d'onglets native (Joueurs / Annonces / Clubs / Séances / Menu)
- Onglet **Joueurs** : liste réelle, chargée depuis Supabase
- Les autres onglets affichent "Bientôt disponible" — à construire écran par écran

## Pas encore fait

- Connexion Google / Apple (nécessite une configuration d'URL de redirection
  supplémentaire — prochaine étape une fois la base validée)
- Annonces, Clubs, Séances, Menu complet, profil, messagerie
