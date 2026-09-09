import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassBlogCard } from '@/components/ui/glass-blog-card-shadcnui';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';
import { BookOpen, Plus, Settings, LogOut, Copy, Check, Search, Mic, Square, X, Key, ShieldCheck, LayoutGrid, List, Sun, Moon } from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  promoCode: string;
}

interface Entry {
  id: string;
  title: string;
  body: string;
  mood?: string;
  tags?: string[];
  entry_date: string;
  created_at: string;
  audio_count: number;
  audio?: any[];
}

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "/profile-avatar.jpg",
    name: "Aira",
    handle: "@aira_reflections",
    text: "Dear Diary is seamless! The mobile voice journal and privacy protection are exceptional."
  },
  {
    avatarSrc: "/profile-avatar.jpg",
    name: "Elena Rostova",
    handle: "@elena_writes",
    text: "The clean layout and beach theme have made journaling a daily joy."
  },
  {
    avatarSrc: "/profile-avatar.jpg",
    name: "Maya Lin",
    handle: "@maya_thoughts",
    text: "End-to-end privacy with zero clutter. Exactly what a personal diary should be."
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeNav, setActiveNav] = useState<'journal' | 'settings'>('journal');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const authModeRef = useRef(authMode);
  useEffect(() => {
    authModeRef.current = authMode;
  }, [authMode]);

  const [googleRegData, setGoogleRegData] = useState<{email: string, displayName: string} | null>(null);
  
  // Data State & Theme State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Feed & Entries State
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Editor Form State
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newMood, setNewMood] = useState('Calm');
  const [newTags, setNewTags] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/auth/session');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      // Unauthenticated
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, activeNav, searchQuery]);

  const filteredEntries = entries.filter(entry => {
    if (dateFilter && entry.entry_date !== dateFilter) {
      return false;
    }
    return true;
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/entries?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;
    const promoCode = formData.get('promoCode') as string;

    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const payload = authMode === 'login' 
      ? { email, password } 
      : { email, password, displayName, promoCode };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        alert(data.error || 'Authentication failed.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  // Google Auth - handles the real ID token from GSI
  const handleGoogleCredential = async (credential: string) => {
    if (authModeRef.current === 'register') {
      try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        setGoogleRegData({ 
          email: payload.email, 
          displayName: payload.name || payload.given_name || payload.email.split('@')[0] 
        });
      } catch (e) {
        alert('Failed to parse Google profile. Please try again.');
      }
      return;
    }

    try {
      const res = await fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, isRegistering: false })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        alert(data.error || 'Google Sign-In failed.');
      }
    } catch (e) {
      alert('Network error during Google Sign-In.');
    }
  };

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const copyPromoCode = () => {
    if (user?.promoCode) {
      navigator.clipboard.writeText(user.promoCode);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordTimer(0);
    } catch (e) {
      alert('Microphone access is required for audio recording.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => setRecordTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          body: newBody,
          mood: newMood,
          tags: newTags,
          entryDate: newDate
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');
        formData.append('duration', recordTimer.toString());
        await fetch(`/entries/${data.entry.id}/audio`, { method: 'POST', body: formData });
      }

      setIsEditorOpen(false);
      setNewTitle('');
      setNewBody('');
      setAudioBlob(null);
      fetchEntries();
    } catch (err: any) {
      alert(err.message || 'Failed to save entry.');
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetch(`/entries/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEntry(data.entry);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!user) {
    return (
      <div className="relative">
        <SignInPage
          title={authMode === 'login' ? 'Sign In to Dear Diary' : 'Create Your Diary Account'}
          description={authMode === 'login' ? 'Access your private journal and voice entries.' : 'Start your private digital journal today.'}
          heroImageSrc="/beach-sunset.jpg"
          testimonials={sampleTestimonials}
          onSignIn={handleSignInForm}
          onGoogleCredential={handleGoogleCredential}
          googleClientId={(import.meta as any).env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id'}
          isRegistering={authMode === 'register'}
          onCreateAccount={() => {
            setAuthMode(authMode === 'login' ? 'register' : 'login');
            setGoogleRegData(null);
          }}
          onResetPassword={() => alert("Password reset link request sent.")}
          googleRegData={googleRegData}
          onClearGoogleReg={() => setGoogleRegData(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center transition-colors duration-200">
      <div className="w-full max-w-md md:max-w-3xl min-h-screen flex flex-col border-x border-border bg-background relative pb-24 shadow-sm">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Dear Diary</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-full hover:bg-secondary text-foreground transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Views */}
        <div className="flex-1 p-6">
          {activeNav === 'journal' ? (
            <div className="space-y-6">
              {/* Search & Grid/List View Toggle Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm text-foreground shadow-sm"
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <input 
                      type="date"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                      className="w-full sm:w-36 px-3 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm text-foreground shadow-sm cursor-pointer"
                      title="Filter by date"
                    />
                  </div>
                  <div className="flex border border-border rounded-xl bg-card p-1 shadow-sm shrink-0">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  </div>
                </div>
              </div>

              {/* Entries Feed */}
              {loading ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Loading entries...</div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-2xl p-8 bg-card">
                  <p className="text-foreground font-semibold text-sm">Your diary is empty for this filter.</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap + below to write your first entry.</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "flex flex-col gap-3"}>
                  {filteredEntries.map(entry => {
                    // Format date and time
                    const createdAt = new Date(entry.created_at + 'Z');
                    const timeString = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const displayDate = `${entry.entry_date} at ${timeString}`;

                    return (
                      <GlassBlogCard
                        key={entry.id}
                        title={entry.title || 'Untitled Entry'}
                        excerpt={entry.body}
                        date={displayDate}
                        tags={entry.tags}
                        image="/beach-sunset.jpg"
                        readTime={entry.audio_count > 0 ? "Voice Note" : "Text Entry"}
                        author={{
                          name: user.displayName || user.email.split('@')[0],
                          avatar: "/profile-avatar.jpg"
                        }}
                        onClick={() => handleViewDetail(entry.id)}
                        isGrid={viewMode === 'grid'}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Settings View */
            <div className="space-y-6 max-w-lg mx-auto py-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Key className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Personal Promo Code Token</h3>
                    <p className="text-xs text-muted-foreground">Share this token during registration to sync accounts.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-secondary/60 p-4 rounded-xl border border-border">
                  <span className="font-mono font-bold text-xl tracking-wider text-primary">{user.promoCode}</span>
                  <button 
                    onClick={copyPromoCode}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:bg-primary/90 transition-all"
                  >
                    {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedToken ? "Copied" : "Copy Token"}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Account Information</h3>
                  </div>
                </div>
                <div className="space-y-3 text-sm pt-2">
                  <div className="flex justify-between border-b border-border/80 pb-2">
                    <span className="text-muted-foreground">Display Name</span>
                    <span className="font-semibold text-foreground">{user.displayName || 'User'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Email Address</span>
                    <span className="font-semibold text-foreground">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Add Entry Button */}
        <button 
          onClick={() => setIsEditorOpen(true)}
          className="fixed bottom-20 right-6 md:right-auto md:left-1/2 md:translate-x-48 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 transition-all z-40"
        >
          <Plus className="h-7 w-7" />
        </button>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-3xl bg-background/95 backdrop-blur-md border-t border-border flex justify-around py-3 z-30">
          <button 
            onClick={() => setActiveNav('journal')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-colors ${activeNav === 'journal' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <BookOpen className="h-5 w-5" />
            <span>Journal</span>
          </button>
          <button 
            onClick={() => setActiveNav('settings')}
            className={`flex flex-col items-center gap-1 text-xs font-bold transition-colors ${activeNav === 'settings' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Entry Editor Modal */}
        <AnimatePresence>
          {isEditorOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
            >
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="w-full max-w-lg bg-card border border-border rounded-t-2xl md:rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-foreground">New Journal Entry</h3>
                  <button onClick={() => setIsEditorOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEntry} className="space-y-4">
                  <input 
                    type="text" 
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Entry Title..."
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:outline-none text-base font-semibold text-foreground"
                  />

                  <div className="flex gap-2 items-center overflow-x-auto py-1">
                    {['Calm', 'Reflective', 'Happy', 'Grateful'].map(m => (
                      <button 
                        key={m}
                        type="button"
                        onClick={() => setNewMood(m)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${newMood === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 text-muted-foreground'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    rows={6}
                    value={newBody}
                    onChange={e => setNewBody(e.target.value)}
                    placeholder="Write your thoughts privately..."
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:outline-none text-sm text-foreground"
                  />

                  <input 
                    type="text" 
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    placeholder="Tags (e.g. reflections, ideas)"
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:outline-none text-xs text-foreground"
                  />

                  {/* Voice Recorder Component */}
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                    {!isRecording ? (
                      <button 
                        type="button" 
                        onClick={startAudioRecording}
                        className="flex items-center gap-2 text-xs font-bold text-primary"
                      >
                        <Mic className="h-4 w-4" />
                        <span>{audioBlob ? "Re-record Voice Note" : "Record Voice Note"}</span>
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={stopAudioRecording}
                        className="flex items-center gap-2 text-xs font-bold text-destructive animate-pulse"
                      >
                        <Square className="h-4 w-4" />
                        <span>Stop Recording ({recordTimer}s)</span>
                      </button>
                    )}
                    {audioBlob && <span className="text-xs text-emerald-600 font-semibold">✓ Voice Note Ready</span>}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsEditorOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90"
                    >
                      Save Entry
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean Entry Detail View Modal */}
        <AnimatePresence>
          {selectedEntry && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedEntry.title || 'Untitled Entry'}</h2>
                    <p className="text-xs text-muted-foreground mt-1">📅 {selectedEntry.entry_date} {selectedEntry.mood ? `• ${selectedEntry.mood}` : ''}</p>
                  </div>
                  <button onClick={() => setSelectedEntry(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{selectedEntry.body}</p>
                </div>

                {selectedEntry.audio && selectedEntry.audio.length > 0 && (
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
                    <p className="text-xs font-bold text-primary">🎙️ Voice Note</p>
                    <audio controls src={`/audio/${selectedEntry.audio[0].id}`} className="w-full" />
                    {selectedEntry.audio[0].transcript_text && (
                      <p className="text-xs text-muted-foreground pt-2 italic">"{selectedEntry.audio[0].transcript_text}"</p>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
