# 🏎️ Course en Cours — Carnet de bord

Bienvenue dans le dépôt privé de notre équipe **Course en Cours**.

Ce dépôt sert de **carnet de bord numérique** du projet : séances de travail, choix techniques, conception, fabrication, essais et évolution du véhicule.

---

# 📊 Avancement du projet

> **Les barres sont mises à jour automatiquement après chaque séance.**  
> Il suffit d'indiquer le pourcentage de chaque point dans l'Issue « Nouvelle séance ».

## 🎯 Vue d'ensemble

| Partie du projet | Avancement |
|---|---:|
| 📋 Cahier des charges | <progress value="0" max="100"></progress> **0 %** |
| 🧩 Conception | <progress value="0" max="100"></progress> **0 %** |
| 🧱 Modélisation 3D | <progress value="0" max="100"></progress> **0 %** |
| 🧪 Matériaux | <progress value="0" max="100"></progress> **0 %** |
| 🛠️ Fabrication | <progress value="0" max="100"></progress> **0 %** |
| 🔩 Assemblage | <progress value="0" max="100"></progress> **0 %** |
| 🏁 Essais | <progress value="0" max="100"></progress> **0 %** |
| 🎤 Présentation | <progress value="0" max="100"></progress> **0 %** |

### ⭐ AVANCEMENT GLOBAL

**0 %**

<progress value="0" max="100"></progress>

*L'avancement global correspond à la moyenne des 8 parties du projet.*

---

## 🎚️ Comment faire avancer une barre ?

Lors d'une séance, indiquez simplement le niveau atteint :

`02-conception | 🟡 En cours | 25 %`

➡️ L'automatisation met ensuite à jour :
- 📊 la barre de la partie concernée ;
- ⭐ l'avancement global ;
- 📚 l'historique ;
- 📅 le dossier de la séance.

**Pas besoin de modifier le README à la main.**

---

## 🧭 Accès rapide

- 📓 [Carnet de bord](CARNET-DE-BORD/README.md) — comptes rendus de chaque séance
- 📊 [Suivi détaillé](SUIVI/README.md) — progression point par point
- 📈 [Objectifs](PROGRESSION/objectifs.md)
- 📋 [Cahier des charges](CAHIER-DES-CHARGES/cahier-des-charges.md)
- 🧩 [Conception](CONCEPTION/README.md) — plans, modèles 3D et choix techniques
- 🛠️ [Fabrication](FABRICATION/README.md) — fabrication, assemblage et photos
- ⚙️ [Technique](TECHNIQUE/README.md) — matériaux, dimensions, contraintes et essais
- 📚 [Documentation](DOCUMENTATION/README.md) — recherches et comptes rendus

## 🏎️ Nouveaux outils du projet

- 👥 [Équipes](EQUIPE.md) — répartition des responsabilités
- 💬 [Annotations](ANNOTATIONS/README.md) — remarques sans modifier le travail d'une autre équipe
- ⚠️ [Problèmes](PROBLEMES/README.md) — suivi des difficultés
- 💡 [Idées](IDEES/README.md) — propositions et améliorations
- 🧪 [Tests](TESTS/README.md) — résultats des essais
- 🚗 [Versions](VERSIONS/README.md) — évolution du véhicule
- 📝 [Décisions](DECISIONS.md) — pourquoi un choix a été fait
- 🕒 [Timeline](TIMELINE.md) — histoire du projet
- 📊 [Statistiques](STATISTIQUES.md) — indicateurs du projet
- 👨‍🏫 [Espace professeur](PROFESSEUR.md) — vue de suivi
- 🖥️ [Interface](INTERFACE/README.md) — future interface avec choix d'équipe

## 👥 Travail en équipe

Chaque membre peut contribuer au carnet de bord. Après chaque séance, utilisez **Nouvelle séance** dans les Issues.

## 🔒 Accès

Ce dépôt est privé et réservé à l'équipe du projet et aux personnes autorisées, notamment les enseignants.

> Les informations de progression doivent refléter le travail réellement réalisé. Les modèles et fichiers techniques seront ajoutés au fur et à mesure du projet.

## Fonctionnalités récentes

- Carnet de bord structuré par séance, avec recherche et filtres par équipe/année.
- Export imprimable en PDF depuis le navigateur pour le carnet, les tâches, les tests et l’inventaire.
- Inventaire partagé des matériaux : catégorie, quantité, unité, équipe, emplacement, fournisseur, coût et notes.
- Signalement visuel des tâches en retard.
- Photos validées côté Worker et revalidées côté interface avant affichage.
- Les mutations API vérifient l’origine attendue et exigent un type de contenu JSON.

## Migration D1 pour l’inventaire

Sur une base D1 déjà initialisée, exécuter une seule fois depuis la racine du dépôt :

```powershell
npx wrangler d1 execute course-en-cours --remote --file=AUTH/migrations/0002_materials.sql
```

La commande modifie la base distante. Vérifie que Wrangler est connecté au bon compte Cloudflare et que le nom de base correspond à `AUTH/wrangler.toml` avant de l’exécuter. Pour une base neuve, `AUTH/schema.sql` contient également la table.
