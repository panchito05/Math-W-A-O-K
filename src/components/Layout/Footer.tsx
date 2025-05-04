import React from 'react';
import { Book, Github, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-indigo-700 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Book className="h-6 w-6 mr-2" />
            <span className="font-bold text-lg">Math W+A+O+K</span>
          </div>
          <div className="flex space-x-8">
            <div>
              <h4 className="font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-1">
                <li><a href="/" className="hover:text-indigo-200 transition-colors">Home</a></li>
                <li><a href="/settings" className="hover:text-indigo-200 transition-colors">Settings</a></li>
                <li><a href="/progress" className="hover:text-indigo-200 transition-colors">My Progress</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Resources</h4>
              <ul className="space-y-1">
                <li><a href="#" className="hover:text-indigo-200 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-200 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-200 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-4">
              <a href="#" className="hover:text-indigo-200 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="hover:text-indigo-200 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-indigo-200 text-sm">
          &copy; {new Date().getFullYear()} Math W+A+O+K. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;