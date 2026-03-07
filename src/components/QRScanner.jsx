import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (err) => {
        // Ignoring frequent scan errors
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-white/5">
          <h3 className="font-bold text-white">Scan Location QR</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">✕</button>
        </div>
        <div id="qr-reader" className="w-full bg-black text-white p-4"></div>
        {error && <div className="p-4 text-center text-red-500 bg-red-500/10">{error}</div>}
      </div>
    </div>
  );
}
