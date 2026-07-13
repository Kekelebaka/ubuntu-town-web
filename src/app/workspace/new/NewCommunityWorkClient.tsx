'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { MapPin, ArrowLeft, Wrench, Home, ShoppingBag, Calendar, Mic } from 'lucide-react';

const WORK_TYPES = [
  { value: 'fixeasy_worker', label: '🔧 FixEasy Worker', icon: <Wrench size={20} />, desc: 'Register a plumber, electrician, handyman, or other service provider' },
  { value: 'familyhouse', label: '🏠 FamilyHouse Host', icon: <Home size={20} />, desc: 'List a room, cottage, or house for visitors' },
  { value: 'business', label: '🛒 Local Business', icon: <ShoppingBag size={20} />, desc: 'Add a spaza, salon, restaurant, or shop' },
  { value: 'event', label: '🎉 Community Event', icon: <Calendar size={20} />, desc: 'Create a music event, workshop, or market' },
  { value: 'podcast', label: '🎙️ Podcast Episode', icon: <Mic size={20} />, desc: 'Publish an Inside.Town episode' },
];

type Step = 'type' | 'details' | 'visibility' | 'submitting' | 'done';

export default function NewCommunityWorkPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'internal' | 'national'>('public');
  const [townId, setTownId] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  // FixEasy Worker fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?next=/workspace/new'); return; }
      setUserId(user.id);

      const { data: roles } = await supabase
        .from('role_assignments')
        .select('town_id')
        .eq('user_id', user.id)
        .in('role_key', ['coordinator', 'deputy', 'admin', 'ops'])
        .limit(1);

      if (roles && roles.length > 0 && roles[0].town_id) {
        setTownId(roles[0].town_id);
      }
    }
    init();
  }, [router]);

  const handleSubmit = async () => {
    if (!townId || !userId) { setError('Not authorized'); return; }
    setStep('submitting');
    setError('');

    try {
      // 1. Create the community_work record
      const { data: cw, error: cwError } = await supabase
        .from('community_work')
        .insert({
          type: selectedType,
          town_id: townId,
          title: title,
          description: description || null,
          visibility: visibility,
          status: 'submitted', // Will auto-advance via trigger if self-approve is on
          created_by: userId,
        })
        .select('id')
        .single();

      if (cwError) throw cwError;

      // 2. Create typed detail record
      if (selectedType === 'fixeasy_worker' && cw) {
        const { error: fewError } = await supabase
          .from('work_fixeasy_worker')
          .insert({
            work_id: cw.id,
            full_name: fullName,
            whatsapp: whatsapp || phone || null,
            skills: [serviceCategory],
            available: true,
          });
        if (fewError) throw fewError;
      }

      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create community work';
      setError(msg);
      setStep('visibility'); // Go back to let them retry
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FBF4E6' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E8DCC8', background: 'white', padding: '12px 0' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => {
            if (step === 'type') { router.push('/workspace'); return; }
            if (step === 'details') { setStep('type'); return; }
            if (step === 'visibility') { setStep('details'); return; }
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Add Community Work</h1>
            <p style={{ fontSize: 11, color: '#999', margin: 0 }}>
              Step {step === 'type' ? '1' : step === 'details' ? '2' : '3'} of 3
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        {/* Step 1: Choose Type */}
        {step === 'type' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>What are you adding?</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Choose the type of community work to register.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {WORK_TYPES.map(wt => (
                <button
                  key={wt.value}
                  onClick={() => { setSelectedType(wt.value); setStep('details'); }}
                  style={{
                    background: 'white', border: selectedType === wt.value ? '2px solid #EEB849' : '1px solid #E8DCC8',
                    borderRadius: 12, padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {wt.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{wt.label}</p>
                    <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>{wt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
              {WORK_TYPES.find(w => w.value === selectedType)?.label || 'Details'}
            </h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Fill in the details. This will be reviewed before publishing.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', display: 'block', marginBottom: 6 }}>Title *</label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={selectedType === 'fixeasy_worker' ? 'e.g. Thabo Mokoena — Plumber' : 'Title'}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E8DCC8', fontSize: 14, background: 'white', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of this community work..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E8DCC8', fontSize: 14, background: 'white', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* FixEasy Worker specific fields */}
              {selectedType === 'fixeasy_worker' && (
                <>
                  <div style={{ borderTop: '1px solid #E8DCC8', paddingTop: 16, marginTop: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#B8860B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Service Provider Details</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', display: 'block', marginBottom: 6 }}>Full Name *</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Thabo Mokoena"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E8DCC8', fontSize: 14, background: 'white', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', display: 'block', marginBottom: 6 }}>Phone</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+27..."
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E8DCC8', fontSize: 14, background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', display: 'block', marginBottom: 6 }}>WhatsApp</label>
                      <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                        placeholder="+27..."
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E8DCC8', fontSize: 14, background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', display: 'block', marginBottom: 6 }}>Service Category *</label>
                    <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E8DCC8', fontSize: 14, background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="">Select category...</option>
                      <option value="plumber">Plumber</option>
                      <option value="electrician">Electrician</option>
                      <option value="handyman">Handyman</option>
                      <option value="painter">Painter</option>
                      <option value="carpenter">Carpenter</option>
                      <option value="mechanic">Mechanic</option>
                      <option value="cleaner">Cleaner</option>
                      <option value="gardener">Gardener</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  if (!title.trim()) { setError('Title is required'); return; }
                  if (selectedType === 'fixeasy_worker' && !fullName.trim()) { setError('Full name is required for workers'); return; }
                  setError('');
                  setStep('visibility');
                }}
                disabled={!title.trim()}
                style={{
                  background: title.trim() ? '#EEB849' : '#E8DCC8', color: 'white', padding: '14px 24px',
                  borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: title.trim() ? 'pointer' : 'not-allowed',
                  marginTop: 8,
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Visibility + Submit */}
        {step === 'visibility' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Who should see this?</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Choose visibility. This determines where it publishes.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { value: 'public', label: '🌍 Public', desc: 'Visible to everyone on the town page and search' },
                { value: 'national', label: '🇿🇦 National', desc: 'Featured on the national Ubuntu Town portal' },
                { value: 'internal', label: '🔒 Internal', desc: 'Only visible to coordinators and admins' },
              ].map(v => (
                <button
                  key={v.value}
                  onClick={() => setVisibility(v.value as 'public' | 'internal' | 'national')}
                  style={{
                    background: 'white', border: visibility === v.value ? '2px solid #EEB849' : '1px solid #E8DCC8',
                    borderRadius: 12, padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${visibility === v.value ? '#EEB849' : '#E8DCC8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {visibility === v.value && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EEB849' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{v.label}</p>
                    <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>{v.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              style={{
                background: '#059669', color: 'white', padding: '14px 24px',
                borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
                width: '100%',
              }}
            >
              Submit for Review ✓
            </button>
            <p style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 8 }}>
              Your submission will be reviewed before publishing to the town page.
            </p>
          </div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #EEB849', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#666' }}>Submitting...</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: 32 }}>✓</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>Submitted!</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              &ldquo;{title}&rdquo; has been submitted for review. It will appear on the town page once approved.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => router.push('/workspace')} style={{ background: '#EEB849', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Back to Workspace
              </button>
              <button onClick={() => { setStep('type'); setTitle(''); setDescription(''); setFullName(''); setPhone(''); setWhatsapp(''); setServiceCategory(''); }} style={{ background: 'white', color: '#666', padding: '12px 24px', borderRadius: 12, fontSize: 14, border: '1px solid #E8DCC8', cursor: 'pointer' }}>
                Add Another
              </button>
            </div>
          </div>
        )}

        {error && step !== 'submitting' && step !== 'done' && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 10, fontSize: 13, marginTop: 16 }}>
            {error}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
