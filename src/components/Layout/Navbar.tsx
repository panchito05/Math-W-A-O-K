import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Settings, ChevronDown, Book, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileMenuOpen(false);
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Book className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">Math W+A+O+K</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                to="/" 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/soon" 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Soon
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/progress" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition-colors"
                >
                  My Progress
                </Link>
              )}
              <Link 
                to="/settings" 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Settings
              </Link>
            </div>

            <div className="ml-4 relative">
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="mr-2">{user?.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </div>
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/soon"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Soon
            </Link>
            {isAuthenticated && (
              <Link
                to="/progress"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                onClick={() => setIsMenuOpen(false)}
              >
                My Progress
              </Link>
            )}
            <Link
              to="/settings"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-700">
            {isAuthenticated ? (
              <div className="px-2 space-y-1">
                <div className="px-3 py-2 text-white font-medium">
                  {user?.name}
                </div>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;