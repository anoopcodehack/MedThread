import React from 'react';
import { QrCode, Clock } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface NavbarProps {
  currentPatientId: number;
  onSelectPatient: (id: number) => void;
  onOpenConsentQR: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPatientId, onSelectPatient, onOpenConsentQR }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center space-x-3">
        <BrandLogo theme="dark" size="sm" showSubtitle />
      </div>

      <div className="flex items-center space-x-4">
        {/* Patient Selector */}
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <label className="text-xs font-semibold text-slate-600">Patient:</label>
          <select 
            value={currentPatientId} 
            onChange={(e) => onSelectPatient(Number(e.target.value))}
            className="bg-transparent text-sm font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value={101}>Patient 1: Rajesh Sharma (Master Demo)</option>
            <option value={102}>Patient 2: Priya Patel (Allergy Conflict)</option>
            <option value={103}>Patient 3: Vikram Malhotra (Cross-Border mmol/L)</option>
            <option value={104}>Patient 4: Mohammed Irfan (72h Duplicate)</option>
            <option value={105}>Patient 5: David Fernandes (Abstention Gate)</option>
          </select>
        </div>

        {/* Clinician Review Timer Counter */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold">
          <Clock className="h-4 w-4" />
          <span>Review Speed: 42s (-78%)</span>
        </div>

        {/* Temporary Consent Share Button */}
        <button 
          onClick={onOpenConsentQR}
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow"
        >
          <QrCode className="h-4 w-4" />
          <span>Share Consent QR</span>
        </button>
      </div>
    </header>
  );
};
