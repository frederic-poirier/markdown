# Suggestions pour la suite du projet

## Vision produit (court terme)

- Unifier l’expérience autour de 3 modes clairs:
  - `/text/:id` pour la lecture
  - `/code/:id` pour le code plein écran
  - `/media/:id` pour les schémas/images plein écran
- Faire de **Home** un vrai hub de contenu (local + cloud + actions d’import).
- Réduire le nombre de clics pour “importer → ouvrir → synchroniser”.

---

## 1) Priorités immédiates (haute valeur)

## A. Split des routes de rendu

Idée:
- Ajouter les 3 routes dès maintenant et garder `/view/:id` en fallback/redirect.

Pourquoi:
- Ça prépare toute l’architecture “mode-driven” sans casser l’existant.

Critères de réussite:
- Même source de données (`id`) pour les 3 routes.
- Même pipeline de parsing, layout différent par mode.

## B. Normaliser les actions fichiers

Idée:
- Ajouter un menu d’actions cohérent pour local et cloud:
  - Open Text / Open Code / Open Media
  - Sync on/off
  - Delete local / delete cloud

Pourquoi:
- Aujourd’hui le menu est surtout orienté local.

## C. Input “paste” rapide

Idée:
- Ajouter un bouton “Paste text” dans Home.
- Créer un fichier auto (`Pasted YYYY-MM-DD HH:mm`).

Pourquoi:
- Usage ultra-fréquent, faible complexité, gros gain UX.

---

## 2) Suggestions techniques

## A. Service de contenu unique (frontend)

Créer un adaptateur unique `contentRepository` qui encapsule:
- `getById(id)` (local puis cloud)
- `getAllLocal()`
- `getAllCloud()`
- `saveLocal(file)`
- `saveCloud(file)`
- `removeLocal(id)`
- `removeCloud(id)`

Bénéfice:
- Évite la logique dupliquée entre `Home`, `View`, futures pages `/text /code /media`.

## B. Modèle de “sync status” explicite

Ajouter un état dérivé par fichier:
- `local-only`
- `cloud-only`
- `synced`
- `out-of-sync` (plus tard si édition)

Bénéfice:
- Plus lisible pour l’utilisateur et plus simple pour les actions menu.

## C. Durcir le contrat API files

Suggestions:
- Réponse homogène `{ success, data, error }`
- Validation stricte des payloads
- Codes HTTP stables
- Ajouter `updatedAt` dans l’index cloud pour faciliter les futures merges

---

## 3) Performance

## A. Continuer le lazy-loading ciblé

- Garder `shiki`/`mermaid` en dynamic import.
- Charger certains renderers lourds seulement quand rencontrés.

## B. Option “langages Shiki allowlist”

- Limiter les langages supportés par défaut.
- Charger les plus rares à la demande.

Bénéfice:
- Réduction nette des chunks les plus lourds.

---

## 4) UX / UI

## A. Mode `/code` vraiment plein écran

- Enlever les containers “card”
- Sticky header minimal (nom fichier + langage + copy)
- Scroll horizontal/vertical propre

## B. Mode `/media` type canvas

- Fond neutre
- Centrage intelligent
- Pan/zoom image + mermaid
- Boutons de zoom visibles mais discrets

## C. Feedback sync fiable

- Toasts uniformes (success/error)
- Indicateur visuel de statut cloud par fichier dans la liste

---

## 5) Ingestion (prochaines briques)

## A. URL ingest (v1 simple)

- Champ URL dans Home
- Endpoint API qui fetch le HTML et extrait le texte principal (fallback brut)
- Création d’un fichier markdown

## B. Drag & Drop

- Drop zone globale Home
- Multi-fichiers
- Validation extension/taille + feedback

## C. API ingest

- Endpoint `/api/ingest` pour envoyer du texte/fichier
- Retourne `id` + metadata

---

## 6) Sécurité / robustesse

- Ajouter rate-limit léger sur endpoints sensibles (`/api/files/*`, `badge`, futurs ingest)
- Journaliser proprement les erreurs backend (sans exposer détails au client)
- Vérifier la logique de refresh session (condition de seuil)
- Ajouter garde-fous sur parsing SVG badges (taille max, timeout fetch)

---

## 7) Cloudflare (phase suivante)

- Pipeline asynchrone pour PDF/DOCX (queue + status)
- Endpoint status de conversion
- UI de progression dans Home

---

## 8) Proposition de roadmap (2 semaines)

Semaine 1
1. Routes `/text /code /media`
2. Layouts spécifiques par mode
3. Menu actions unifié local/cloud
4. Paste input

Semaine 2
1. URL ingest v1
2. Drag & drop
3. API ingest v1
4. Stabilisation perf + polish UX

---

## 9) “Definition of done” conseillée

- Build prod sans régressions visibles
- Tous les flows clés testés:
  - import local
  - sync cloud on/off
  - ouverture `/text /code /media`
  - auth/login/logout
- Deploy production + smoke test rapide sur `texte.zip`
