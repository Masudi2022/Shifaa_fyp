// src/CartContext.js
import React, { createContext, useState, useEffect } from 'react';

// Create the Cart Context
export const CartContext = createContext();

// Create a Provider Component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Retrieve cart items from localStorage if available
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Update localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Function to add items to the cart
  const addToCart = (item) => {
    setCartItems((prevItems) => {
      // Check if the item already exists in the cart
      const existingItem = prevItems.find((i) => i.medicine_name === item.medicine_name);
      if (existingItem) {
        // Update the quantity if it exists
        return prevItems.map((i) =>
          i.medicine_name === item.medicine_name
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Add the new item to the cart
        return [...prevItems, item];
      }
    });
  };

  // Function to remove items from the cart
  const removeFromCart = (medicine_name) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.medicine_name !== medicine_name)
    );
  };

  // Function to clear the cart
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
