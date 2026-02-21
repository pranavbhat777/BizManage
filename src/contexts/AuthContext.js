import React, { createContext, useContext, useState } from 'react';

// Create a mock AuthContext for now since we're removing authentication
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user] = useState(null);
  const [business] = useState({
    id: 1,
    name: 'Test Business',
    email: 'test@business.com',
    phone: '+1234567890',
    address: 'Test Address'
  });

  const value = {
    user,
    business,
    login: () => {
      // Mock login function
      console.log('Mock login called');
    },
    logout: () => {
      // Mock logout function
      console.log('Mock logout called');
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
