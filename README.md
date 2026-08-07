# Footy Connect

Crée une application web moderne et responsive dédiée au recrutement dans le football amateur et semi-professionnel.

L’objectif est de connecter les joueurs et les clubs grâce à une plateforme simple, rapide et intuitive où les joueurs créent leur profil sportif et les clubs peuvent rechercher les meilleurs profils selon leurs besoins.

L’application doit être pensée comme un “LinkedIn du football amateur”, avec une expérience utilisateur premium, fluide et adaptée au mobile.

Utilisateurs

Il existe trois types d’utilisateurs :

1. Joueurs

Ils peuvent :

créer un compte

compléter leur profil sportif

déposer leur CV football

ajouter leurs statistiques

importer des vidéos (YouTube, Vimeo ou upload)

ajouter des photos

renseigner leur historique de clubs

indiquer leur disponibilité

recevoir des demandes de contact

postuler à des annonces de clubs

suivre les vues de leur profil

gérer leurs paramètres

2. Clubs

Ils peuvent :

créer un compte vérifié

créer une fiche club

publier des annonces de recrutement

rechercher des joueurs

filtrer les profils

sauvegarder des joueurs

contacter directement les joueurs

inviter un joueur à un essai

gérer leurs recrutements

3. Administrateur

Dispose d’un tableau de bord permettant de :

gérer les utilisateurs

vérifier les clubs

modérer les contenus

supprimer les faux profils

consulter les statistiques de la plateforme

gérer les abonnements

gérer les signalements

Profil joueur

Le profil doit être très complet.

Informations personnelles

prénom

nom

âge

date de naissance

nationalité

taille

poids

pied fort

position principale

positions secondaires

ville

pays

Niveau sportif

club actuel

ancien(s) club(s)

championnat

niveau

expérience

agent (optionnel)

Statistiques

Pouvoir saisir selon le poste :

Exemples :

Gardien :

matchs

clean sheets

arrêts

Défenseur :

interceptions

duels gagnés

tacles

Milieu :

passes décisives

précision des passes

récupérations

Attaquant :

buts

assists

tirs cadrés

minutes jouées

Les statistiques doivent être facilement modifiables.

CV Football

Possibilité d’importer :

PDF

ou

Créer un CV directement depuis la plateforme.

Vidéos

Pouvoir :

importer une vidéo

intégrer YouTube

intégrer Vimeo

créer une playlist de highlights

Galerie

Ajouter :

photos

vidéos

trophées

distinctions

Disponibilité

Choix :

Recherche un club

Disponible immédiatement

Disponible en fin de saison

Recherche un essai

Ouvert aux propositions

Recherche de joueurs

Les clubs disposent d’un moteur de recherche puissant.

Filtres :

âge

poste

taille

pied fort

pays

ville

distance

niveau

championnat

disponibilité

expérience

statistiques

nationalité

vidéos disponibles

CV disponible

La recherche doit être très rapide.

Profil Club

Chaque club possède :

logo

photos

description

stade

championnat

ville

pays

coordonnées

réseaux sociaux

historique

recruteurs

Offres de recrutement

Les clubs peuvent publier des annonces.

Exemple :

Recherche :

Défenseur central

Niveau :

Régional 1

Conditions :

disponible immédiatement

Objectifs :

saison 2026

Les joueurs peuvent postuler en un clic.

Messagerie

Créer une messagerie privée moderne.

Fonctionnalités :

discussion en temps réel

envoi de documents

partage de vidéos

notifications

accusés de lecture

Notifications

Le joueur reçoit une notification lorsqu’un :

club consulte son profil

club sauvegarde son profil

club lui envoie un message

club l’invite à un essai

candidature est acceptée

Le club reçoit une notification lorsqu’un :

joueur postule

joueur répond

nouveau profil correspond à ses critères

Tableau de bord Joueur

Afficher :

nombre de vues

clubs intéressés

candidatures envoyées

messages

statistiques du profil

taux de complétion

Tableau de bord Club

Afficher :

annonces publiées

candidatures reçues

joueurs favoris

statistiques de recrutement

nouveaux profils recommandés

Matching intelligent

Créer un système de recommandations basé sur :

poste

niveau

localisation

disponibilité

statistiques

historique

besoins des clubs

Le système recommande automatiquement :

des joueurs aux clubs

des clubs aux joueurs

Interface utilisateur

Style :

moderne

premium

minimaliste

inspiré de LinkedIn, Transfermarkt, Hudl et Dribbble

Palette :

blanc

bleu foncé

vert

gris clair

Animations :

fluides

élégantes

discrètes

Mode sombre disponible.

Responsive

Application parfaitement adaptée :

mobile

tablette

ordinateur

Mobile First.

Technologies

Construire le projet avec :

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Supabase (authentification, base de données, stockage)

PostgreSQL

Realtime

React Query

React Hook Form

Zod

Framer Motion

Architecture propre, modulaire et évolutive.

Fonctionnalités Premium (abonnement)

Joueurs Premium

profil mis en avant

statistiques avancées

badge Premium

visibilité accrue

candidatures illimitées

historique des vues détaillé

Clubs Premium

recherches illimitées

filtres avancés

recommandations IA

export des profils

accès prioritaire aux meilleurs talents

tableau de bord analytique

IA intégrée

Utiliser l’intelligence artificielle pour :

analyser automatiquement les CV

extraire les compétences

suggérer les clubs adaptés

recommander des joueurs aux recruteurs

générer automatiquement un résumé du profil

calculer un score de compatibilité entre un joueur et un club

Sécurité

Mettre en place :

authentification sécurisée

rôles et permissions

vérification des clubs

protection des données personnelles

conformité RGPD

stockage sécurisé des fichiers

Objectif final

Créer une plateforme professionnelle, rapide, intuitive et évolutive, capable de devenir la référence du recrutement dans le football amateur.

L’expérience utilisateur doit être exceptionnelle, avec un design premium, des performances élevées, une navigation fluide et une architecture facilement extensible vers une application mobile iOS et Android (React Native ou Expo) sans refonte majeure.

## Stack

- React 19 + TypeScript, [TanStack Start](https://tanstack.com/start) (SSR) + [TanStack Router](https://tanstack.com/router)
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- [Supabase](https://supabase.com) — Postgres, authentication, storage, realtime
- Deployed as a Node server (Nitro `node-server` preset)

## Development

You need Node.js 20+.

```sh
git clone https://github.com/antho2611/pitchprofoot
cd pitchprofoot
npm i
npm run dev
```

The app expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env`) to connect to Supabase. Server-only operations that need elevated access additionally require `SUPABASE_SERVICE_ROLE_KEY` set as an environment variable (never commit this one).

## Build

```sh
npm run build   # outputs a standalone Node server to .output/server/index.mjs
node .output/server/index.mjs
```
