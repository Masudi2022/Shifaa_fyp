// context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const AuthContext = createContext();

import { BASE_URL } from '@env';
const baseUrl = BASE_URL;

// 🔐 AuthProvider Component

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔐 Login
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/login/`, { email, password });

      const { access, refresh, email: userEmail, role, full_name } = response.data;

      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);
      await AsyncStorage.setItem('user', JSON.stringify({ email: userEmail, role, full_name }));

      setUser({ email: userEmail, role, full_name });

    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🧾 Register (Always as User)
  const register = async ({ email, password, full_name, phone }) => {
    setIsLoading(true);
    try {
      await axios.post(`${baseUrl}/register/`, {
        email,
        password,
        full_name,
        phone,
        role: 'User', // ✅ force role as 'User'
      });

      // Auto login after registration
      await login(email, password);

    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 Logout
  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  // 🔁 Load stored user
  const loadUser = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  // 🔄 Optional: Refresh token
  const refreshAccessToken = async () => {
    try {
      const refresh = await AsyncStorage.getItem('refresh_token');
      const response = await axios.post(`${baseUrl}/token/refresh/`, { refresh });
      await AsyncStorage.setItem('access_token', response.data.access);
      return response.data.access;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      logout(); // force logout if refresh fails
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
