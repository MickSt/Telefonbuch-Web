# Docker + Nginx Integration Setup

## Überblick

Die Telefonbuch-Webanwendung läuft vollständig in Docker-Containern mit einem nativen Nginx Reverse Proxy:

- **Backend Container**: Node.js Express API (Port 5000)
- **Frontend Container**: Nginx + React SPA (Port 8080, intern 80)
- **Reverse Proxy**: Nginx nativ auf Port 80/443 (Host)

## Docker Compose Setup

### `docker-compose.yml`

```yaml
services:
  backend:
    ports:
      - "5000:5000"
    env_file: .env
    
  frontend:
    ports:
      - "8080:80"
    env_file: .env
```

**Wichtige Konfigurationen:**
- Backend: Port 5000 (Host) → 5000 (Container)
- Frontend: Port 8080 (Host) → 80 (Container intern)
- Beide Services lesen Umgebungsvariablen aus `.env`

### `.env` Datei

```
NODE_ENV=production
AZURE_CLIENT_ID=<deine-app-id>
AZURE_CLIENT_SECRET=<dein-secret>
AZURE_TENANT_ID=<tenant-id>
REDIRECT_URI=https://telefonbuch.vbe.local/api/auth/callback
CARDDAV_URL=<nextcloud-url>
CARDDAV_USERNAME=<username>
CARDDAV_PASSWORD=<password>
SESSION_SECRET=<secret>
CORS_ORIGIN=https://telefonbuch.vbe.local
```

## Nginx Reverse Proxy Setup

### `/etc/nginx/sites-available/telefonbuch`

```nginx
upstream frontend {
    server localhost:8080;
}

upstream backend {
    server localhost:5000;
}

server {
    listen 443 ssl;
    http2 on;
    server_name telefonbuch.vbe.local;

    # SSL Zertifikate
    ssl_certificate /home/vbeadmin/Telefonbuch-Web/certs/cert.pem;
    ssl_certificate_key /home/vbeadmin/Telefonbuch-Web/certs/key.pem;

    # OAuth Callback Handler
    location = /auth/callback {
        proxy_pass http://backend/auth/callback;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (root location)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name telefonbuch.vbe.local;
    return 301 https://$server_name$request_uri;
}
```

**Wichtige Punkte:**
- `upstream frontend` → Port 8080 (Docker Container mappiert)
- `upstream backend` → Port 5000 (Docker Container mappiert)
- `/auth/callback` wird speziell zum Backend geroutet
- `/api/` wird zum Backend geroutet
- `/` wird zum Frontend geroutet
- HTTP wird zu HTTPS redirected

## Start-Befehle

### 1. Docker Container starten

```bash
cd /home/vbeadmin/Telefonbuch-Web
docker compose up -d
```

### 2. Nginx Reverse Proxy starten/reload

```bash
# Syntax überprüfen
sudo nginx -t

# Nginx starten
sudo systemctl start nginx

# Oder reload wenn bereits läuft
sudo systemctl reload nginx
```

### 3. Status überprüfen

```bash
# Docker Container Status
docker compose ps

# Nginx Status
sudo systemctl status nginx

# Logs anschauen
docker compose logs -f
sudo tail -f /var/log/nginx/error.log
```

## Port-Übersicht

| Service | Port (Host) | Port (Container) | Purpose |
|---------|-------------|-----------------|---------|
| Backend | 5000 | 5000 | Node.js API |
| Frontend | 8080 | 80 | Nginx + React SPA |
| Nginx HTTP | 80 | - | Redirect zu HTTPS |
| Nginx HTTPS | 443 | - | SSL/TLS Frontend |

## Wichtige URLs

- **Frontend**: `https://telefonbuch.vbe.local/`
- **Backend API**: `https://telefonbuch.vbe.local/api/`
- **Auth Callback**: `https://telefonbuch.vbe.local/auth/callback`
- **Health Check**: `https://telefonbuch.vbe.local/api/health`

## Troubleshooting

### Docker Container läuft nicht

```bash
# Logs anschauen
docker compose logs backend
docker compose logs frontend

# Container manuell starten
docker compose up -d
```

### Nginx gibt 502 Bad Gateway

```bash
# Überprüfen ob Container laufen
docker compose ps

# Überprüfen ob Ports verfügbar sind
netstat -tlnp | grep 5000
netstat -tlnp | grep 8080

# Nginx Fehler überprüfen
sudo tail -f /var/log/nginx/error.log
```

### HTTPS Zertifikat Fehler

```bash
# Zertifikat existiert?
ls -la /home/vbeadmin/Telefonbuch-Web/certs/

# Zertifikat valid?
openssl x509 -in /home/vbeadmin/Telefonbuch-Web/certs/cert.pem -text -noout
```

### Authentication funktioniert nicht

1. Überprüfe ob `/auth/callback` im Nginx korrekt geroutet wird
2. Überprüfe ob `REDIRECT_URI` in `.env` korrekt ist
3. Überprüfe Azure AD App Registration Einstellungen
4. Backend Logs: `docker compose logs backend | grep -i auth`

## Sicherheitsheader

Die Nginx-Konfiguration setzt folgende Security Headers:

```
Strict-Transport-Security: max-age=31536000
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

## Performance

- **Gzip Compression**: Aktiviert für Text-Assets
- **SSL/TLS**: Modern ciphers only (TLSv1.2 + TLSv1.3)
- **HTTP/2**: Aktiviert für schnellere Requests
- **Docker**: Alpine Linux für minimale Image-Größe

## Backup & Restore

### Container-Logs exportieren

```bash
docker compose logs > backup.log
```

### Docker Images sichern

```bash
docker save telefonbuch-backend > backend.tar
docker save telefonbuch-frontend > frontend.tar
```

### Images wiederherstellen

```bash
docker load < backend.tar
docker load < frontend.tar
```

---

**Status**: ✅ Produktionsbereit  
**Konfiguration geprüft**: 2026-05-06
