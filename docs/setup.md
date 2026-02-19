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

- PDF to Markdown → pdf-layout-analysis (fallback : Pandoc)
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
