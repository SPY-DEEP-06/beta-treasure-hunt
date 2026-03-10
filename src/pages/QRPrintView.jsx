import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { eventLocations } from '../data/clues';
import AdminLogin from './AdminLogin';

export default function QRPrintView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="bg-white min-h-screen text-black p-8">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <h1 className="text-3xl font-bold">Location QR Codes</h1>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow-lg"
        >
          Print QRs
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 print:grid-cols-2">
        {eventLocations.map(loc => (
          <div key={loc.id} className="border-4 border-black p-6 flex flex-col items-center text-center break-inside-avoid shadow-sm rounded-xl">
            <h2 className="text-2xl font-black mb-2 uppercase">Beta Hunt</h2>
            <p className="text-sm font-bold mb-4 bg-black text-white px-3 py-1 rounded w-full">Location {loc.id}</p>
            <QRCode
              value={JSON.stringify({ locationId: loc.id })}
              size={180}
              level="H"
            />
            <p className="mt-4 text-xs font-mono">{loc.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
