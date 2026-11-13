import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Star,
  ArrowUpRight,
  ShieldCheck,
  Pill,
  FlaskConical,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Award,
  RefreshCw,
  FileText,
  Activity
} from "lucide-react";
import { SplashLoader } from "../components/common/SplashLoader";
import { BrandLogo } from "../components/common/BrandLogo";

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#A3C4AE] selection:text-[#0A2A18]">
      {/* Pure Logo Drop Splash Loader (Fast & Snappy 600ms) */}
      {showSplash && (
        <SplashLoader onComplete={() => setShowSplash(false)} durationMs={600} />
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Exact VYORA Aesthetic: Mist Green Hills & Floating Bottle) */}
      {/* ========================================================================= */}
      <section className="relative min-h-[92vh] bg-gradient-to-b from-[#8AAFA2] via-[#9ABCAE] to-[#B3CFBF] overflow-hidden text-white flex flex-col justify-between">
        
        {/* Soft atmospheric morning mist & hills backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top soft clouds */}
          <div className="absolute -top-12 -left-20 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute top-20 -right-20 w-[500px] h-[500px] bg-white/25 rounded-full blur-3xl" />
          
          {/* Subtle rolling hills curves at the bottom */}
          <div className="absolute -bottom-24 left-0 right-0 h-64 bg-gradient-to-t from-[#6D9585]/40 via-[#82A898]/20 to-transparent blur-2xl" />
        </div>

        {/* Top VYORA Style Navbar */}
        <header className="relative z-30 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <BrandLogo theme="light" size="md" />
            </Link>
          </div>

          {/* Navigation Links - MedThread Product Focus */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider text-white/90 uppercase">
            <Link to="/" className="text-white border-b-2 border-white pb-0.5">
              Home
            </Link>
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition">
              How It Works
            </a>
            <a href="#essentials" className="hover:text-white transition">
              Health Essentials
            </a>
            <a href="#security" className="hover:text-white transition">
              Security
            </a>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
          </nav>

          {/* Right Icons & Sign Up / Login */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSplash(true)}
              className="text-white/80 hover:text-white transition p-1.5"
              title="Replay Logo Intro"
            >
              <RefreshCw size={16} />
            </button>

            <Link
              to="/login"
              className="text-white/90 hover:text-white transition p-1.5 flex items-center gap-1 text-xs font-semibold"
              title="Login"
            >
              <User size={18} />
              <span className="hidden sm:inline">Login</span>
            </Link>

            <Link
              to="/auth"
              className="bg-[#0A2A18] hover:bg-[#124227] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 uppercase tracking-wider"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Content Area */}
        <div className="relative z-20 max-w-7xl w-full mx-auto px-6 pt-4 pb-16 flex-1 flex flex-col justify-center">
          
          {/* Top Text Grid: Left Heading, Center Paragraph & Button, Right Heading */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Top Left: FEEL SECURE & Rating */}
            <div className="md:col-span-4">
              <h1 className="font-heading font-black text-6xl sm:text-7xl lg:text-8xl tracking-tight text-white uppercase leading-[0.9]">
                FEEL SECURE
              </h1>

              <div className="mt-5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                  <span>Reviewed on</span>
                  <div className="flex text-white text-xs">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                  </div>
                </div>
                <div className="font-heading font-bold text-sm text-white tracking-wide">
                  Clinical Safety 5.0 Rating
                </div>
              </div>
            </div>

            {/* Top Center: Clean Paragraph & Circular Action Button */}
            <div className="md:col-span-4 text-center flex flex-col items-center pt-2">
              <p className="text-xs text-white/95 max-w-xs leading-relaxed font-medium">
                Clean, science-backed medical intelligence designed to unify your prescriptions, lab reports, and doctor visits into one verified timeline.
              </p>

              {/* Floating Circular Button (Exact VYORA Shop Now circle with arrow) */}
              <Link
                to="/auth"
                className="mt-6 group flex flex-col items-center justify-center h-20 w-20 rounded-full bg-[#0A2A18] hover:bg-[#14482B] text-white shadow-2xl transition-all transform hover:scale-110"
              >
                <ArrowUpRight size={22} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Start Now
                </span>
              </Link>
            </div>

            {/* Top Right: CARE EXCELLENT */}
            <div className="md:col-span-4 text-left md:text-right">
              <h2 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight text-white/95 uppercase leading-[0.95]">
                CARE
                <br />
                EXCELLENT
              </h2>
            </div>
          </div>

          {/* Centerpiece Visual: Floating Luxury Supplement / Intelligence Bottle (UNTOUCHED AS REQUESTED) */}
          <div className="relative mt-8 sm:mt-12 flex items-center justify-center">
            
            {/* Floating Info Pill on the Left */}
            <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-3.5 shadow-lg max-w-[200px] text-left">
              <div>
                <div className="text-[11px] font-bold text-white leading-tight">
                  Daily Health Support
                </div>
                <div className="text-[10px] text-white/80 mt-0.5">
                  Unified history &amp; prescription formula
                </div>
              </div>
            </div>

            {/* Realistic Luxury Bottle Mockup Container (UNTOUCHED) */}
            <div className="relative group cursor-pointer transition-transform duration-500 hover:scale-[1.02]">
              {/* Subtle bottle ambient glow */}
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-3xl transform scale-90" />

              {/* Angled Matte Dark Bottle (CSS 3D Styled) */}
              <div className="relative z-10 w-64 sm:w-72 h-[340px] sm:h-[380px] bg-gradient-to-r from-[#17221C] via-[#2A372E] to-[#141E18] rounded-[48px] shadow-2xl border border-white/10 p-6 flex flex-col justify-between text-center overflow-hidden transform -rotate-3">
                
                {/* Specular bottle light reflection line */}
                <div className="absolute top-0 bottom-0 left-6 w-8 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                {/* Bronze Metallic Screw Cap */}
                <div className="mx-auto w-36 h-12 bg-gradient-to-b from-[#8C7456] via-[#BFA47E] to-[#705A3D] rounded-t-2xl shadow-inner border-t border-white/20" />

                {/* Bottle Label Area */}
                <div className="py-8 px-2 flex flex-col items-center">
                  <span className="font-heading font-black tracking-[4px] text-xl text-white uppercase">
                    MEDTHREAD
                  </span>
                  <span className="text-[9px] tracking-[2px] text-white/70 uppercase mt-1">
                    DAILY HEALTH INTELLIGENCE
                  </span>

                  <div className="my-6 w-12 h-0.5 bg-white/20" />

                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    DAILY MULTIVITAMIN
                  </span>
                  <span className="text-[8px] text-white/60 tracking-widest uppercase mt-0.5">
                    ENERGY • IMMUNITY • CLARITY
                  </span>
                </div>

                {/* Bottom Bottle Base */}
                <div className="text-[8px] tracking-widest text-white/40 uppercase pb-2">
                  100% CLINICAL VERIFIED • 60 CAPSULES
                </div>
              </div>

              {/* Scattered Floating Medical Capsules (Emerald & Bronze Pills) */}
              <div className="absolute -left-6 bottom-10 w-12 h-6 rounded-full bg-gradient-to-r from-[#205C38] to-[#123822] shadow-xl border border-white/20 transform -rotate-45" />
              <div className="absolute -left-12 bottom-20 w-12 h-6 rounded-full bg-gradient-to-r from-[#A86F4C] to-[#6E4228] shadow-xl border border-white/20 transform rotate-12" />
              <div className="absolute right-4 top-12 w-10 h-5 rounded-full bg-gradient-to-r from-[#205C38] to-[#123822] shadow-xl border border-white/20 transform rotate-45" />
              <div className="absolute -right-8 bottom-16 w-12 h-6 rounded-full bg-gradient-to-r from-[#2A6B42] to-[#123822] shadow-xl border border-white/20 transform -rotate-12" />
              <div className="absolute -right-12 bottom-28 w-11 h-5 rounded-full bg-gradient-to-r from-[#B57C58] to-[#6E4228] shadow-xl border border-white/20 transform rotate-24" />
            </div>

            {/* Floating Award Seal on the Right */}
            <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-3.5 shadow-lg max-w-[200px] text-left items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-full text-white">
                <Award size={18} />
              </div>
              <div className="text-[10px] font-bold text-white uppercase tracking-wider leading-tight">
                AWARDED BY THE WORLD HEALTH INFORMATICS
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CLEAN WHITE SECTION: 3 CORE PRODUCT PILLARS (MedThread Technology) */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Top Row: Big Left-Aligned Heading & Right "Explore Platform" Pill Button */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-16 border-b border-slate-100">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 max-w-2xl leading-tight">
              Clean, science-backed medical intelligence designed to support your care, recovery, focus, and everyday wellness —without the unnecessary paperwork.
            </h2>

            <Link
              to="/auth"
              className="bg-[#0A2A18] hover:bg-[#124227] text-white text-xs font-bold px-6 py-2.5 rounded-full transition-all self-start md:self-auto uppercase tracking-wider"
            >
              Explore Platform
            </Link>
          </div>

          {/* 3-Column Minimalist Line-Art Features (MedThread Focus) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16">
            {/* Feature 1: Unified Timeline */}
            <div>
              <div className="h-12 w-12 rounded-2xl bg-[#F0F5F2] text-[#0A2A18] flex items-center justify-center mb-6">
                <Pill size={24} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">
                Unified Timeline
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Thoughtfully organized health history. Complete chronological record of all your prescriptions, consultations, and hospital visits without stale discontinued drugs.
              </p>
            </div>

            {/* Feature 2: Prescription Safety */}
            <div>
              <div className="h-12 w-12 rounded-2xl bg-[#F0F5F2] text-[#0A2A18] flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">
                Prescription Safety
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Every medication lifecycle is tracked: started, titrated, held, and stopped. Automatically catches conflicting drugs, duplicate tests, and historical allergy gaps.
              </p>
            </div>

            {/* Feature 3: Science-Backed Evidence */}
            <div>
              <div className="h-12 w-12 rounded-2xl bg-[#F0F5F2] text-[#0A2A18] flex items-center justify-center mb-6">
                <FlaskConical size={24} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">
                100% Verifiable Evidence
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Formulated around clinical informatics standards. Every finding, allergy, and lab result links directly to its original source document with zero math drift.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 HOW IT WORKS: 4-STEP EVIDENCE SYNTHESIS ENGINE */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 bg-[#F8FAF9] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A2A18] bg-emerald-100/80 px-3.5 py-1 rounded-full border border-emerald-200">
              Architecture &amp; Flow
            </span>
            <h2 className="mt-4 font-heading font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              HOW MEDTHREAD WORKS
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              From disparate hospital documents to an actionable, verified chronological clinical history in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <span className="font-heading font-black text-2xl text-emerald-800">01</span>
              <h3 className="font-heading font-bold text-slate-900 text-base mt-3 mb-2">Ingest Records</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload discharge summaries, outpatient notes, and lab PDFs. Optical scan support parses multi-format clinical files securely.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <span className="font-heading font-black text-2xl text-emerald-800">02</span>
              <h3 className="font-heading font-bold text-slate-900 text-base mt-3 mb-2">Harmonize &amp; Reconcile</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standardize clinical units (e.g. mmol/L to mg/dL) with zero rounding error. Flags conflicting medications and duplicate lab tests automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <span className="font-heading font-black text-2xl text-emerald-800">03</span>
              <h3 className="font-heading font-bold text-slate-900 text-base mt-3 mb-2">Verifiable Citations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every medication, allergy, and test result links directly to its source document page and bounding box for complete clinician auditability.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <span className="font-heading font-black text-2xl text-emerald-800">04</span>
              <h3 className="font-heading font-bold text-slate-900 text-base mt-3 mb-2">Unified Care Access</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Doctors review records in 30 seconds via the Clinical Cockpit. Patients manage their lifetime health journey with self-sovereign control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ESSENTIALS & CLINICAL PREVIEW (MedThread Health Essentials) */}
      {/* ========================================================================= */}
      <section id="essentials" className="py-20 bg-[#F4F7F4] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A2A18] bg-emerald-100 px-3 py-1 rounded-full">
              Your Health Routine
            </span>
            <h2 className="mt-3 font-heading font-bold text-3xl text-slate-900">
              Your Health Essentials
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Simple formulas. Purposeful health record synthesis.
            </p>
          </div>

          {/* Product Cards Row - MedThread Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            {/* Card 1: Prescription Timeline */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm hover:shadow-md transition">
              <div className="h-28 flex items-center justify-center">
                <div className="w-16 h-8 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] shadow-lg transform rotate-12 flex items-center justify-center text-white">
                  <Pill size={16} />
                </div>
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-sm mt-3">Prescription Timeline</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Track every active medication, dosage titration, and held drug across doctors without confusing past medications as active.
              </p>
            </div>

            {/* Card 2: Laboratory Panels */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm hover:shadow-md transition">
              <div className="h-28 flex items-center justify-center">
                <div className="w-16 h-8 rounded-full bg-gradient-to-r from-[#B87333] to-[#7A3E1D] shadow-lg transform -rotate-12 flex items-center justify-center text-white">
                  <Activity size={16} />
                </div>
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-sm mt-3">Laboratory Panels</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Automated unit conversions for Glucose, Cholesterol, and Renal markers (mmol/L to mg/dL) with zero rounding drift.
              </p>
            </div>

            {/* Card 3: Care Summaries */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm hover:shadow-md transition">
              <div className="h-28 flex items-center justify-center">
                <div className="w-16 h-8 rounded-full bg-gradient-to-r from-[#5B3A70] to-[#2D163D] shadow-lg transform rotate-6 flex items-center justify-center text-white">
                  <FileText size={16} />
                </div>
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-sm mt-3">Care Summaries</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Unified discharge summaries and specialist consultation notes linked with page-level verifiable citations.
              </p>
            </div>
          </div>

          {/* Testimonial & Clinician Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
            {/* Clinician Gauge Box */}
            <div className="lg:col-span-5 bg-[#F4F7F4] p-6 rounded-2xl flex items-center gap-6">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=160&auto=format&fit=crop&q=80"
                alt="Doctor"
                className="h-20 w-20 rounded-full object-cover border-2 border-emerald-600 shadow"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-2xl text-slate-900">85%</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    -42% Time
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">Faster Consultations</div>
                <div className="text-[10px] text-slate-500">Verified across primary care clinics</div>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="lg:col-span-7">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A2A18] block mb-2">
                CLINICIAN TESTIMONIAL
              </span>
              <p className="text-sm sm:text-base font-medium text-slate-700 leading-relaxed italic">
                "I've been really happy with the quality and overall experience. The medical records were clear, the organization was simple, and everything my team needed was verified with instant source evidence."
              </p>
              <div className="mt-4 font-heading font-bold text-xs text-slate-900">
                Dr. Sarah Mitchell • Chief of Internal Medicine
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3.5 FAQ: FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A2A18] bg-emerald-100/80 px-3.5 py-1 rounded-full border border-emerald-200">
              Questions &amp; Answers
            </span>
            <h2 className="mt-4 font-heading font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Everything you need to know about MedThread's clinical data engine.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#F8FAF9] p-6 rounded-2xl border border-slate-200">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                What makes MedThread different from standard EHR portals?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Traditional portals keep data fragmented in separate hospital silos. MedThread unifies medical history across all encounters, providers, and lab facilities into a single verified timeline with zero duplicate clutter and exact source document citations.
              </p>
            </div>

            <div className="bg-[#F8FAF9] p-6 rounded-2xl border border-slate-200">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                How does MedThread prevent prescription contradictions?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                MedThread tracks the complete medication lifecycle: started, titrated, held, or stopped. When two providers prescribe contradictory treatments or repeat identical diagnostic tests, MedThread flags the conflict with side-by-side evidence inspection.
              </p>
            </div>

            <div className="bg-[#F8FAF9] p-6 rounded-2xl border border-slate-200">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Are laboratory unit measurements standardized?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Yes. Lab results across different hospital networks often use varied units (e.g. mmol/L vs mg/dL). MedThread normalizes units mathematically according to clinical standards with zero rounding drift, preserving original reported values alongside converted figures.
              </p>
            </div>

            <div className="bg-[#F8FAF9] p-6 rounded-2xl border border-slate-200">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                How is patient privacy protected?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                MedThread adheres to strict HIPAA and zero-knowledge encryption principles. Doctors can only view records after cryptographic patient consent or authenticated QR verification, maintaining an immutable access audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DARK FOREST CTA & FOOTER (Exact Bottom-Right Section from Image 1) */}
      {/* ========================================================================= */}
      <footer id="security" className="bg-gradient-to-b from-[#0B2818] via-[#082214] to-[#04140B] text-white pt-24 pb-16 overflow-hidden relative">
        
        {/* Soft Ambient Light Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          {/* Big CTA Headline */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-white leading-tight">
              READY TO FEEL IN CONTROL OF YOUR HEALTH EVERY DAY?
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-white/80 max-w-md mx-auto leading-relaxed">
              Join thousands who trust MedThread for clean, science-backed daily health intelligence —without the paperwork.
            </p>

            {/* Dual Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/auth"
                className="bg-white hover:bg-slate-100 text-[#0A2A18] text-xs font-bold px-7 py-3 rounded-full shadow-xl transition uppercase tracking-wider"
              >
                Get Started Free
              </Link>

              <Link
                to="/login"
                className="border border-white/40 hover:bg-white/10 text-white text-xs font-bold px-7 py-3 rounded-full transition uppercase tracking-wider"
              >
                Provider Login
              </Link>
            </div>
          </div>

          {/* Newsletter / Stay Updated Bar (From Image 1) */}
          <div className="py-12 border-t border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="font-heading font-bold text-xs uppercase tracking-widest text-white block">
                SUBSCRIBE TO UPDATES
              </span>
              <span className="text-[11px] text-white/60">
                Receive health insights, platform updates and clinical guides.
              </span>
            </div>

            <div className="flex w-full md:w-auto max-w-md items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border border-white/20 text-xs px-4 py-2.5 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 flex-1 md:w-64"
              />
              <button
                type="button"
                className="bg-white text-[#0A2A18] text-xs font-bold px-5 py-2.5 rounded-full hover:bg-slate-100 transition whitespace-nowrap uppercase tracking-wider"
              >
                Subscribe
              </button>
            </div>
          </div>

          {/* Navigation Links Columns (From Image 1) */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            {/* Col 1 */}
            <div>
              <div className="mb-3">
                <BrandLogo theme="light" size="sm" />
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Clean, science-backed medical intelligence designed for everyday wellness and verifiable health history.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-3">
                PLATFORM
              </h4>
              <ul className="space-y-2 text-white/60">
                <li>Unified Timeline</li>
                <li>Prescription Safety</li>
                <li>Laboratory Panels</li>
                <li>Verifiable Citations</li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-3">
                ACCESS &amp; PORTALS
              </h4>
              <ul className="space-y-2 text-white/60">
                <li><Link to="/auth" className="hover:text-white">Create Account</Link></li>
                <li><Link to="/login" className="hover:text-white">Provider Sign In</Link></li>
                <li><Link to="/doctor/dashboard" className="hover:text-white">Clinical Cockpit</Link></li>
                <li><Link to="/patient" className="hover:text-white">Patient Portal</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-3">
                SECURITY &amp; COMPLIANCE
              </h4>
              <ul className="space-y-2 text-white/60">
                <li>HIPAA Aligned</li>
                <li>SOC-2 Ready</li>
                <li>Encrypted Storage</li>
                <li>Immutable Audit Trail</li>
              </ul>
              <div className="flex items-center gap-3 text-white/80 mt-4">
                <a href="#instagram" className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <Instagram size={13} />
                </a>
                <a href="#twitter" className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <Twitter size={13} />
                </a>
                <a href="#linkedin" className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <Linkedin size={13} />
                </a>
                <a href="#facebook" className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <Facebook size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-[10px] text-white/40">
            © 2026 MedThread Health Technologies, Inc. All rights reserved.
          </div>

        </div>
      </footer>
    </div>
  );
}
