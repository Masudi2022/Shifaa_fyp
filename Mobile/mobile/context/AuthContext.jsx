import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@env';

export const AuthContext = createContext();
const baseUrl = BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔐 Login
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/login/`, { email, password });
      const { access, refresh, email: userEmail, role, full_name } = response.data;

      // Store tokens
      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);

      // Store user object + email separately for easy retrieval
      const userData = { email: userEmail, role, full_name };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('user_email', userEmail); // ✅ store email directly

      setUser(userData);
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🧾 Register
  const register = async ({ email, password, full_name, phone }) => {
    setIsLoading(true);
    try {
      await axios.post(`${baseUrl}/register/`, {
        email,
        password,
        full_name,
        phone,
        role: 'User',
      });
      await login(email, password); // auto-login
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 Logout
  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user', 'user_email']);
    setUser(null);
  };

  // 🔁 Load stored user
  const loadUser = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  // 🔄 Refresh token
  const refreshAccessToken = async () => {
    try {
      const refresh = await AsyncStorage.getItem('refresh_token');
      const response = await axios.post(`${baseUrl}/token/refresh/`, { refresh });
      await AsyncStorage.setItem('access_token', response.data.access);
      return response.data.access;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      logout();
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


