export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Contact {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  organization?: string;
  jobTitle?: string;
  categories?: string[];
  photoUrl?: string;
  rawVCard?: string;
}

export interface AuthSession {
  userId: string;
  user: User;
  accessToken: string;
}
