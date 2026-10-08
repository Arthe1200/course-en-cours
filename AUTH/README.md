# Système de connexion Course en Cours

L'interface utilise un serveur d'authentification séparé du site public.

## Architecture
- GitHub Pages : interface publique.
- Cloudflare Worker : authentification et gestion des comptes.
- Cloudflare D1 : comptes et sessions.
- Les mots de passe ne sont jamais stockés en clair.
- Les rôles sont imposés par le serveur : `admin`, `prof`, `eleve`.
- L'équipe est associée au compte.

## Première installation
1. Créer une base D1 Cloudflare.
2. Exécuter `schema.sql`.
3. Déployer `worker.js` comme Worker.
4. Créer le premier compte administrateur de façon sécurisée (voir la documentation de déploiement).
5. Mettre l'URL du Worker dans `INTERFACE/config.js`.

## Important
GitHub Pages seul ne peut pas sécuriser des comptes privés : ne jamais mettre une liste de mots de passe dans `INTERFACE/`.
