# Configuration de Grok pour Course en Cours

Le Worker Cloudflare appelle l'API xAI depuis le serveur. La clé ne doit jamais être ajoutée à `INTERFACE/config.js`, au dépôt GitHub ou au code du navigateur.

## Ajouter la clé API

Dans Cloudflare, ouvre **Workers & Pages** → **course-en-cours-auth** → **Settings** → **Variables and Secrets** et ajoute un secret nommé `GROK_API_KEY` avec la clé créée dans la console xAI.

Le modèle par défaut est `grok-4.7`. Pour le remplacer, ajoute une variable d'environnement `GROK_MODEL` avec l'identifiant d'un modèle compatible avec l'API chat completions et l'analyse d'images.

## Comportement et confidentialité

- Grok peut lire les données partagées du projet : utilisateurs (nom d'utilisateur, rôle, équipe), progression, annotations, séances, problèmes, idées, tests et photos associées.
- Les données sont envoyées à l'API xAI lors des questions et des générations de journal.
- Les mots de passe, leurs empreintes et les sessions ne sont jamais inclus dans le contexte envoyé à Grok.
- Les notes privées des chefs d'équipe et leurs pièces jointes sont exclues du contexte Grok afin de préserver la confidentialité de cet espace.
- Grok ne peut pas modifier les fiches existantes. Seuls les endpoints serveur dédiés lui permettent de créer/actualiser le journal de bord IA et d'ajouter ses suggestions.
- Seul l'administrateur peut déclencher une génération de journal, afin de limiter les appels payants. Les élèves et professeurs peuvent consulter le journal de bord IA. L'onglet de discussion Grok est masqué aux professeurs.
