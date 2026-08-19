import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '../context/StoreContext';
import { ToastContainer } from '../components/ui/Toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://planetacalcados4b.com.br'),
  title: 'Planeta Calçados QB — O Planeta aos seus pés | Loja em Quatro Barras - PR',
  description: 'Catálogo de calçados femininos, masculinos, roupas, acessórios e perfumes da Planeta Calçados QB em Quatro Barras - PR. Cotação rápida e atendimento via WhatsApp.',
  keywords: [
    'Planeta Calçados',
    'Planeta Calçados QB',
    'Quatro Barras PR',
    'Calçados Quatro Barras',
    'Sapatos',
    'Tênis',
    'Scarpin',
    'Vizzano',
    'Olympikus',
    'Ferracini',
    'Roupas',
    'Perfumes',
  ],
  authors: [{ name: 'Planeta Calçados QB' }],
  creator: 'Planeta Calçados QB',
  publisher: 'Planeta Calçados QB',
  alternates: {
    canonical: 'https://planetacalcados4b.com.br',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://planetacalcados4b.com.br',
    siteName: 'Planeta Calçados QB',
    title: 'Planeta Calçados QB — O Planeta aos seus pés',
    description: 'Sua loja de calçados, moda e acessórios em Quatro Barras - PR. As melhores marcas com atendimento direto via WhatsApp.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-brand-gold/30 selection:text-brand-dark">
        <StoreProvider>
          {children}
          <ToastContainer />
        </StoreProvider>
      </body>
    </html>
  );
}
