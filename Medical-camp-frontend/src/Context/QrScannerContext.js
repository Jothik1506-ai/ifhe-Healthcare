import React, { createContext, useContext, useState, useCallback } from 'react';
import BookQrScanner from '../Components/BookQrScanner'; // Reusing the BookQrScanner component

const QrScannerContext = createContext(null);

export const useQrScanner = () => {
  const context = useContext(QrScannerContext);
  if (!context) {
    throw new Error('useQrScanner must be used within a QrScannerProvider');
  }
  return context;
};

export const QrScannerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [onScanSuccessCallback, setOnScanSuccessCallback] = useState(null);

  const openScanner = useCallback((callback) => {
    setOnScanSuccessCallback(() => callback);
    setIsOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
    setOnScanSuccessCallback(null);
  }, []);

  const handleScanSuccess = useCallback((bookNumber) => {
    if (onScanSuccessCallback) {
      onScanSuccessCallback(bookNumber);
    }
    closeScanner();
  }, [onScanSuccessCallback, closeScanner]);

  const handleScanError = useCallback((error) => {
    console.error("Global QR Scan Error:", error);
    // Optionally provide more user-friendly error feedback here
    closeScanner();
  }, [closeScanner]);

  const value = React.useMemo(() => ({ openScanner, closeScanner }), [openScanner, closeScanner]);

  return (
    <QrScannerContext.Provider value={value}>
      {children}
      {isOpen && (
        <div className="global-qr-scanner-overlay">
          <div className="global-qr-scanner-modal">
            <button className="global-qr-scanner-close" onClick={closeScanner}>X</button>
            <BookQrScanner onBookNumberScanned={handleScanSuccess} />
          </div>
        </div>
      )}
    </QrScannerContext.Provider>
  );
};
