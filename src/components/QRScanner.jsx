import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
      { facingMode: "environment" }, // Instantly target the rear camera
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        // On Success
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        }).catch(console.error);
      },
      (errorMessage) => {
        // Ignore constant scanning errors (e.g. when nothing is in frame)
      }
    ).catch((err) => {
      console.error(err);
      setError("Please grant camera permissions to scan clues.");
    });

    return () => {
      try {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(() => {});
        }
      } catch (e) {}
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-white/5">
          <h3 className="font-bold text-white">Scan Location QR</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">✕</button>
        </div>
        
        {/* The scanner will mount the video feed directly into this div without any extra UI buttons */}
        <div className="relative bg-black w-full min-h-[300px] flex items-center justify-center">
          {error && (
             <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10 bg-slate-900/90">
                <p className="text-red-400 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>
             </div>
          )}
          <div id="qr-reader" className="w-full h-full"></div>
        </div>
        
      </div>
    </div>
  );
}
