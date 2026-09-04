# Telefonbuch Web Docker

Containerisierte Lösung für die Phonebook-API mit TypeScript und Express.

## Features

- **Multi-Stage Docker Build**: Optimierte Bildgröße für Production
- **TypeScript**: Type-safe Backend
- **Health Checks**: Automatische Container-Statusüberwachung
- **Security**: Non-Root User, selbstsignierte Zertifikate unterstützt
- **Environment-Variablen**: Flexible Konfiguration

## Voraussetzungen

- Docker & Docker Compose
- Node.js 18+ (für lokale Entwicklung)

## Installation

### 1. Repository klonen
```bash
git clone https://forgejo.internal.example.com/company/phonebook-api.git
cd phonebook-api
```

### 2. Environment konfigurieren
```bash
cp .env.example .env
# Bearbeite .env mit deinen Credentials und URLs
nano .env
```

### 3. Zertifikate (für selbstsignierte Certs)
```bash
mkdir -p certs
# Kopiere dein selbstsigniertes CA-Zertifikat
cp /path/to/ca-cert.crt certs/
```

### 4. Container starten
```bash
docker-compose up -d
```

## Entwicklung

### Lokal ohne Docker
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Tests
```bash
npm test
```

## API Endpoints

- `GET /health` - Health Check
- `GET /api/phonebook` - Phonebook-Daten abrufen
- `POST /api/sync` - Synchronisierung mit Repository

## Logs

```bash
docker-compose logs -f phonebook-api
```

## Troubleshooting

### SSL-Zertifikat-Fehler
Stelle sicher, dass dein CA-Zertifikat in `certs/` vorhanden ist und `NODE_TLS_REJECT_UNAUTHORIZED=0` in .env gesetzt ist.

### Repository-Zugriff
Überprüfe die Credentials in .env und stelle sicher, dass der Benutzer Zugriff auf das Forgejo-Repository hat.

## License

Intern - Nur für die Verwendung innerhalb des Unternehmens.
