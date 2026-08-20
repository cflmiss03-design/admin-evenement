# frontend-votes-admin

Espace admin unifié (rôles **ADMIN** et **PROMOTEUR**) pour tous les
événements de vote gérés par `server-votes` (Miss Culture Bénin, Campus
Voice...). Application indépendante — pas de rendu public, jamais indexée
(`robots: noindex`).

## Développement local

```bash
npm install
npm run dev        # http://localhost:5173
```

`.env` doit pointer vers le backend (`VITE_API_BASE_URL`, par défaut
`http://localhost:5000/api`).

## Build & déploiement

```bash
npm run build       # génère dist/
```

**Avant le premier déploiement en production**, changer `VITE_API_BASE_URL`
dans `.env` pour pointer vers l'URL Railway du backend, puis rebuild.

### Cloudflare Pages

- **Build command** : `npm run build`
- **Build output directory** : `dist`
- **Root directory** : `/`
- Variable d'environnement à définir : `VITE_API_BASE_URL` (URL Railway du backend + `/api`)
- Node.js épinglé via `.node-version` (22), rien à configurer en plus.
- Le SPA fallback (`public/_redirects` → `/* /index.html 200`) est déjà en
  place et compatible Cloudflare Pages nativement (même syntaxe que Netlify).

### Netlify (déploiement existant)

Ce dépôt reste aussi déployé sur Netlify via `git push` (voir `netlify.toml`)
— les deux hébergements peuvent coexister tant que les deux remotes sont
poussés.

## Backend — prérequis (server-votes)

- `PANEL_JWT_SECRET` doit être défini dans les variables d'environnement
  Railway (secret dédié à ce nouvel espace admin, différent de `JWT_SECRET`
  et `MANAGER_SECRET`). Sans lui, toute authentification échoue avec une
  erreur 500.
- Le domaine où `frontend-votes-admin` sera réellement hébergé doit être
  ajouté à `ALLOWED_ORIGINS` dans `server-votes/voteserver.js` (comme pour
  les autres frontends), sinon le navigateur bloquera les appels API (CORS).
- `MANAGER_SECRET` reste utilisé par les anciennes pages `/manager` de
  `frontend-votes` et `frontend-votes-campusvoice`, gardées en secours pour
  l'instant — aucune action requise ici.

## Rôles

| | ADMIN | PROMOTEUR |
|---|---|---|
| Événements visibles | Tous (sélecteur) | Un seul (le sien) |
| Candidats | CRUD complet | Modifier photo + bio uniquement |
| Période de vote | Oui | Oui |
| Types de tickets / Réclamations | Oui | Non |
| Solde | Consultation + ajustements manuels | Consultation |
| Retraits | Demande + validation/rejet/paiement | Demande uniquement |
| Comptes (créer ADMIN/PROMOTEUR) | Oui | Non |
| Journal d'audit | Oui | Non |

Premier compte ADMIN créé via `server-votes/scripts/seedFirstAdmin.js`
(voir ce fichier). Tous les comptes suivants (ADMIN ou PROMOTEUR) se créent
depuis l'écran **Comptes** une fois connecté.

## Limitations connues (v1)

- Éditeur de zones de texte pour les types de tickets : formulaire JSON brut
  (pas d'éditeur visuel drag-and-drop comme il en existait un ailleurs).
  Fonctionnel mais moins pratique — à améliorer si besoin.
- Pas d'export PDF/CSV pour l'instant (dépendances prêtes — `chart.js` déjà
  en place — mais l'export lui-même n'est pas encore branché).
- Révocation d'un compte désactivé : immédiate (le statut `isActive` est
  relu en base à chaque requête, pas seulement au login) — un compte
  désactivé perd l'accès dès la requête suivante, même avec un token encore
  valide.
