# Deployment-Anleitung

## Pre-Deployment Checklist

- [ ] Alle Credentials in .env konfiguriert
- [ ] CA-Zertifikat in certs/ vorhanden
- [ ] Port 3000 ist verfügbar
- [ ] Docker und Docker Compose sind installiert

## Deployment Steps

### 1. Image bauen
```bash
docker-compose build
```

### 2. Container starten
```bash
docker-compose up -d
```

### 3. Health Check
```bash
curl http://localhost:3000/health
```

### 4. Logs überprüfen
```bash
docker-compose logs -f
```

## Production Deployment

Für Production-Deployments:

1. Verwende ein Secret-Management System (z.B. HashiCorp Vault, AWS Secrets Manager)
2. Implementiere Logging und Monitoring (z.B. ELK, Prometheus)
3. Setze Resource Limits in docker-compose.yml
4. Nutze ein Orchestration-Tool (z.B. Kubernetes)
5. Implementiere CI/CD Pipeline

## Rollback

```bash
docker-compose down
docker rmi phonebook-api:latest
# Neuen Container mit alter Version starten
```

## Monitoring

Health Check wird alle 30 Sekunden ausgeführt. Bei Fehlern wird der Container neu gestartet.
