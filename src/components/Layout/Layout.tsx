import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const { settings } = useSettings();
  const location = useLocation();
  
  const fontSizeClass = 
    settings.fontSize === 'small' ? 'text-sm' :
    settings.fontSize === 'large' ? 'text-lg' :
    'text-base';
  
  const showWarning = location.pathname === '/soon';
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col ${fontSizeClass}`}>
      <Navbar />
      {showWarning && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 p-4">
          <div className="container mx-auto flex items-center justify-center text-sm text-amber-700 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 mr-2" />
            This module is currently under development and may contain bugs or incomplete features. Your feedback is appreciated!
          </div>
        </div>
      )}
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;