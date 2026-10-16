import { Product, QuoteRequest, CompanySettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_LEADS, INITIAL_SETTINGS } from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'dy_automation_products_v2',
  LEADS: 'dy_automation_leads_v2',
  SETTINGS: 'dy_automation_settings_v2',
  ADMIN_SESSION: 'dy_automation_admin_session_v1',
};

export const StorageService = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        return INITIAL_PRODUCTS;
      }
      const parsed: Product[] = JSON.parse(data);
      const sanitized = parsed
        .filter(p => !p.title.includes('Test Jig') && (p.category as string) !== 'Tool Validation & Testing')
        // Ảnh đã chuyển từ src/assets/images sang public/images (đường dẫn tương đối để chạy được trên GitHub Pages)
        .map(p => (p.imageUrl?.startsWith('/src/assets/images/') ? { ...p, imageUrl: p.imageUrl.replace('/src/assets/images/', 'images/') } : p));
      return sanitized.length > 0 ? sanitized : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('dy_data_updated', { detail: { type: 'products' } }));
  },

  addProduct(productData: Omit<Product, 'id' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newProduct, ...products];
    this.saveProducts(updated);
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    this.saveProducts(products);
    return products[index];
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    this.saveProducts(filtered);
    return true;
  },

  // Quotes / Leads
  getQuotes(): QuoteRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
        return INITIAL_LEADS;
      }
      const parsed: QuoteRequest[] = JSON.parse(data);
      const sanitized = parsed.filter(q => !q.requirements.includes('Test Jig') && q.serviceType !== 'Tool Validation & Testing');
      return sanitized.length > 0 ? sanitized : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  },

  saveQuotes(quotes: QuoteRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(quotes));
    window.dispatchEvent(new CustomEvent('dy_data_updated', { detail: { type: 'quotes' } }));
  },

  addQuote(quoteData: Omit<QuoteRequest, 'id' | 'code' | 'createdAt' | 'status'>): QuoteRequest {
    const quotes = this.getQuotes();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newQuote: QuoteRequest = {
      ...quoteData,
      id: `lead-${Date.now()}`,
      code: `DY-REQ-${randomSuffix}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    const updated = [newQuote, ...quotes];
    this.saveQuotes(updated);
    return newQuote;
  },

  updateQuoteStatus(id: string, status: QuoteRequest['status'], internalNotes?: string): void {
    const quotes = this.getQuotes();
    const index = quotes.findIndex(q => q.id === id);
    if (index !== -1) {
      quotes[index].status = status;
      if (internalNotes !== undefined) {
        quotes[index].internalNotes = internalNotes;
      }
      this.saveQuotes(quotes);
    }
  },

  deleteQuote(id: string): void {
    const quotes = this.getQuotes();
    const filtered = quotes.filter(q => q.id !== id);
    this.saveQuotes(filtered);
  },

  // Settings
  getSettings(): CompanySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: CompanySettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('dy_data_updated', { detail: { type: 'settings' } }));
  },

  // Reset to initial sample state
  resetAllDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    window.dispatchEvent(new CustomEvent('dy_data_updated', { detail: { type: 'reset' } }));
  }
};
