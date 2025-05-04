import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check for saved user data on component mount
    const savedUser = localStorage.getItem('mathUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulated authentication - replace with actual API calls
      if (email && password) {
        // For demo purposes, create a mock user
        const mockUser = {
          id: '1',
          name: email.split('@')[0],
          email
        };
        
        setUser(mockUser);
        localStorage.setItem('mathUser', JSON.stringify(mockUser));
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulated registration - replace with actual API calls
      if (name && email && password) {
        const newUser = {
          id: Date.now().toString(),
          name,
          email
        };
        
        setUser(newUser);
        localStorage.setItem('mathUser', JSON.stringify(newUser));
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('mathUser');
    setIsAuthenticated(false);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};