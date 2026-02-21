# Texte

## Markdown

Markdown sera le format de fichier sauvegardé dans le cloud et localement car :

- Plus facile à modifier pour un LLM
- Format lisible
- Plusieurs convertisseurs proposent un format Markdown
- Léger
- Source limitée de composants et de customisation
  - Facile à parser
  - Standardisé par défaut

---

## Workflow

### Core

La WebApp embarque **Remark**, une bibliothèque permettant de transformer du Markdown en mdAST. Elle embarquera aussi **Turndown**, une bibliothèque qui permet de convertir des fragments HTML en Markdown, utilisée pour le copy-paste. Finalement, la WebApp embarquera aussi **Shiki** afin de pouvoir parser et highlight du code. Ainsi, avec ces trois bibliothèques, la WebApp pourra afficher des fichiers locaux et téléchargés au format Markdown et code, mais aussi du copy-paste.

- Remark
- Turndown
- Shiki
- MermaidJS

Le pipeline de traitement est le suivant :

```
HTML      → Turndown → Markdown
Markdown  → Remark   → mdAST
mdAST     → Renderer → SolidJS Components
```

### Services

Autour du core s'articuleront plusieurs petits services indépendants. Ces services seront accessibles depuis un tunnel Cloudflare. Les services ne seront pas disponibles offline. Ceux-ci peuvent recevoir n'importe quoi mais renverront pratiquement toujours du Markdown, car c'est le seul format que la WebApp comprend.

**File**

- PDF to Markdown → Marker (service CPU derriere tunnel Cloudflare)
- DOCX to Markdown → Pandoc
- Web to Markdown → trafilatura
- Documentation extraction
- GitHub repository extraction
- Local file access

**LLM**

- Fix
- Summarize
- Style
- Vectorize search

### Stack

#### Frontend

Le frontend de la WebApp utilisera **SolidJS** et sera hébergé sur Cloudflare Pages.

#### Backend

Le backend de la WebApp sera dans **Cloudflare Functions** pour une intégration facile et rapide. Il sera en charge de l'authentification avec Google OAuth 2.0 uniquement, de l'accès à la base de données et de l'accès au tunnel Cloudflare. Les Functions constituent l'unique point d'accès au tunnel, auquel elles font confiance de manière implicite. L'authentification repose sur un cookie signé avec un secret partagé.

#### Base de données

La base de données sera organisée en trois couches. La première, **IndexedDB**, permet de sauvegarder les fichiers directement dans le navigateur pour un accès offline. La seconde, **R2**, contient les fichiers textes au format Markdown. L'identifiant d'un fichier est le hash de son contenu Markdown ; en cas de divergence (modification LLM par exemple), la dernière version est conservée et l'utilisateur est invité à choisir. Finalement, **D1** contient les métadonnées des fichiers, les informations sur l'utilisateur et ses préférences.

#### Services

Les services sont de petits serveurs HTTP accessibles via le tunnel Cloudflare.

### Proxy PDF (Cloudflare Functions -> Tunnel)

- Le proxy API est exposé via `/api/pdf/*`.
- Les routes du proxy exigent une session utilisateur valide (`requireAuth`).
- Le tunnel n'est jamais appelé directement depuis le navigateur.

Variables d'environnement côté Functions :

- `CF_ACCESS_CLIENT_ID` : Service Token Client ID Cloudflare Access.
- `CF_ACCESS_CLIENT_SECRET` : Service Token Secret Cloudflare Access.
- `PDF_SERVICE_BASE_URL` (optionnel) : URL de base du service PDF (par défaut `https://pdf.texte.zip`).

Exemples :

```bash
# Health check
curl http://localhost:7000/api/pdf/

# Conversion markdown
curl -X POST \
  -F 'file=@document.pdf' \
  -F 'output_file=document.md' \
  http://localhost:7000/api/pdf/markdown
```

### Service Marker (CPU) derriere le tunnel

Le proxy `/api/pdf/*` est deja en place. Il faut simplement deployer un service HTTP Marker compatible avec:

- `GET /`
- `POST /markdown` (multipart `file`, `output_file`, `fast`) -> ZIP contenant un `.md`

Un bridge pret a l'emploi est fourni dans `services/marker-bridge/`.

Installation rapide (serveur CPU):

```bash
cd services/marker-bridge
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

Exemple de test direct du service:

```bash
curl -X POST \
  -F 'file=@document.pdf' \
  -F 'output_file=document.md' \
  -F 'fast=true' \
  http://127.0.0.1:8001/markdown \
  --output document.zip
```

Cloudflare Tunnel + Access:

- Publier le service sur un hostname prive (ex: `pdf.texte.zip`) via `cloudflared tunnel`.
- Proteger ce hostname avec Cloudflare Access (Service Token).
- Configurer cote Functions:
  - `PDF_SERVICE_BASE_URL=https://pdf.texte.zip`
  - `CF_ACCESS_CLIENT_ID=<service_token_client_id>`
  - `CF_ACCESS_CLIENT_SECRET=<service_token_secret>`

Verification bout en bout via le proxy Functions:

```bash
# health
curl http://localhost:7000/api/pdf/

# conversion (passe par Functions -> tunnel -> Marker)
curl -X POST \
  -F 'file=@document.pdf' \
  -F 'output_file=document.md' \
  http://localhost:7000/api/pdf/markdown \
  --output document.zip
```
