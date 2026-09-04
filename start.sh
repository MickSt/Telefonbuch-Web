#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Telefonbuch-Web Application${NC}"
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}⚠️  backend/.env not found. Creating default config...${NC}"
  cat > backend/.env << 'ENVFILE'
# Server
PORT=5000
NODE_ENV=development

# Azure AD / M365
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
REDIRECT_URI=http://localhost:3000/auth/callback

# CardDAV / Nextcloud
CARDDAV_URL=https://nextcloud.example.com/remote.php/dav
CARDDAV_USERNAME=carddav-user
CARDDAV_PASSWORD=carddav-password

# Session
SESSION_SECRET=change-this-secret-to-a-random-value-in-production

# CORS
CORS_ORIGIN=http://localhost:3000
ENVFILE
  echo -e "${YELLOW}⚠️  Please update backend/.env with your credentials!${NC}"
  echo ""
fi

# Change to project directory
cd /home/vbeadmin/Telefonbuch-Web

# Start backend in background
echo -e "${GREEN}Starting Backend (Port 5000)...${NC}"
npm run build > /dev/null 2>&1
npm start -w backend > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

sleep 2

# Start frontend in background
echo -e "${GREEN}Starting Frontend (Port 3000)...${NC}"
npm start -w frontend > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

sleep 2

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Application is starting!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📱 Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "🔌 Backend:   ${GREEN}http://localhost:5000${NC}"
echo -e "📊 Health:    ${GREEN}http://localhost:5000/api/health${NC}"
echo ""
echo -e "${YELLOW}⚠️  Backend Configuration Needed:${NC}"
echo "   1. Set AZURE_CLIENT_ID in backend/.env"
echo "   2. Set AZURE_CLIENT_SECRET in backend/.env"
echo "   3. Set AZURE_TENANT_ID in backend/.env"
echo "   4. Set CARDDAV_URL in backend/.env"
echo "   5. Set CARDDAV_USERNAME in backend/.env"
echo "   6. Set CARDDAV_PASSWORD in backend/.env"
echo ""
echo -e "${GREEN}📋 Log files:${NC}"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo -e "${YELLOW}Stop servers with:${NC}"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Keep script running
wait
