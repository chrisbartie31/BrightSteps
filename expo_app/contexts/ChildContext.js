// expo_app/contexts/ChildContext.js
import React, { createContext, useState, useContext } from 'react';

// 1. Create the Context
const ChildContext = createContext();

// 2. Create the Provider Component
export function ChildProvider({ children }) {
  // State to hold the selected child's data
  const [selectedChild, setSelectedChild] = useState(null); // { id: string, name: string }

  const selectChild = (childData) => {
    // If null is passed, deselect (e.g., on sign-out)
    setSelectedChild(childData);
  };

  return (
    <ChildContext.Provider value={{ selectedChild, selectChild }}>
      {children}
    </ChildContext.Provider>
  );
}

// 3. Create a Custom Hook for easy consumption
export function useChild() {
  return useContext(ChildContext);
}