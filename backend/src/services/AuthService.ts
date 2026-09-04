import axios from 'axios';
import { config } from '../config/env.js';
import { User } from '../types/index.js';

export class AuthService {
  static extractErrorMessage(error: any): string {
    const responseData = error?.response?.data;
    const errorCode = responseData?.error;
    const errorDescription = responseData?.error_description;

    if (errorCode || errorDescription) {
      return `Microsoft authentication failed: ${[errorCode, errorDescription].filter(Boolean).join(' - ')}`;
    }

    if (error?.message) {
      return error.message;
    }

    return 'Authentication failed';
  }
  static getAuthCodeUrl(): string {
    return `https://login.microsoftonline.com/${config.azure.tenantId}/oauth2/v2.0/authorize?client_id=${
      config.azure.clientId
    }&redirect_uri=${encodeURIComponent(
      config.azure.redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      'openid profile email'
    )}&response_mode=query`;
  }

  static async handleCallback(code: string): Promise<{ user: User; accessToken: string }> {
    try {
      const params = new URLSearchParams();
      params.append('client_id', config.azure.clientId);
      params.append('client_secret', config.azure.clientSecret);
      params.append('code', code);
      params.append('redirect_uri', config.azure.redirectUri);
      params.append('grant_type', 'authorization_code');
      params.append('scope', 'openid profile email');

      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${config.azure.tenantId}/oauth2/v2.0/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const idToken = tokenResponse.data.id_token;
      const accessToken = tokenResponse.data.access_token;

      const decoded = this.decodeToken(idToken);
      const user: User = {
        id: decoded.sub || decoded.oid,
        email: decoded.email || decoded.preferred_username,
        displayName: decoded.name,
      };

      return { user, accessToken };
    } catch (error: any) {
      const message = this.extractErrorMessage(error);
      console.error('Auth callback error:', message);
      throw new Error(message);
    }
  }

  private static decodeToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token');
    }

    const decoded = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return decoded;
  }

  static async getUser(accessToken: string): Promise<User> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = response.data;
      return {
        id: data.id,
        email: data.mail || data.userPrincipalName,
        displayName: data.displayName,
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user info');
    }
  }
}
