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

const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E8DCC8', fontSize: 14, background: 'white', boxSizing: 'border-box' } as const;
const labelStyle = { fontSize: 13, fontWeight: 600, color: '#1A1A2E', display: 'block', marginBottom: 6 } as const;

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
  const [serviceCategory, setServiceCategory] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  // FamilyHouse fields
  const [propertyName, setPropertyName] = useState('');
  const [rooms, setRooms] = useState('');
  const [sleeps, setSleeps] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [amenities, setAmenities] = useState('');
  const [hostWhatsapp, setHostWhatsapp] = useState('');

  // Business fields
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessWhatsapp, setBusinessWhatsapp] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // Event fields
  const [eventName, setEventName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [ticketUrl, setTicketUrl] = useState('');

  // Podcast fields
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [hostNameField, setHostNameField] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [guests, setGuests] = useState('');

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

  const resetAllTypeFields = () => {
    setFullName(''); setServiceCategory(''); setWhatsapp(''); setYearsExperience(''); setHourlyRate('');
    setPropertyName(''); setRooms(''); setSleeps(''); setPricePerNight(''); setAmenities(''); setHostWhatsapp('');
    setBusinessName(''); setBusinessCategory(''); setBusinessWhatsapp(''); setBusinessPhone(''); setBusinessAddress('');
    setEventName(''); setStartsAt(''); setEndsAt(''); setVenue(''); setIsFree(false); setTicketUrl('');
    setEpisodeTitle(''); setHostNameField(''); setAudioUrl(''); setGuests('');
  };

  const handleSubmit = async () => {
    if (!townId || !userId) { setError('Not authorized'); return; }
    setStep('submitting');
    setError('');

    // Resolve the type-specific title / owner_ref / detail before creating the community_work row.
    let resolvedTitle = title;
    let ownerRef: string | null = null;
    let detail: Record<string, unknown> | null = null;

    if (selectedType === 'fixeasy_worker') {
      resolvedTitle = fullName;
    } else if (selectedType === 'familyhouse') {
      resolvedTitle = propertyName;
      detail = { whatsapp: hostWhatsapp || null };
    } else if (selectedType === 'business') {
      resolvedTitle = businessName;
    } else if (selectedType === 'event') {
      resolvedTitle = eventName;
    } else if (selectedType === 'podcast') {
      resolvedTitle = episodeTitle;
      ownerRef = hostNameField || null;
    }

    try {
      // 1. Create the community_work record
      const { data: cw, error: cwError } = await supabase
        .from('community_work')
        .insert({
          type: selectedType,
          town_id: townId,
          title: resolvedTitle,
          description: description || null,
          visibility: visibility,
          status: 'submitted', // Will auto-advance via trigger if self-approve is on
          created_by: userId,
          ...(ownerRef !== null ? { owner_ref: ownerRef } : {}),
          ...(detail !== null ? { detail } : {}),
        })
        .select('id')
        .single();

      if (cwError) throw cwError;

      const workId = cw?.id;

      // 2. Create typed detail record
      if (selectedType === 'fixeasy_worker' && workId) {
        const { error: detailError } = await supabase
          .from('work_fixeasy_worker')
          .insert({
            work_id: workId,
            full_name: fullName,
            skills: [serviceCategory],
            whatsapp: whatsapp || null,
            years_experience: yearsExperience ? Number(yearsExperience) : null,
            hourly_rate_zar: hourlyRate ? Number(hourlyRate) : null,
            available: true,
          });
        if (detailError) throw detailError;
      } else if (selectedType === 'familyhouse' && workId) {
        const { error: detailError } = await supabase
          .from('work_familyhouse')
          .insert({
            work_id: workId,
            rooms: rooms ? Number(rooms) : null,
            sleeps: sleeps ? Number(sleeps) : null,
            nightly_rate_zar: pricePerNight ? Number(pricePerNight) : null,
            amenities: amenities ? amenities.split(',').map(s => s.trim()).filter(Boolean) : [],
          });
        if (detailError) throw detailError;
      } else if (selectedType === 'business' && workId) {
        const { error: detailError } = await supabase
          .from('work_business')
          .insert({
            work_id: workId,
            category: businessCategory,
            whatsapp: businessWhatsapp || null,
            phone: businessPhone || null,
            address: businessAddress || null,
          });
        if (detailError) throw detailError;
      } else if (selectedType === 'event' && workId) {
        const { error: detailError } = await supabase
          .from('work_event')
          .insert({
            work_id: workId,
            starts_at: startsAt || null,
            ends_at: endsAt || null,
            venue: venue,
            is_free: isFree,
            ticket_url: ticketUrl || null,
          });
        if (detailError) throw detailError;
      } else if (selectedType === 'podcast' && workId) {
        const { error: detailError } = await supabase
          .from('work_podcast')
          .insert({
            work_id: workId,
            spotify_url: audioUrl || null,
            guests: guests ? guests.split(',').map(s => s.trim()).filter(Boolean) : [],
          });
        if (detailError) throw detailError;
      }

      setTitle(resolvedTitle);
      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create community work';
      setError(msg);
      setStep('visibility'); // Go back to let them retry
    }
  };

  // Per-type validation for the Continue button on step 2.
  const isDetailsValid = () => {
    if (selectedType === 'fixeasy_worker') return fullName.trim() !== '' && serviceCategory.trim() !== '';
    if (selectedType === 'familyhouse') return propertyName.trim() !== '';
    if (selectedType === 'business') return businessName.trim() !== '' && businessCategory.trim() !== '';
    if (selectedType === 'event') return eventName.trim() !== '' && startsAt.trim() !== '' && venue.trim() !== '';
    if (selectedType === 'podcast') return episodeTitle.trim() !== '';
    return false;
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

              {/* FixEasy Worker specific fields */}
              {selectedType === 'fixeasy_worker' && (
                <>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Thabo Mokoena"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Service Category *</label>
                    <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)}
                      style={inputStyle}
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>WhatsApp</label>
                      <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                        placeholder="+27..."
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Years of Experience</label>
                      <input type="number" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                        placeholder="e.g. 5"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Hourly Rate (R)</label>
                    <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
                      placeholder="e.g. 150"
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {/* FamilyHouse specific fields */}
              {selectedType === 'familyhouse' && (
                <>
                  <div>
                    <label style={labelStyle}>Property Name *</label>
                    <input type="text" value={propertyName} onChange={e => setPropertyName(e.target.value)}
                      placeholder="e.g. Mama Dee's Cottage"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Rooms</label>
                      <input type="number" value={rooms} onChange={e => setRooms(e.target.value)}
                        placeholder="e.g. 3"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Sleeps</label>
                      <input type="number" value={sleeps} onChange={e => setSleeps(e.target.value)}
                        placeholder="e.g. 6"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Price per Night (R)</label>
                    <input type="number" value={pricePerNight} onChange={e => setPricePerNight(e.target.value)}
                      placeholder="e.g. 450"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Amenities</label>
                    <input type="text" value={amenities} onChange={e => setAmenities(e.target.value)}
                      placeholder="e.g. WiFi, Braai, Parking"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Host WhatsApp</label>
                    <input type="tel" value={hostWhatsapp} onChange={e => setHostWhatsapp(e.target.value)}
                      placeholder="+27..."
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {/* Business specific fields */}
              {selectedType === 'business' && (
                <>
                  <div>
                    <label style={labelStyle}>Business Name *</label>
                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Sisi's Spaza Shop"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select value={businessCategory} onChange={e => setBusinessCategory(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select category...</option>
                      <option value="spaza">Spaza</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="salon">Salon</option>
                      <option value="retail">Retail</option>
                      <option value="services">Services</option>
                      <option value="transport">Transport</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>WhatsApp</label>
                      <input type="tel" value={businessWhatsapp} onChange={e => setBusinessWhatsapp(e.target.value)}
                        placeholder="+27..."
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input type="tel" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)}
                        placeholder="+27..."
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Address</label>
                    <input type="text" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)}
                      placeholder="Street, town"
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {/* Event specific fields */}
              {selectedType === 'event' && (
                <>
                  <div>
                    <label style={labelStyle}>Event Name *</label>
                    <input type="text" value={eventName} onChange={e => setEventName(e.target.value)}
                      placeholder="e.g. Youth Music Night"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Date &amp; Time *</label>
                      <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>End Time</label>
                      <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Venue *</label>
                    <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
                      placeholder="e.g. Community Hall"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="isFree" checked={isFree} onChange={e => setIsFree(e.target.checked)}
                      style={{ width: 18, height: 18 }}
                    />
                    <label htmlFor="isFree" style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>Free entry</label>
                  </div>
                  <div>
                    <label style={labelStyle}>Ticket URL</label>
                    <input type="text" value={ticketUrl} onChange={e => setTicketUrl(e.target.value)}
                      placeholder="https://..."
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {/* Podcast specific fields */}
              {selectedType === 'podcast' && (
                <>
                  <div>
                    <label style={labelStyle}>Episode Title *</label>
                    <input type="text" value={episodeTitle} onChange={e => setEpisodeTitle(e.target.value)}
                      placeholder="e.g. Ep 12: Building Ubuntu Town"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Host Name</label>
                    <input type="text" value={hostNameField} onChange={e => setHostNameField(e.target.value)}
                      placeholder="e.g. Nomvula K."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Audio / Spotify URL</label>
                    <input type="text" value={audioUrl} onChange={e => setAudioUrl(e.target.value)}
                      placeholder="https://open.spotify.com/..."
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Guests</label>
                    <input type="text" value={guests} onChange={e => setGuests(e.target.value)}
                      placeholder="e.g. Sipho M., Lindiwe T."
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              <div style={{ borderTop: '1px solid #E8DCC8', paddingTop: 16, marginTop: 8 }}>
                <label style={labelStyle}>Description / Notes</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of this community work..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E8DCC8', fontSize: 14, background: 'white', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={() => {
                  if (!isDetailsValid()) { setError('Please fill in all required fields'); return; }
                  setError('');
                  setStep('visibility');
                }}
                disabled={!isDetailsValid()}
                style={{
                  background: isDetailsValid() ? '#EEB849' : '#E8DCC8', color: 'white', padding: '14px 24px',
                  borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: isDetailsValid() ? 'pointer' : 'not-allowed',
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
              <button onClick={() => { setStep('type'); setSelectedType(''); setTitle(''); setDescription(''); resetAllTypeFields(); }} style={{ background: 'white', color: '#666', padding: '12px 24px', borderRadius: 12, fontSize: 14, border: '1px solid #E8DCC8', cursor: 'pointer' }}>
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
