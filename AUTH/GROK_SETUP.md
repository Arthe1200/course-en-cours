# Configuration de GroqCloud pour Course en Cours

Le Worker Cloudflare appelle l'API GroqCloud depuis le serveur. La clé ne doit jamais être ajoutée à `INTERFACE/config.js`, au dépôt GitHub ou au code du navigateur.

## Ajouter la clé API

Dans Cloudflare, ouvre **Workers & Pages** → **course-en-cours-auth** → **Settings** → **Variables and Secrets** et ajoute un secret nommé `GROQ_API_KEY` avec la clé créée sur [GroqCloud](https://console.groq.com/keys).

Le modèle par défaut est `qwen/qwen3.8-27b`, compatible avec l'analyse de texte et d'images. Pour le remplacer, ajoute une variable d'environnement `GROQ_MODEL` avec l'identifiant d'un modèle actif visible dans la [liste officielle des modèles GroqCloud](https://console.groq.com/docs/models).

## Comportement et confidentialité

- L'assistant IA peut lire les données partagées du projet : utilisateurs (nom d'utilisateur, rôle, équipe), progression, annotations, séances, problèmes, idées, tests et photos associées.
- Les données sont envoyées à l'API GroqCloud lors des questions et des générations de journal.
- Les mots de passe, leurs empreintes et les sessions ne sont jamais inclus dans le contexte envoyé au modèle.
- Les notes privées des chefs d'équipe et leurs pièces jointes sont exclues du contexte afin de préserver la confidentialité de cet espace.
- L'assistant ne peut pas modifier les fiches existantes. Seuls les endpoints serveur dédiés lui permettent de créer/actualiser le journal de bord IA et d'ajouter ses suggestions.
- Seul l'administrateur peut déclencher une génération de journal, afin de limiter les appels API. Les élèves et professeurs peuvent consulter le journal de bord IA. La discussion IA est masquée aux professeurs.
