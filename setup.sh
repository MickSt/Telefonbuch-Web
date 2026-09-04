#!/bin/bash

# Telefonbuch Setup Script

echo "📦 Installing dependencies..."
npm install

echo ""
echo "⚙️  Creating .env file..."

if [ ! -f backend/.env ]; then
  cat > backend/.env << 'EOF'
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
SESSION_SECRET=change-this-secret

# CORS
CORS_ORIGIN=http://localhost:3000
EOF
  echo "✅ .env file created at backend/.env"
  echo "⚠️  Please update it with your credentials"
else
  echo "✅ .env file already exists"
fi

echo ""
echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your M365 and Nextcloud credentials"
echo "2. Run 'npm run dev' to start the development server"
