import React, { createContext, useState, useContext } from 'react';

const HelpContext = createContext();

export function HelpProvider({ children }) {
  const [helpMode, setHelpMode] = useState(false);
  const [helpElement, setHelpElement] = useState(null);

  const toggleHelpMode = () => {
    setHelpMode(!helpMode);
    if (!helpMode) {
      setHelpElement(null);
    }
  };

  const showHelp = (element) => {
    if (helpMode) {
      setHelpElement(element);
    }
  };

  const closeHelp = () => {
    setHelpElement(null);
  };

  return (
    <HelpContext.Provider value={{
      helpMode,
      toggleHelpMode,
      showHelp,
      helpElement,
      closeHelp
    }}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}