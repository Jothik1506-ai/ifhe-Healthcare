import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BookQrScanner = ({ onBookNumberScanned }) => {
  const [scanError, setScanError] = useState(null);
  const scannerRef = useRef(null);
  const statusRef = useRef('IDLE'); // IDLE, STARTING, SCANNING, STOPPING
  const isMountedRef = useRef(true);

  // Generate a unique ID for this instance to prevent DOM conflicts
  const qrcodeRegionId = useRef(`qr-reader-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    isMountedRef.current = true;

    const initScanner = async () => {
      // Prevent multiple starts
      if (statusRef.current !== 'IDLE') return;

      statusRef.current = 'STARTING';

      // Explicitly request permission first to ensure the prompt appears
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        // Permission granted, stop this stream so Html5Qrcode can use it exclusively
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Permission denied or camera error:", err);
        statusRef.current = 'IDLE';
        if (isMountedRef.current) {
          setScanError("Camera permission is required. Please allow camera access in your browser settings.");
        }
        return;
      }

      const html5QrCode = new Html5Qrcode(qrcodeRegionId);
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
          },
          (decodedText) => {
            if (!isMountedRef.current) return;

            // Parsing logic
            let finalValue = decodedText.trim();
            try {
              // Try parsing as JSON
              const parsed = JSON.parse(finalValue);
              if (typeof parsed === 'object' && parsed !== null) {
                const keys = Object.keys(parsed);
                if (keys.length > 0) {
                  // Look for keys like 'bookNumber', 'id', 'val', or just take the first one
                  const targetKey = keys.find(k => /book|id|num|val/i.test(k)) || keys[0];
                  finalValue = String(parsed[targetKey]);
                }
              }
            } catch (e) {
              // Not JSON, check for "key: value" format (e.g. "BookNo: 123")
              if (finalValue.includes(':')) {
                const parts = finalValue.split(':');
                // Take the last part as the value
                if (parts.length >= 2) {
                  finalValue = parts[parts.length - 1].trim();
                }
              }
            }

            // Clean up any remaining quotes or brackets if parsing failed but it looked like JSON
            finalValue = finalValue.replace(/^["']|["']$/g, '');

            onBookNumberScanned(finalValue);
            // We do NOT call stopScanner() here explicitly to avoid race conditions.
            // The parent component should unmount this component, triggering cleanup.
          },
          (errorMessage) => {
            // ignore frame errors
          }
        );

        // Check if unmounted during start
        if (!isMountedRef.current) {
          statusRef.current = 'SCANNING'; // Mark as scanning so we can stop it
          stopScanner();
        } else {
          statusRef.current = 'SCANNING';
        }

      } catch (err) {
        console.error("Error starting scanner:", err);
        statusRef.current = 'IDLE';
        if (isMountedRef.current) {
          setScanError("Could not start camera. Please ensure you have given permission.");
        }
      }
    };

    const stopScanner = async () => {
      // Only stop if we are currently scanning
      if (statusRef.current !== 'SCANNING' || !scannerRef.current) return;

      statusRef.current = 'STOPPING';
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Failed to stop scanner", err);
      } finally {
        statusRef.current = 'IDLE';
        scannerRef.current = null;
      }
    };

    // Handle visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopScanner();
      }
    };

    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      stopScanner();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initialize immediately without delay to prompt permission ASAP
    initScanner();

    return () => {
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopScanner();
    };
  }, [onBookNumberScanned, qrcodeRegionId]);

  return (
    <div>
      <p>🔍 Scan the QR code on the book to auto-fill the Book Number.</p>
      {scanError && <p style={{ color: 'red' }}>{scanError}</p>}
      <div
        id={qrcodeRegionId}
        style={{
          width: '100%',
          maxWidth: '300px',
          margin: '10px auto',
          border: '1px solid #eee',
          borderRadius: '8px',
          overflow: 'hidden',
          minHeight: '300px' // Reserve space to reduce layout shift
        }}
      />
      <small style={{ display: 'block', textAlign: 'center', color: '#666', marginTop: '4px' }}>
        Camera access required. You can also type the number manually below.
      </small>
    </div>
  );
};

export default BookQrScanner;
