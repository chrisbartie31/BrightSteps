// expo_app/contexts/ChildContext.js
import React, { createContext, useContext, useState } from 'react';

const ChildContext = createContext({
  selectedChild: null,
  selectChild: () => {}
});

export function ChildProvider({ children }) {
  const [selectedChild, setSelectedChild] = useState(null);

  function selectChild(child) {
    // child is either null or { id, name }
    setSelectedChild(child || null);
  }

  return (
    <ChildContext.Provider value={{ selectedChild, selectChild }}>
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  return useContext(ChildContext);
}
