'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface Town { id: string; name: string; slug: string; }

export default function ApplyCoordinatorPage() {
  const [towns, setTowns] = useState<Town[]>([]);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', town_id: '', motivation: '', experience: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.from('towns').select('id,name,slug').order('name').then(({ data }) => { if (data) setTowns(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.town_id) return;
    setStatus('submitting');
    const selectedTown = towns.find(t => t.id === form.town_id);
    const { error } = await supabase.from('applications').insert({
      full_name: form.full_name, email: form.email, phone: form.phone || null,
      town_id: form.town_id, town_name: selectedTown?.name || '',
      motivation: form.motivation || null, experience: form.experience || null, status: 'pending',
    });
    if (error) { setStatus('error'); setErrorMsg(error.message); }
    else { setStatus('success'); }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-12 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-learning mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Application Submitted</h1>
          <p className="text-muted-foreground mb-6">We'll review your application and reach out within 48 hours.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/towns" className="bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-6 py-3 rounded-xl font-bold text-sm">Explore Towns</Link>
            <Link href="/" className="border border-ubuntu-border text-muted-foreground px-6 py-3 rounded-xl text-sm hover:border-ubuntu-gold">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-ubuntu-gold/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-ubuntu-gold-dark" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Become a Coordinator</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Coordinators map demand, connect people to opportunities, and make their town visible.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name *</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required placeholder="Your full name" className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-ubuntu-gold" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="your@email.com" className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-ubuntu-gold" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="072 123 4567" className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-ubuntu-gold" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Town *</label>
              <select value={form.town_id} onChange={(e) => setForm({ ...form, town_id: e.target.value })} required className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 focus:outline-none focus:border-ubuntu-gold">
                <option value="">Select a town...</option>
                {towns.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Why do you want to coordinate?</label>
            <textarea value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} rows={3} placeholder="What drives you and what you'd do for your community..." className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-ubuntu-gold resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Relevant experience</label>
            <textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} rows={3} placeholder="Community work, business, leadership, tech skills..." className="w-full bg-ubuntu-cream border border-ubuntu-border rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:border-ubuntu-gold resize-none" />
          </div>
          {status === 'error' && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="w-4 h-4" /> {errorMsg}</div>}
          <button type="submit" disabled={status === 'submitting' || !form.full_name || !form.email || !form.town_id} className="w-full bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white py-4 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {status === 'submitting' ? 'Submitting...' : 'Submit Application →'}
          </button>
          <p className="text-xs text-muted-foreground text-center">By applying, you agree to represent your town with integrity.</p>
        </form>
      </div>
    </div>
  );
}
