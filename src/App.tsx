/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  Battery, 
  Zap, 
  Wind, 
  ArrowRight, 
  Plus, 
  Trash2, 
  ChevronRight,
  Navigation,
  Coffee,
  Info,
  Smartphone,
  Save,
  Moon,
  Sun,
  AlertCircle,
  X
} from 'lucide-react';
import { TripPreferences, TripPlan, TravelPace } from './types.ts';
import { generateTripPlan, suggestReplanning } from './services/gemini.ts';

// --- Components ---

function Toast({ message, type, onClose }: { message: string, type: 'error' | 'info', onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl glass-morphism border shadow-2xl flex items-center gap-4 min-w-[320px] ${
        type === 'error' ? 'border-red-500/50' : 'border-brand-accent/50'
      }`}
    >
      <div className={`p-2 rounded-lg ${type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-brand-accent/10 text-brand-accent'}`}>
        {type === 'error' ? <AlertCircle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-white mb-0.5">{type === 'error' ? 'System Alert' : 'Notification'}</p>
        <p className="text-xs text-brand-muted">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
        <X className="h-4 w-4 text-brand-muted" />
      </button>
    </motion.div>
  );
}

function Header({ currentTrip }: { currentTrip: TripPlan | null }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-morphism h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Wind className="text-brand-accent h-6 w-6" />
        <span className="font-serif italic font-black text-lg tracking-tight">VEER</span>
      </div>
      {currentTrip && (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-brand-muted font-medium uppercase tracking-widest">
            <MapPin className="h-3 w-3" />
            {currentTrip.preferences.destination}
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-tighter text-brand-muted">Offline Mode</span>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      )}
    </header>
  );
}

// --- Views ---

function WelcomeView({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-xl mx-auto px-6 pt-32 pb-20 text-center"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/10 rounded-full mb-8">
        <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Beyond Recommendations</span>
      </div>
      <h1 className="font-serif text-6xl md:text-8xl italic mb-6 leading-none">
        Adaptive <br />
        <span className="text-brand-accent">Travel</span>
      </h1>
      <p className="text-brand-muted text-lg mb-12 max-w-sm mx-auto leading-relaxed">
        The planning engine that learns your pace and adapts to the world in real-time.
      </p>
      <button 
        onClick={onStart}
        className="group relative inline-flex items-center gap-4 bg-brand-text text-brand-bg px-8 py-4 rounded-full font-bold transition-all hover:pr-12"
      >
        <span>Plan Your Journey</span>
        <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all -translate-x-2 h-5 w-5 text-brand-accent" />
      </button>
    </motion.div>
  );
}

function ConfigView({ onGenerate }: { onGenerate: (prefs: TripPreferences) => void }) {
  const [prefs, setPrefs] = useState<TripPreferences>({
    destination: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    budget: 1000,
    currency: 'USD',
    interests: [],
    pace: TravelPace.MODERATE,
    constraints: []
  });

  const availableInterests = ["Local Food", "Art & History", "Nature", "Photography", "Shopping", "Adventure", "Nightlife"];

  const toggleInterest = (interest: string) => {
    setPrefs(p => ({
      ...p,
      interests: p.interests.includes(interest) 
        ? p.interests.filter(i => i !== interest) 
        : [...p.interests, interest]
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto px-6 pt-32 pb-20"
    >
      <div className="mb-12">
        <h2 className="text-4xl font-serif italic mb-2">Configure Engine</h2>
        <p className="text-brand-muted text-sm uppercase tracking-widest">Let AI solve the logistics</p>
      </div>

      <div className="space-y-12">
        {/* Destination */}
        <section>
          <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-4 font-bold">Destination</label>
          <input 
            type="text" 
            placeholder="e.g. Kyoto, Japan"
            className="w-full bg-transparent border-b border-white/20 pb-4 text-3xl font-light outline-none focus:border-brand-accent transition-colors"
            value={prefs.destination}
            onChange={e => setPrefs({...prefs, destination: e.target.value})}
          />
        </section>

        {/* Dates & Budget */}
        <div className="grid grid-cols-2 gap-8">
          <section>
            <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-4 font-bold">Trip Dates</label>
            <div className="flex items-center gap-4 bg-brand-card p-4 rounded-xl">
              <Calendar className="h-5 w-5 text-brand-muted" />
              <input 
                type="date"
                className="bg-transparent text-sm outline-none w-full"
                value={prefs.startDate}
                onChange={e => setPrefs({...prefs, startDate: e.target.value})}
              />
            </div>
          </section>
          <section>
            <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-4 font-bold">Budget</label>
            <div className="flex items-center gap-4 bg-brand-card p-4 rounded-xl">
              <span className="text-brand-muted font-bold">$</span>
              <input 
                type="number"
                className="bg-transparent text-sm outline-none w-full"
                value={prefs.budget}
                onChange={e => setPrefs({...prefs, budget: parseInt(e.target.value) || 0})}
              />
            </div>
          </section>
        </div>

        {/* Interests */}
        <section>
          <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-6 font-bold">Interests</label>
          <div className="flex flex-wrap gap-3">
            {availableInterests.map(interest => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-6 py-2 rounded-full border text-sm transition-all ${
                  prefs.interests.includes(interest)
                    ? "bg-brand-accent border-brand-accent text-white"
                    : "border-white/10 hover:border-white/40"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </section>

        {/* Pace */}
        <section>
          <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-6 font-bold">Travel Intensity</label>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(TravelPace).map(pace => (
              <button
                key={pace}
                onClick={() => setPrefs({...prefs, pace})}
                className={`p-6 rounded-2xl border text-left transition-all ${
                  prefs.pace === pace
                    ? "bg-brand-accent/10 border-brand-accent"
                    : "bg-brand-card border-transparent hover:border-white/10"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg mb-4 flex items-center justify-center ${prefs.pace === pace ? "bg-brand-accent text-white" : "bg-white/5 text-brand-muted"}`}>
                  {pace === TravelPace.RELAXED ? <Moon className="h-4 w-4" /> : pace === TravelPace.MODERATE ? <Wind className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                </div>
                <div className="font-bold text-sm capitalize">{pace}</div>
                <div className="text-[10px] opacity-50 mt-1 uppercase tracking-tighter">
                  {pace === TravelPace.RELAXED ? "Leisurely & Calm" : pace === TravelPace.MODERATE ? "Comfortable mix" : "High activity"}
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="pt-8">
          <button 
            disabled={!prefs.destination}
            onClick={() => onGenerate(prefs)}
            className="w-full bg-brand-text text-brand-bg py-5 rounded-2xl font-black text-lg uppercase tracking-widest disabled:opacity-20 transition-all active:scale-[0.98]"
          >
            Synthesize Trip
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingView() {
  const steps = [
    "Analyzing topography...",
    "Querying local hotspots...",
    "Optimizing commute sequences...",
    "Estimating energy depletion...",
    "Synthesizing modular blocks..."
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center flex-col bg-brand-bg px-6 text-center">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="mb-8"
      >
        <Sparkles className="h-12 w-12 text-brand-accent lg:h-16 lg:w-16" />
      </motion.div>
      <div className="h-10" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.p 
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-brand-muted text-sm uppercase tracking-[0.2em] font-medium"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

import { calculateEnergyDrain } from './utils';

function DashboardView({ trip, onBack }: { trip: TripPlan, onBack: () => void }) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [userEnergy, setUserEnergy] = useState(80);
  const [replanning, setReplanning] = useState(false);
  
  const activeDay = trip.days[activeDayIndex];

  // Energy Calculation Logic
  const energyDrain = useMemo(() => {
    return calculateEnergyDrain(activeDay.blocks);
  }, [activeDay]);

  const handleReplan = async (reason: string) => {
    setReplanning(true);
    try {
      await suggestReplanning(trip, userEnergy, reason);
      // In a real app we'd update the state with returned partial plan.
      // For MVP we'll just simulate a slight adjustment.
      setUserEnergy(Math.min(100, userEnergy + 10));
      setTimeout(() => setReplanning(false), 2000);
    } catch (e) {
      setReplanning(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-24 pb-32 px-6 max-w-4xl mx-auto"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-morphism p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center gap-2 text-brand-muted text-[10px] uppercase tracking-widest font-bold mb-4">
            <Battery className="h-3 w-3" />
            Human Vitality
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-serif italic text-brand-accent">{userEnergy}%</span>
            <span className="text-[10px] text-brand-muted mb-1 uppercase">Predicted Level</span>
          </div>
          <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${userEnergy}%` }}
              className={`h-full ${userEnergy > 70 ? "bg-green-500" : userEnergy > 30 ? "bg-brand-accent" : "bg-red-500"}`}
            />
          </div>
        </div>

        <div className="glass-morphism p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center gap-2 text-brand-muted text-[10px] uppercase tracking-widest font-bold mb-4">
            <Clock className="h-3 w-3" />
            Next Micro-Block
          </div>
          {activeDay.blocks[0] ? (
            <>
              <div className="font-bold text-lg leading-tight mb-1 truncate">{activeDay.blocks[0].title}</div>
              <div className="text-[10px] text-brand-muted uppercase tracking-widest">{activeDay.blocks[0].startTime} — {activeDay.blocks[0].location}</div>
            </>
          ) : (
             <div className="text-brand-muted italic">Clear schedule</div>
          )}
        </div>

        <div className="glass-morphism p-6 rounded-3xl bg-brand-accent/5">
          <div className="flex items-center gap-2 text-brand-accent text-[10px] uppercase tracking-widest font-bold mb-4">
            <Sparkles className="h-3 w-3" />
            AI Suggestion
          </div>
          <p className="text-xs leading-relaxed text-brand-text mb-3">
            Weather predicts light rain. Switch coffee stop to 2pm for better coverage.
          </p>
          <button 
            onClick={() => handleReplan("rain predicted")}
            className="text-[10px] font-bold uppercase tracking-widest underline decoration-brand-accent/30 hover:decoration-brand-accent transition-all"
          >
            {replanning ? "Recalculating..." : "Optimize Now"}
          </button>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 noscrollbar">
        {trip.days.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setActiveDayIndex(idx)}
            className={`flex-shrink-0 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              activeDayIndex === idx 
                ? "bg-brand-text text-brand-bg shadow-xl" 
                : "border border-white/10 text-brand-muted hover:border-white/30"
            }`}
          >
            Day {day.day}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative space-y-4">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-white/5" />
        
        {activeDay.blocks.map((block, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative pl-16 group"
          >
            {/* Timeline Node */}
            <div className={`absolute left-7 top-6 w-3 h-3 rounded-full border-2 border-brand-bg z-10 transition-colors ${
              block.type === 'activity' ? "bg-brand-accent" : 
              block.type === 'meal' ? "bg-green-500" :
              block.type === 'transit' ? "bg-blue-500" : "bg-brand-muted"
            }`} />
            
            <div className="glass-morphism p-6 rounded-2xl hover:bg-white/[0.08] transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">{block.startTime} — {block.endTime}</div>
                  <h3 className="text-xl font-bold font-sans tracking-tight">{block.title}</h3>
                </div>
                <div className={`p-2 rounded-lg ${
                  block.energyImpact < -10 ? "bg-red-500/10 text-red-400" :
                  block.energyImpact < 0 ? "bg-orange-500/10 text-orange-400" : 
                  "bg-green-500/10 text-green-400"
                }`}>
                   {block.energyImpact < 0 ? <Zap className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </div>
              </div>
              <p className="text-sm text-brand-muted leading-relaxed mb-4 max-w-lg">{block.description}</p>
              
              <div className="flex items-center gap-6 border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {block.location}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  {block.energyImpact} Vitality
                </div>
                <div className="flex items-center gap-2 ml-auto text-brand-text">
                  ${block.cost}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <button 
          onClick={onBack}
          className="text-brand-muted text-xs uppercase tracking-widest font-bold hover:text-brand-text transition-colors flex items-center gap-2 mx-auto"
        >
          <Plus className="h-4 w-4" />
          Plan New Experience
        </button>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [view, setView] = useState<'welcome' | 'config' | 'loading' | 'dashboard'>('welcome');
  const [currentTrip, setCurrentTrip] = useState<TripPlan | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'info' } | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('VEER_CURRENT_TRIP');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentTrip(parsed);
        setView('dashboard');
      } catch (e) {
        console.error("Failed to load saved trip");
        setToast({ message: "Cloud sync failed. Starting fresh.", type: 'info' });
      }
    }
  }, []);

  const handleGenerate = async (prefs: TripPreferences) => {
    setView('loading');
    try {
      const plan = await generateTripPlan(prefs);
      setCurrentTrip(plan);
      localStorage.setItem('VEER_CURRENT_TRIP', JSON.stringify(plan));
      setView('dashboard');
      setToast({ message: "Itinerary synthesized successfully.", type: 'info' });
    } catch (e: any) {
      let errorMessage = "Optimization engine failed to respond.";
      
      if (e.message === "SAFETY_REJECTED") {
        errorMessage = "Content flagged by safety filters. Try a different request.";
      } else if (e.message === "QUOTA_EXCEEDED") {
        errorMessage = "Daily generation quota reached. Try again later.";
      } else if (e.message === "EMPTY_RESPONSE") {
        errorMessage = "Engine returned an empty response. Let's retry.";
      }

      setToast({ message: errorMessage, type: 'error' });
      setView('config');
    }
  };

  const handleNewTrip = () => {
    localStorage.removeItem('VEER_CURRENT_TRIP');
    setCurrentTrip(null);
    setView('config');
    setToast({ message: "Engine reset. Awaiting new coordinates.", type: 'info' });
  };

  return (
    <div className="min-h-screen selection:bg-brand-accent selection:text-white">
      <Header currentTrip={currentTrip} />
      
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
      
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {view === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WelcomeView onStart={() => setView('config')} />
            </motion.div>
          )}

          {view === 'config' && (
            <motion.div 
              key="config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ConfigView onGenerate={handleGenerate} />
            </motion.div>
          )}

          {view === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingView />
            </motion.div>
          )}

          {view === 'dashboard' && currentTrip && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DashboardView trip={currentTrip} onBack={handleNewTrip} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-6 flex justify-center z-50">
        <div className="glass-morphism px-8 py-3 rounded-full flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-brand-muted">
          <div className="flex items-center gap-2 text-brand-text">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Engine Ready
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div>V1.0.4 Pre-Alpha</div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <Smartphone className="h-3 w-3" />
            8.4 MB
          </div>
        </div>
      </footer>
    </div>
  );
}

