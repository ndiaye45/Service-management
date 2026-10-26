# Service Management — Frontend Angular

Interface web de l'application **Service Management** (mise en relation entre demandeurs et prestataires).
Application Angular 21 indépendante, qui consomme l'API Spring Boot existante **sans la modifier**.

- Angular (composants standalone, signaux, formulaires réactifs), TypeScript, Tailwind CSS 4
- Polices auto-hébergées via `@fontsource-variable` (Bricolage Grotesque pour les titres, Figtree pour le texte) : aucun appel à Google Fonts
- `HttpClient` avec intercepteurs (JWT + gestion des erreurs), guards de routes, chargement paresseux des pages

## Direction visuelle

- Palette : indigo `#1A1740`, violet `#5B3DF5`, jaune `#FFC83D`, corail `#FF6B57`, fond lilas clair. Les tokens sont dans `src/styles.css`.
- **Illustrations génératives** : les offres n'ont pas d'image, chacune reçoit une illustration géométrique calculée à partir de son titre
  (composition) et de sa catégorie (palette). Même offre, même visuel, partout (`core/utils/cover-art.ts`, `shared/cover.component.ts`).
- Accueil : grand bandeau avec recherche, filtres par catégorie et cartes empilées des derniers services publiés.
- Formulaire d'offre : aperçu en direct de la carte pendant la saisie.
- Demandes : suivi visuel de la progression (envoyée, acceptée, terminée, confirmée, notée).
- Les animations respectent `prefers-reduced-motion`.

## Prérequis

- Node.js 20.19+ ou 22.12+ (et npm)
- Le backend Spring Boot démarré sur `http://localhost:8080` (avec sa base PostgreSQL et la variable `JWT_SECRET`)

## Installation et lancement

```bash
npm install
npm start          # http://localhost:4200
```

Le serveur de développement relaie `/api/*` vers Spring Boot (`proxy.conf.js`). Le backend n'a aucune
configuration CORS : le proxy évite d'avoir à la modifier. Pour viser un autre hôte ou port :

```bash
API_TARGET=http://localhost:9090 npm start
```

Autres commandes : `npm run build` (build de production dans `dist/`).

## Configuration de l'URL de l'API

L'URL de base est centralisée dans `src/environments/` (`apiBaseUrl`, `/api` par défaut) et n'apparaît nulle part ailleurs.

**Production** : servez le frontend et l'API sous la même origine (reverse proxy qui relaie `/api` vers Spring Boot).
Si l'API est sur un autre domaine, mettez son URL absolue dans `environment.production.ts` ; le backend devra alors
autoriser CORS, ce qui est une décision de votre côté (aucune modification n'a été faite).

## Correspondance fonctionnalités ↔ endpoints

| Fonctionnalité | Écran | Endpoint |
| --- | --- | --- |
| Créer un compte | `/register` | `POST /api/auth/register` puis connexion automatique |
| Se connecter | `/login` | `POST /api/auth/login` → `{ token, tokenType, user }` |
| Consulter les services | `/services` | `GET /api/services` |
| Détail d'un service | `/services/:id` | `GET /api/services/{id}` |
| Créer une offre | `/services/new` | `POST /api/services` |
| Modifier une offre | `/services/:id/edit` | `PUT /api/services/{id}` |
| Supprimer une offre | détail, `/my-services` | `DELETE /api/services/{id}` |
| Envoyer une demande | `/services/:id` | `POST /api/services/{serviceId}/requests` |
| Mes demandes (demandeur) | `/requests` | `GET /api/users/{userId}/requests` |
| Demandes reçues (prestataire) | `/received` | `GET /api/providers/{providerId}/requests` |
| Accepter / refuser / terminer | `/received` | `PATCH /api/requests/{id}/status` |
| Confirmer la prestation | `/requests` | `PATCH /api/requests/{id}/confirm` |
| Laisser un avis | `/requests` | `POST /api/requests/{requestId}/reviews` |
| Avis d'un prestataire | `/providers/:id/reviews` | `GET /api/providers/{providerId}/reviews` |

## Comportements liés au backend actuel

- **Tout est protégé** sauf `/api/auth/**` : y compris la liste des services. Les écrans exigent donc une connexion.
- **Pas de rôle dans le JWT** : un même compte est à la fois demandeur et prestataire. Le jeton contient `sub` (email), `userId` et `exp`.
- **Messages d'erreur** : le backend lève des `ResponseStatusException`, mais avec la configuration Spring Boot par défaut le
  message n'est pas inclus dans le corps JSON (seulement `status`, `error`, `path`). Le frontend affiche donc des messages
  adaptés au contexte selon le code HTTP (400, 403, 404, 409…). Si vous activez `server.error.include-message`, ils seront utilisés automatiquement.
- **Pas d'endpoint « mes offres », « catégories » ou « avis d'une demande »** : le frontend filtre `GET /api/services` sur
  `providerId`, déduit les catégories des offres existantes, et retrouve l'avis d'une demande en croisant `requestId` avec
  `GET /api/providers/{id}/reviews`.
- **Les avis n'exposent pas leur auteur** ni le service concerné (voir `ServiceReviewResponse`) : ils sont affichés anonymement.
- **Nom d'un prestataire** : il est retrouvé via ses offres (`GET /api/users/{id}` n'est autorisé que pour son propre profil).
- **Suppression d'une offre** : refusée par le backend (409) si elle a déjà reçu des demandes ; le bouton est alors désactivé.
- **Devise** : l'API ne fournit pas de devise, les prix sont affichés en euros.
- **Session** : le JWT est conservé dans `localStorage` (jamais le mot de passe) ; il est retiré à son expiration ou sur toute réponse 401.

## Structure

```
src/app/
  core/        modèles (DTO), services API, authentification, intercepteurs, guards, utilitaires
  shared/      composants réutilisables (navbar, badges de statut, étoiles, toasts, confirmation, états vides)
  features/    auth, services, requests, reviews (une page par écran)
```
