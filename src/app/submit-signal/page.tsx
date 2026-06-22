'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Signal, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface Town { id: string; name: string; slug: string; }

const categories = [
  { value: 'infrastructure', label: 'Infrastructure', desc: 'Roads, bridges, buildings' },
  { value: 'utilities', label: 'Utilities', desc: 'Water, electricity, sanitation' },
  { value: 'safety', label: 'Safety', desc: 'Crime, lighting, emergencies' },
  { value: 'education', label: 'Education', desc: 'Schools, libraries, training' },
  { value: 'health', label: 'Health', desc: 'Clinics, hospitals, health' },
  { value: 'economic', label: 'Economic', desc: 'Jobs, business, market access' },
];

export default function SubmitSignalPage() {
  const [towns, setTowns] = useState<Town[]>([]);
  const [form, setForm] = useState({ town_id: '', title: '', category: '', description: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.from('towns').select('id,name,slug').order('name').then(({ data }) => { if (data) setTowns(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.town_id || !form.title || !form.category) return;
    setStatus('submitting');
    const { error } = await supabase.from('town_signals').insert({
      id: 'sig-' + Date.now().toString(36),
      town_id: form.town_id, title: form.title, category: form.category,
      description: form.description || null, status: 'pending',
    });
    if (error) { setStatus('error'); setErrorMsg(error.message); }
    else { setStatus('success'); }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-12 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-learning mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Signal Submitted</h1>
          <p className="text-muted-foreground mb-6">Your community signal has been recorded. Town coordinators will review it.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStatus('idle'); setForm({ town_id: '', title: '', category: '', description: '' }); }} className="bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-6 py-3 rounded-xl font-bold text-sm">Submit Another</button>
            <Link href="/towns" className="border border-ubuntu-border text-muted-foreground px-6 py-3 rounded-xl text-sm hover:border-ubuntu-gold">Browse Towns</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-ubuntu-orange/10 flex items-center justify-center mx-auto mb-4">
            <Signal className="w-7 h-7 text-ubuntu-orange" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Submit a Signal</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Report an issue, need, or opportunity in your town. Coordinators review every signal.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Your Town *</label>
            <select value={form.town_id} onChange={(e) => setForm({ ...form, town_id: e.target.value })} required className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 focus:outline-none focus:border-ubuntu-gold">
              <option value="">Select a town...</option>
              {towns.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Category *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button key={cat.value} type="button" onClick={() => setForm({ ...form, category: cat.value })} className={`p-3 rounded-xl border text-left ${form.category === cat.value ? 'border-ubuntu-gold bg-ubuntu-gold/10' : 'border-ubuntu-border hover:border-ubuntu-gold/50'}`}>
                  <p className="text-sm font-semibold">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Signal Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Broken water pipe on Main Road" className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-ubuntu-gold" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Add details: location, how long, who it affects..." className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-ubuntu-gold resize-none" />
          </div>
          {status === 'error' && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="w-4 h-4" /> {errorMsg}</div>}
          <button type="submit" disabled={status === 'submitting' || !form.town_id || !form.title || !form.category} className="w-full bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white py-4 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {status === 'submitting' ? 'Submitting...' : 'Submit Signal →'}
          </button>
        </form>
      </div>
    </div>
  );
}
