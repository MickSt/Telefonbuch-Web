import axios from 'axios';
import { config } from '../config/env.js';
import { Contact } from '../types/index.js';

export class CardDAVService {
  private static contacts: Contact[] = [];
  private static lastRefresh: number = 0;
  private static refreshInterval: number = 5 * 60 * 1000; // 5 minutes

  static async initialize(): Promise<void> {
    try {
      console.log('Initializing CardDAV Service (Direct Mode)...');
      await this.refreshContacts();
      this.startAutoRefresh();
    } catch (error) {
      console.error('Failed to initialize CardDAV service:', error);
    }
  }

  static async refreshContacts(): Promise<void> {
    try {
      console.log('Fetching contacts from CardDAV (Direct PROPFIND)...');
      
      const auth = Buffer.from(
        `${config.cardDAV.username}:${config.cardDAV.password}`
      ).toString('base64');

      // PROPFIND request to get all vCards in the address book
      const response = await axios({
        method: 'PROPFIND',
        url: config.cardDAV.url,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/xml',
          'Depth': '1',
        },
        data: `<?xml version="1.0" encoding="utf-8" ?>
          <d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:carddav">
            <d:prop>
              <d:getetag />
              <c:address-data />
            </d:prop>
          </d:propfind>`,
      });

      const vCards: string[] = [];
      const xmlData = response.data;

      // Simple regex-based extraction of address-data from XML
      // This is more robust than a full XML parser for this specific case
      const addressDataRegex = /<[a-zA-Z0-9]+:address-data[^>]*>([\s\S]*?)<\/[a-zA-Z0-9]+:address-data>/g;
      let match;
      while ((match = addressDataRegex.exec(xmlData)) !== null) {
        if (match[1]) {
          vCards.push(match[1].trim());
        }
      }

      console.log(`Extracted ${vCards.length} vCards from XML response`);

      this.contacts = vCards.map((data, index) => this.parseVCard(data, `contact-${index}`));
      this.lastRefresh = Date.now();
      console.log(`Successfully refreshed ${this.contacts.length} contacts from CardDAV`);
    } catch (error: any) {
      console.error('Error refreshing contacts');
    }
  }

  private static parseVCard(data: string, fallbackId: string): Contact {
    // Simple vCard parsing - extract common fields
    const getField = (regex: RegExp, field: string = ''): string => {
      const match = data.match(regex);
      if (match && match[1]) {
        // Remove CR (\r), HTML entities like &#13; and other common vCard escape characters
        return match[1]
          .replace(/\r/g, '')
          .replace(/&#13;/g, '')
          .replace(/\\,/g, ',')
          .replace(/\\;/g, ';')
          .trim();
      }
      return field;
    };

    // Extract UID or use fallback
    const uid = getField(/^UID:(.*)$/im) || fallbackId;

    // Extract categories (groups)
    const categoriesStr = getField(/^CATEGORIES:(.*)$/im);
    const categories = categoriesStr ? categoriesStr.split(',').map(c => c.trim()) : [];

    const phone = getField(/^TEL(?:.*?TYPE=.*?VOICE.*?):(.*)$/im) || getField(/^TEL(?:.*?TYPE=.*?WORK.*?):(.*)$/im) || getField(/^TEL;[^:]*:(.*)$/im);
    const mobile = getField(/^TEL(?:.*?TYPE=.*?CELL.*?):(.*)$/im) || getField(/^TEL(?:.*?TYPE=.*?MOBILE.*?):(.*)$/im);

    const contact: Contact = {
      id: uid,
      fullName: getField(/^FN:(.*)$/im) || getField(/^N:(.*)$/im).split(';').reverse().join(' ').trim(),
      email: getField(/^EMAIL(?:.*?):(.*)$/im),
      phone: phone === mobile ? undefined : phone,
      mobile: mobile,
      organization: getField(/^ORG:(.*)$/im),
      jobTitle: getField(/^TITLE:(.*)$/im),
      categories,
      rawVCard: data,
    };

    return contact;
  }

  static getContacts(): Contact[] {
    // Sort contacts by fullName
    return [...this.contacts].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  static getContact(id: string): Contact | undefined {
    return this.contacts.find((c) => c.id === id);
  }

  static searchContacts(query: string): Contact[] {
    const normalize = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const normalizedQuery = normalize(query);
    
    return this.contacts.filter((contact) => {
      const fullName = normalize(contact.fullName);
      const email = contact.email ? normalize(contact.email) : '';
      const organization = contact.organization ? normalize(contact.organization) : '';
      const phone = contact.phone || '';
      const mobile = contact.mobile || '';

      return (
        fullName.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        organization.includes(normalizedQuery) ||
        phone.includes(query) ||
        mobile.includes(query)
      );
    });
  }

  private static startAutoRefresh(): void {
    setInterval(() => {
      this.refreshContacts();
    }, this.refreshInterval);
  }
}
