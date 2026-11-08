import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CompareFloatingBar from '../common/CompareFloatingBar';
import AiShoppingAssistantWidget from '../../features/ai-assistant/components/AiShoppingAssistantWidget';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CompareFloatingBar />
      <AiShoppingAssistantWidget />
    </div>
  );
};

export default MainLayout;
