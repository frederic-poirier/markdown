# Marker Bridge (CPU)

Petit service HTTP pour convertir un PDF en Markdown avec Marker et renvoyer un ZIP compatible avec l'API existante (`/api/pdf/markdown`).

## 1) Installation

Prerequis:

- Python 3.10+
- Outils systeme de base (`python3-venv`, `build-essential` sur Debian/Ubuntu)

Depuis ce dossier:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 2) Lancer localement

```bash
source .venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8001
```

Verification:

```bash
curl http://127.0.0.1:8001/
```

## 3) Endpoint

- `GET /` -> health JSON
- `POST /markdown` -> upload multipart (`file`, `output_file`, `fast`) et reponse `application/zip`

Exemple:

```bash
curl -X POST \
  -F 'file=@/path/to/document.pdf' \
  -F 'output_file=document.md' \
  -F 'fast=true' \
  http://127.0.0.1:8001/markdown \
  --output document.zip
```

## 4) Variables d'environnement utiles

- `MARKER_SINGLE_BIN` (defaut: `marker_single`)
- `MARKER_TIMEOUT_SECONDS` (defaut: `300`)
- `MARKER_FORCE_OCR` (`true`/`false`, defaut: `false`)
- `MARKER_EXTRA_FLAGS` (flags additionnels passes a marker)

## 5) Integration Cloudflare Tunnel + Access

Exposez ce service avec `cloudflared` vers un hostname prive (ex: `pdf.texte.zip`) et protegez-le avec une policy Cloudflare Access de type Service Token.

La webapp n'appelle jamais directement ce service: elle passe par `functions/api/pdf/[[path]].js`, qui injecte automatiquement:

- `CF-Access-Client-Id`
- `CF-Access-Client-Secret`

Configurez ensuite cote Functions:

- `PDF_SERVICE_BASE_URL=https://pdf.texte.zip`
- `CF_ACCESS_CLIENT_ID=<service_token_client_id>`
- `CF_ACCESS_CLIENT_SECRET=<service_token_secret>`

## 6) Service systemd (optionnel)

Exemple minimal:

```ini
[Unit]
Description=Marker Bridge API
After=network.target

[Service]
WorkingDirectory=/opt/marker-bridge
Environment=MARKER_TIMEOUT_SECONDS=300
ExecStart=/opt/marker-bridge/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=3
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```
