import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="px-6 py-10" style={{ background: '#070509', color: '#fff8e7' }}>
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <div className="text-lg font-black text-white">Ubuntu Town</div>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,248,231,0.5)' }}>An initiative of Abantu Bo Buntu NPC.</p>
          <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] mt-1" style={{ color: '#eeb849' }}>One Town. Many Hands. Real Opportunities.</p>
        </div>
        <div className="flex gap-10 flex-wrap">
          <div>
            <h5 className="text-[0.6rem] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,248,231,0.4)' }}>Platform</h5>
            <Link href="/enter" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Ubuntu Town OS</Link>
            <a href="https://forge.ubuntutown.co.za" target="_blank" rel="noopener noreferrer" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Kopano Forge</a>
            <Link href="/towns" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Towns</Link>
            <Link href="/cv" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>CV Builder</Link>
            <Link href="/chat" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Kopano AI</Link>
            <Link href="/fellowship" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Build Fellowship</Link>
          </div>
          <div>
            <h5 className="text-[0.6rem] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,248,231,0.4)' }}>Follow Us</h5>
            <a href="https://www.linkedin.com/company/ubuntu-town" target="_blank" rel="noopener noreferrer" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>LinkedIn</a>
            <a href="https://www.tiktok.com/@ubuntutown" target="_blank" rel="noopener noreferrer" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>TikTok</a>
            <a href="https://www.youtube.com/@ubuntutown" target="_blank" rel="noopener noreferrer" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>YouTube</a>
          </div>
          <div>
            <h5 className="text-[0.6rem] font-extrabold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,248,231,0.4)' }}>Organisation</h5>
            <Link href="/apply" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Become a Coordinator</Link>
            <Link href="/fellowship" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Build Fellowship</Link>
            <Link href="/about" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>About</Link>
            <Link href="/privacy" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Privacy Policy</Link>
            <Link href="/terms" className="block text-xs font-semibold mb-1" style={{ color: 'rgba(255,248,231,0.6)' }}>Terms</Link>
          </div>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto mt-8 pt-4 flex flex-col sm:flex-row sm:justify-between gap-2" style={{ borderTop: '1px solid rgba(255,248,231,0.08)' }}>
        <span className="text-[0.65rem]" style={{ color: 'rgba(255,248,231,0.3)' }}>© 2026 Ubuntu Town · Abantu Bo Buntu NPC. All Rights Reserved.</span>
        <span className="text-[0.65rem]" style={{ color: 'rgba(255,248,231,0.2)' }}>enter.ubuntutown.co.za · forge.ubuntutown.co.za</span>
      </div>
    </footer>
  );
}
