# Authentification Course en Cours

## Architecture

GitHub Pages -> Cloudflare Worker -> Cloudflare D1

Le navigateur ne contient aucun mot de passe et aucun rôle n'est choisi par l'utilisateur.

## Rôles

- admin : gestion complète des comptes et du projet.
- prof : vue globale et suivi pédagogique.
- eleve : accès au projet avec l'équipe associée au compte.

## Équipe

Chaque compte élève peut avoir une équipe : conception, modelisation-3D, materiaux, fabrication, assemblage, essais ou presentation.

## Installation Cloudflare

1. Installer Wrangler : npm install -g wrangler
2. Se connecter : wrangler login
3. Créer la base : wrangler d1 create course-en-cours
4. Copier le database_id retourné dans wrangler.toml.
5. Initialiser le schéma : wrangler d1 execute course-en-cours --remote --file=schema.sql
6. Définir la clé secrète : wrangler secret put BOOTSTRAP_KEY
7. Déployer : wrangler deploy

## Créer le premier administrateur

Une fois le Worker déployé, envoyer une requête POST vers /api/bootstrap avec l'en-tête X-Bootstrap-Key et le JSON {"username":"TON_IDENTIFIANT","password":"TON_MOT_DE_PASSE"}.

Cette route ne fonctionne qu'avant la création du premier compte.

## Brancher le site

Modifier INTERFACE/config.js pour mettre l'URL du Worker :
window.CEC_AUTH_API = "https://TON-WORKER";

Puis pousser le changement sur main.

## Sécurité

- Les mots de passe sont dérivés avec PBKDF2-SHA-256.
- Les sessions sont des jetons aléatoires stockés sous forme de hash.
- Le cookie de session est HttpOnly + Secure.
- Les permissions sont contrôlées côté serveur.
- Ne jamais mettre de mot de passe, clé Bootstrap ou token GitHub dans INTERFACE/.
