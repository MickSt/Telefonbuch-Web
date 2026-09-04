#!/bin/bash

# Telefonbuch-Web Service Starter
# Startet Backend und Frontend Services

set -e

PROJECT_DIR="/home/vbeadmin/Telefonbuch-Web"
cd "$PROJECT_DIR"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         TELEFONBUCH-WEB SERVICES STARTEN                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Prüfe ob alte Prozesse laufen
echo "🔍 Prüfe auf alte Prozesse..."
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Starte Backend
echo ""
echo -e "${YELLOW}▶ Starte Backend...${NC}"
npm run dev -w backend &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend gestartet (PID: $BACKEND_PID)${NC}"

# Warte bis Backend bereit ist
echo "⏳ Warte auf Backend..."
for i in {1..30}; do
  if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend bereit${NC}"
    break
  fi
  sleep 1
done

# Starte Frontend
echo ""
echo -e "${YELLOW}▶ Starte Frontend...${NC}"
npm run dev -w frontend &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend gestartet (PID: $FRONTEND_PID)${NC}"

# Warte bis Frontend bereit ist
echo "⏳ Warte auf Frontend..."
for i in {1..30}; do
  if curl -s -k https://localhost:8443/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend bereit${NC}"
    break
  fi
  sleep 1
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    SERVICES LAUFEN                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Backend:  http://localhost:5000${NC}"
echo -e "${GREEN}✅ Frontend: https://localhost:8443${NC}"
echo -e "${GREEN}✅ API:      http://localhost:5000/api${NC}"
echo ""
echo "📍 Öffne im Browser: https://localhost:8443"
echo ""
echo "⚠️  Zertifikat-Warnung ist normal (Self-Signed)"
echo ""
echo "Drücke Ctrl+C um Services zu stoppen"
echo ""

# Warte auf Interrupt
wait
