import React from 'react';
import { Navbar } from './components/layout/Navbar';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentPatientId={101} onSelectPatient={() => {}} onOpenConsentQR={() => {}} />
      <main className="p-6">
        <h2 className="text-xl font-bold">MedThread 3-Panel Cockpit</h2>
      </main>
    </div>
  );
}
