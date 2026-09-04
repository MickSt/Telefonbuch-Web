import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = [
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'AZURE_TENANT_ID',
  'SESSION_SECRET',
  'CARDDAV_URL',
  'CARDDAV_USERNAME',
  'CARDDAV_PASSWORD'
];

for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.warn(`⚠️  Missing required environment variable: ${env}`);
  }
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  azure: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    tenantId: process.env.AZURE_TENANT_ID || '',
    redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback',
  },
  
  cardDAV: {
    url: process.env.CARDDAV_URL || '',
    username: process.env.CARDDAV_USERNAME || '',
    password: process.env.CARDDAV_PASSWORD || '',
  },
  
  session: {
    secret: process.env.SESSION_SECRET || '',
    valkeyUrl: process.env.VALKEY_URL || 'redis://valkey:6379',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};
