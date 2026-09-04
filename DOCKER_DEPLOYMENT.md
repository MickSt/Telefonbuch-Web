# Docker Deployment Guide

## Übersicht

Die Telefonbuch-Webanwendung wurde vollständig als Docker-Container verpackt. Folgende Services sind containerisiert:

- **Backend**: Node.js Express API Server (Port 5000)
- **Frontend**: Nginx reverse proxy mit SPA (Port 80)
- **Nginx Reverse Proxy**: Nativer Host-Prozess (Port 443, 80)

## Vorbereitung

### 1. Umgebungsvariablen einrichten

Kopiere die Template-Datei und fülle die echten Werte ein:

```bash
cp .env.example .env.docker
nano .env.docker
```

Erforderliche Variablen:
- `AZURE_CLIENT_ID`: Microsoft Azure App Registration Client ID
- `AZURE_CLIENT_SECRET`: Microsoft Azure App Registration Client Secret
- `AZURE_TENANT_ID`: Microsoft Azure Tenant ID
- `REDIRECT_URI`: OAuth Callback URL (z.B. `https://telefonbuch.vbe.local/auth/callback`)
- `CARDDAV_URL`: CardDAV Server URL (z.B. Nextcloud)
- `CARDDAV_USERNAME`: CardDAV Benutzername
- `CARDDAV_PASSWORD`: CardDAV Passwort
- `SESSION_SECRET`: Generiere mit `openssl rand -base64 32`
- `CORS_ORIGIN`: Frontend URL (z.B. `https://telefonbuch.vbe.local`)

### 2. Docker-Images bauen

Die Docker-Images werden automatisch beim Start mit `docker compose up` gebaut. Du kannst sie auch manuell bauen:

```bash
# Alle Images bauen
docker build -t telefonbuch-backend:latest ./backend
docker build -t telefonbuch-frontend:latest ./frontend

# Oder mit docker compose
docker compose --env-file .env.docker build
```

## Starten der Container

```bash
# Container im Hintergrund starten
docker compose --env-file .env.docker up -d

# Logs anschauen
docker compose --env-file .env.docker logs -f

# Container stoppen
docker compose --env-file .env.docker down

# Container und Volumes löschen
docker compose --env-file .env.docker down -v
```

## Container-Status überprüfen

```bash
# Status aller Container
docker compose --env-file .env.docker ps

# Backend-Logs
docker compose --env-file .env.docker logs backend

# Frontend-Logs
docker compose --env-file .env.docker logs frontend

# Health-Status
docker inspect telefonbuch-backend
docker inspect telefonbuch-frontend
```

## Netzwerk-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│              Docker Compose Network                          │
│        (telefonbuch-network, Bridge Driver)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │   telefonbuch-       │      │   telefonbuch-       │    │
│  │   backend:5000       │      │   frontend:80        │    │
│  │                      │      │ (Nginx SPA)          │    │
│  │ • Node.js Express    │      │                      │    │
│  │ • Azure AD Auth      │      │ • Vite Build         │    │
│  │ • CardDAV Sync       │      │ • React Router       │    │
│  │ • API Endpoints      │◄─────┤ • Health: 200 OK     │    │
│  │ • Health: 200 OK     │      │                      │    │
│  └──────────────────────┘      └──────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
          ▲
          │ (intern nur, expose)
          │
┌─────────────────────────────────────────────────────────────┐
│              Nginx Reverse Proxy (Host)                      │
│            telefonbuch.vbe.local:443 (TLS)                  │
│                                                               │
│  • Frontend requests ──► telefonbuch-frontend:80            │
│  • API requests ────────► telefonbuch-backend:5000          │
│  • SSL/TLS Termination                                      │
│  • Security Headers                                         │
└─────────────────────────────────────────────────────────────┘
```

## Authentifizierung

Die Authentifizierung funktioniert über OAuth 2.0 mit Microsoft Azure AD:

1. Benutzer klickt "Mit M365 anmelden" auf der Login-Seite
2. Frontend leitet zu `/api/auth/login` weiter
3. Backend gibt Azure AD Authorization URL zurück
4. Benutzer wird zu Microsoft weitergeleitet
5. Nach Authentifizierung wird zu `/auth/callback` weitergeleitet
6. Frontend verarbeitet den `code` Parameter
7. Backend tauscht Code gegen Token aus
8. Session wird erstellt und der Benutzer ist angemeldet

### Callback-Flow

```
Frontend                     Backend                    Azure AD
  │                            │                           │
  ├─────  /api/auth/login ────►│                           │
  │◄─────  authUrl ────────────┤                           │
  │                            │                           │
  │──────────  redirect ─────────────────────────────────►│
  │                                                        │
  │                                    ◄─── code ─────────┤
  │◄──────────────── redirect mit code ─────────────────┤
  │                                                        │
  ├─────  /auth/callback ─────►│                           │
  │      (code in Body)         │                           │
  │                             ├─────  token request ────►│
  │                             │◄──── access_token ──────┤
  │◄────  {user, token} ────────┤                           │
  │                            │                           │
```

## Problembehebung

### Frontend zeigt "unhealthy"
- Überprüfe ob Nginx läuft: `docker exec telefonbuch-frontend nginx -t`
- Überprüfe Logs: `docker compose logs frontend`
- Testen: `docker exec telefonbuch-frontend wget -q -O- http://127.0.0.1/`

### Backend antwortet nicht
- Überprüfe ob Node.js läuft: `docker compose logs backend`
- Überprüfe Health: `docker exec telefonbuch-backend curl http://localhost:5000/api/health`
- Überprüfe Env-Variablen: `docker inspect telefonbuch-backend`

### Authentifizierung schlägt fehl
- Überprüfe `REDIRECT_URI` in `.env.docker` (muss mit Azure Portal übereinstimmen)
- Überprüfe `CORS_ORIGIN` (Frontend URL)
- Überprüfe Azure AD Credentials (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`)
- Überprüfe Backend Logs: `docker compose logs backend | grep -i auth`

### CardDAV-Synchronisierung fehlgeschlagen
- Überprüfe `CARDDAV_URL`, `CARDDAV_USERNAME`, `CARDDAV_PASSWORD`
- Überprüfe ob CardDAV-Server erreichbar ist
- Logs: `docker compose logs backend | grep -i carddav`

## Performance-Tipps

1. **Image-Größen**: Alpine Linux wird für kleine Image-Größen verwendet
2. **Caching**: Docker nutzt Build-Cache für schnellere Rebuilds
3. **Health-Checks**: Sind entfernt (Docker Compose managed bereits Restart)
4. **Memory**: Keine Limits gesetzt (standard Docker defaults)

## Sicherheit

- ✅ Non-root Container (Node.js/Nginx default)
- ✅ Read-only Filesystems könnten noch hinzugefügt werden
- ✅ Network isolation mit Docker network
- ✅ Secrets sollten nicht in docker-compose.yml committet werden
- ✅ TLS wird durch Nginx Reverse Proxy gehandelt

## Weiterführende Ressourcen

- Docker Dokumentation: https://docs.docker.com/
- Docker Compose Dokumentation: https://docs.docker.com/compose/
- Container Best Practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
