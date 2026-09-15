'use client';

/**
 * Open Door — Ubuntu Town's public entry point.
 * 
 * Signed-out journey:
 * Welcome → Province → Town → Public Town Profile → Legitimate contribution
 * → Authentication only when necessary → Return to exact town and intended action
 * 
 * Never asks a participant to appoint themselves as coordinator, reviewer,
 * leader or administrator.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { getTownBySlug, CANONICAL_PROVINCES, type CanonicalTown, type CanonicalProvince } from '@/lib/geography/canonical-register';

type View = 'welcome' | 'province' | 'town' | 'contribution';

interface OpenDoorState {
  view: View;
  province: CanonicalProvince | null;
  town: CanonicalTown | null;
  intendedAction: string | null;
}

export default function OpenDoor() {
  const router = useRouter();
  const [state, setState] = useState<OpenDoorState>({
    view: 'welcome',
    province: null,
    town: null,
    intendedAction: null,
  });
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSignedIn(!!user);
    });
  }, []);

  // Restore state from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provinceSlug = params.get('province');
    const townSlug = params.get('town');
    const action = params.get('action');

    if (provinceSlug && townSlug) {
      const province = CANONICAL_PROVINCES.find(p => p.slug === provinceSlug);
      const town = getTownBySlug(townSlug);
      if (province && town) {
        setState({
          view: action ? 'contribution' : 'town',
          province,
          town,
          intendedAction: action,
        });
      }
    }
  }, []);

  const selectProvince = useCallback((province: CanonicalProvince) => {
    setState(prev => ({ ...prev, view: 'province', province }));
    window.history.pushState(null, '', `/enter?province=${province.slug}`);
  }, []);

  const selectTown = useCallback((town: CanonicalTown) => {
    setState(prev => ({ ...prev, view: 'town', town }));
    window.history.pushState(null, '', `/enter?province=${state.province?.slug}&town=${town.slug}`);
  }, [state.province]);

  const chooseContribution = useCallback((action: string) => {
    setState(prev => ({ ...prev, view: 'contribution', intendedAction: action }));
    window.history.pushState(null, '', `/enter?province=${state.province?.slug}&town=${state.town?.slug}&action=${action}`);
  }, [state.province, state.town]);

  const handleAuthenticate = useCallback(async () => {
    // Store intended destination for post-auth redirect
    const returnTo = `/enter?province=${state.province?.slug}&town=${state.town?.slug}&action=${state.intendedAction}`;
    sessionStorage.setItem('openDoorReturn', returnTo);
    
    // Redirect to login with return URL
    router.push(`/login?next=${encodeURIComponent(returnTo)}`);
  }, [state, router]);

  const goBack = useCallback(() => {
    if (state.view === 'contribution') {
      setState(prev => ({ ...prev, view: 'town', intendedAction: null }));
    } else if (state.view === 'town') {
      setState(prev => ({ ...prev, view: 'province', town: null }));
    } else if (state.view === 'province') {
      setState(prev => ({ ...prev, view: 'welcome', province: null }));
    }
  }, [state.view]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Navigation */}
      <nav style={{ 
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(251,244,230,.82)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 66 }}>
          <a href="/enter" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 24 }}>🏘️</span>
            <span style={{ fontWeight: 800, fontSize: 18 }}>Ubuntu Town</span>
          </a>
          
          {/* Breadcrumb */}
          {state.view !== 'welcome' && (
            <div style={{ marginLeft: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
              <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-deep)', fontWeight: 600 }}>
                ← Back
              </button>
              {state.province && (
                <>
                  <span>/</span>
                  <span>{state.province.name}</span>
                </>
              )}
              {state.town && (
                <>
                  <span>/</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{state.town.name}</span>
                </>
              )}
            </div>
          )}

          {/* Auth status */}
          <div style={{ marginLeft: 'auto' }}>
            {signedIn === false && (
              <a href="/login" style={{ 
                background: 'var(--gold)', color: '#1B1206',
                padding: '8px 16px', borderRadius: 999,
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}>
                Sign in
              </a>
            )}
            {signedIn === true && (
              <a href="/workspace" style={{ 
                background: 'var(--paper)', color: 'var(--ink)',
                border: '1px solid var(--line)',
                padding: '8px 16px', borderRadius: 999,
                fontWeight: 600, fontSize: 13, textDecoration: 'none',
              }}>
                Workspace →
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px' }}>
        {state.view === 'welcome' && <WelcomeView onSelectProvince={selectProvince} />}
        {state.view === 'province' && state.province && (
          <ProvinceView province={state.province} onSelectTown={selectTown} />
        )}
        {state.view === 'town' && state.town && (
          <TownView town={state.town} province={state.province} onChooseContribution={chooseContribution} />
        )}
        {state.view === 'contribution' && state.town && (
          <ContributionView 
            town={state.town} 
            action={state.intendedAction} 
            signedIn={signedIn}
            onAuthenticate={handleAuthenticate}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Welcome View — Province Selection
// ============================================================

function WelcomeView({ onSelectProvince }: { onSelectProvince: (p: CanonicalProvince) => void }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: 12 }}>
          South Africa, town by town.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 500, margin: '0 auto' }}>
          Choose a province to discover towns, contribute signals, and build capability.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {CANONICAL_PROVINCES.map(province => (
          <button
            key={province.slug}
            onClick={() => onSelectProvince(province)}
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 18,
              padding: 24,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform .2s, border-color .2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--gold)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--line)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>{province.name}</h3>
              <span style={{ 
                fontSize: 11, fontWeight: 700, 
                background: 'rgba(238,184,73,.14)', color: 'var(--gold-deep)',
                padding: '4px 10px', borderRadius: 999,
              }}>
                {province.towns.length} towns
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {province.towns.slice(0, 4).map(town => (
                <span key={town.slug} style={{ 
                  fontSize: 12, color: 'var(--muted)',
                  background: 'var(--cream2)', padding: '4px 8px', borderRadius: 8,
                }}>
                  {town.name}
                </span>
              ))}
              {province.towns.length > 4 && (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  +{province.towns.length - 4} more
                </span>
              )}
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--gold-deep)', fontWeight: 600 }}>
              Enter province →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Province View — Town Selection
// ============================================================

function ProvinceView({ province, onSelectTown }: { province: CanonicalProvince; onSelectTown: (t: CanonicalTown) => void }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 8 }}>
          {province.name}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)' }}>
          {province.towns.length} towns in the network. Select a town to explore.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
      }}>
        {province.towns.map(town => (
          <button
            key={town.slug}
            onClick={() => onSelectTown(town)}
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 18,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform .15s, border-color .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--gold)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--line)';
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{town.name}</h3>
            <div style={{ fontSize: 12, color: 'var(--gold-deep)', fontWeight: 600 }}>
              View town →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Town View — Public Profile + Contribution Options
// ============================================================

function TownView({ 
  town, 
  province, 
  onChooseContribution 
}: { 
  town: CanonicalTown; 
  province: CanonicalProvince | null;
  onChooseContribution: (action: string) => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 8 }}>
          {town.name}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted)' }}>
          {town.province} · Part of the Ubuntu Town network
        </p>
      </div>

      {/* Public Town Profile */}
      <div style={{ 
        background: 'var(--paper)', 
        border: '1px solid var(--line)',
        borderRadius: 18,
        padding: 28,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Town Profile</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
          Public information about {town.name}. Contribute to help build this town&apos;s digital twin.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--cream2)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Province</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{town.province}</div>
          </div>
          <div style={{ background: 'var(--cream2)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Status</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>Network active</div>
          </div>
        </div>
      </div>

      {/* Contribution Options */}
      <div style={{ 
        background: 'var(--paper)', 
        border: '1px solid var(--line)',
        borderRadius: 18,
        padding: 28,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Contribute to {town.name}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
          Choose a legitimate way to contribute to this town&apos;s growth.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ContributionCard
            icon="🏪"
            title="Verify a local business"
            description="Help verify businesses in the community. Photograph and confirm business details."
            onClick={() => onChooseContribution('verify_business')}
          />
          <ContributionCard
            icon="📡"
            title="Capture a signal"
            description="Report something you noticed in the town — an opportunity, issue, or observation."
            onClick={() => onChooseContribution('capture_signal')}
          />
          <ContributionCard
            icon="📝"
            title="Suggest an improvement"
            description="Propose an improvement or initiative for the town."
            onClick={() => onChooseContribution('suggest_improvement')}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Contribution View — Authentication Gate
// ============================================================

function ContributionView({ 
  town, 
  action, 
  signedIn,
  onAuthenticate 
}: { 
  town: CanonicalTown; 
  action: string | null;
  signedIn: boolean | null;
  onAuthenticate: () => void;
}) {
  const router = useRouter();
  
  const actionLabels: Record<string, { title: string; description: string }> = {
    verify_business: {
      title: 'Verify a local business',
      description: 'You\'ll photograph and confirm business details for ' + town.name + '.',
    },
    capture_signal: {
      title: 'Capture a signal',
      description: 'Report an opportunity, issue, or observation in ' + town.name + '.',
    },
    suggest_improvement: {
      title: 'Suggest an improvement',
      description: 'Propose an improvement or initiative for ' + town.name + '.',
    },
  };

  const currentAction = action ? actionLabels[action] : null;

  // If signed in, redirect to the appropriate workspace page
  if (signedIn === true) {
    const workspacePath = action === 'verify_business' 
      ? `/workspace/missions?town=${town.slug}`
      : action === 'capture_signal'
      ? `/submit-signal?town=${town.slug}`
      : `/workspace/new?town=${town.slug}`;
    
    // Use useEffect to redirect after render
    useEffect(() => {
      router.push(workspacePath);
    }, [router, workspacePath]);
    
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: 'var(--muted)' }}>Redirecting to workspace...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {action === 'verify_business' ? '🏪' : action === 'capture_signal' ? '📡' : '📝'}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          {currentAction?.title || 'Contribute'}
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          {currentAction?.description || 'Sign in to contribute to ' + town.name}
        </p>
      </div>

      <div style={{ 
        background: 'var(--paper)', 
        border: '1px solid var(--line)',
        borderRadius: 18,
        padding: 28,
        textAlign: 'center',
      }}>
        <p style={{ marginBottom: 20, fontSize: 15 }}>
          Sign in to begin contributing to <strong>{town.name}</strong>.
        </p>
        <p style={{ marginBottom: 24, fontSize: 13, color: 'var(--muted)' }}>
          You&apos;ll be able to contribute without needing coordinator access. 
          Your contribution will be reviewed by the town&apos;s coordinator.
        </p>
        
        <button
          onClick={onAuthenticate}
          style={{
            background: 'linear-gradient(180deg, #F2C45E, #E0A52E)',
            color: '#1B1206',
            border: 'none',
            padding: '14px 32px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 10px 24px -8px rgba(185,129,20,.6)',
          }}
        >
          Sign in to contribute →
        </button>

        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
          No coordinator role required. Just a citizen contributing.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Contribution Card Component
// ============================================================

function ContributionCard({ icon, title, description, onClick }: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--cream2)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 18,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'border-color .15s',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{description}</div>
      </div>
      <span style={{ marginLeft: 'auto', color: 'var(--gold-deep)', fontWeight: 600 }}>→</span>
    </button>
  );
}
