export type ProductCategory = 
  | 'Thiết kế PCB'
  | 'Gia công & PCBA'
  | 'Automation Tools';

export interface ProductSpec {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  status: 'Thương mại sẵn có' | 'Sản xuất theo đơn' | 'Sẵn sàng chuyển giao' | 'Dự án OEM/ODM';
  priceEstimate: string;
  shortDesc: string;
  fullDesc: string;
  specs: ProductSpec[];
  features: string[];
  imageUrl: string;
  updatedAt: string;
  featured?: boolean;
}

export type QuoteStatus = 'new' | 'reviewing' | 'quoted' | 'completed';

export interface AttachedFile {
  name: string;
  size: string;
  type: string;
}

export interface QuoteRequest {
  id: string;
  code: string;
  fullName: string;
  company: string;
  phone: string;
  email: string;
  serviceType: string;
  quantityEstimate: string;
  timeline: string;
  requirements: string;
  attachedFiles: AttachedFile[];
  status: QuoteStatus;
  createdAt: string;
  internalNotes?: string;
}

export interface CompanySettings {
  companyName: string;
  shortName: string;
  brandSlogan: string;
  hotline: string;
  technicalSupport: string;
  email: string;
  addressHanoi: string;
  addressHcm: string;
  workingHours: string;
  zaloUrl: string;
  techStandards: string;
  taxCode: string;
}
