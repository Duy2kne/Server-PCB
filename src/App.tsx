/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, QuoteRequest, CompanySettings } from './types';
import { StorageService } from './services/storage';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { PortfolioSection } from './components/PortfolioSection';
import { WorkflowSection } from './components/WorkflowSection';
import { AboutSection } from './components/AboutSection';
import { QuoteSection } from './components/QuoteSection';
import { GerberViewer, SolderMaskColor, SurfaceFinish } from './components/gerber/GerberViewer';
import { GerberConfigData } from './components/QuoteSection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MessageSquare, ArrowUp, Phone } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'client' | 'admin'>('client');
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(StorageService.getSettings());
  
  // Interactive Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prefilledService, setPrefilledService] = useState<string | undefined>(undefined);
  const [prefilledProductName, setPrefilledProductName] = useState<string | undefined>(undefined);
  const [prefilledGerberConfig, setPrefilledGerberConfig] = useState<GerberConfigData | null>(null);

  // Load data & bind storage event bus
  const loadData = () => {
    setProducts(StorageService.getProducts());
    setQuotes(StorageService.getQuotes());
    setSettings(StorageService.getSettings());
  };

  useEffect(() => {
    loadData();

    // Check if initial URL contains /admin or #admin
    if (window.location.pathname.includes('/admin') || window.location.hash === '#admin') {
      setCurrentView('admin');
    }

    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('dy_data_updated', handleDataUpdate);
    return () => window.removeEventListener('dy_data_updated', handleDataUpdate);
  }, []);

  const handleNavigateSection = (sectionId: string) => {
    if (currentView === 'admin') {
      setCurrentView('client');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSelectServiceFromCard = (serviceName: string) => {
    setPrefilledService(serviceName);
    setPrefilledProductName(undefined);
    setPrefilledGerberConfig(null);
    handleNavigateSection('contact');
  };

  const handleQuickQuoteForProduct = (product: Product) => {
    setPrefilledService(product.category);
    setPrefilledProductName(product.title);
    setPrefilledGerberConfig(null);
    handleNavigateSection('contact');
  };

  const handleApplyGerberConfig = (config: GerberConfigData) => {
    setPrefilledGerberConfig(config);
    setPrefilledService('Gia công & PCBA');
    handleNavigateSection('contact');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-300">
      
      {currentView === 'client' ? (
        <>
          {/* Header */}
          <Header
            currentView={currentView}
            onNavigateView={setCurrentView}
            onNavigateSection={handleNavigateSection}
            settings={settings}
          />

          <main className="flex-1">
            {/* Hero Section */}
            <Hero
              onQuoteClick={() => handleNavigateSection('contact')}
              onExploreClick={() => handleNavigateSection('portfolio')}
              onGerberViewerClick={() => handleNavigateSection('gerber-viewer')}
            />

            {/* Core Services Section */}
            <ServicesSection
              onSelectService={handleSelectServiceFromCard}
            />

            {/* Product Portfolio & Projects Grid */}
            <PortfolioSection
              products={products}
              onViewProductDetail={(p) => setSelectedProduct(p)}
              onQuickQuote={handleQuickQuoteForProduct}
            />

            {/* Interactive Gerber 2D & DFM Viewer (JLCPCB-style) */}
            <GerberViewer
              onApplyToQuote={handleApplyGerberConfig}
            />

            {/* Engineering Workflow Methodology */}
            <WorkflowSection />

            {/* About DY AUTOMATION */}
            <AboutSection settings={settings} />

            {/* Quotation & Contact Form with Gerber upload */}
            <QuoteSection
              settings={settings}
              prefilledService={prefilledService}
              prefilledProductName={prefilledProductName}
              prefilledGerberConfig={prefilledGerberConfig}
              onOpenGerberViewer={() => handleNavigateSection('gerber-viewer')}
            />
          </main>

          {/* Footer */}
          <Footer
            settings={settings}
            onNavigateSection={handleNavigateSection}
            onOpenAdmin={() => setCurrentView('admin')}
          />

          {/* Product Detail Modal */}
          {selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onRequestQuoteForProduct={handleQuickQuoteForProduct}
            />
          )}

          {/* Floating Action Quick Contact Button */}
          <aside aria-label="Hỗ trợ nhanh" className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
            <a
              href={`tel:${settings.hotline.replace(/[^0-9]/g, '')}`}
              className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 rounded-full shadow-lg hover:shadow-cyan-500/20 transition-all group flex items-center gap-2"
              title="Gọi hotline kỹ thuật"
            >
              <Phone className="w-5 h-5" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-mono font-semibold whitespace-nowrap text-white pr-1">
                {settings.hotline}
              </span>
            </a>
          </aside>
        </>
      ) : (
        /* Admin Dashboard View */
        <AdminDashboard
          products={products}
          quotes={quotes}
          settings={settings}
          onNavigateClient={() => setCurrentView('client')}
          onRefreshData={loadData}
        />
      )}

    </div>
  );
}
