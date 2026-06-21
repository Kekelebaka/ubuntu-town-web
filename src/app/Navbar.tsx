import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, FileText } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur" style={{ background: 'rgba(255,250,240,0.88)', borderColor: 'rgba(93,44,147,0.12)' }}>
      <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="flex items-center gap-2 font-black text-base" style={{ color: '#151015' }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(93,44,147,0.15)' }}>🏘️</span>
            <div>
              <span className="block leading-none">Ubuntu Town</span>
              <span className="block text-[0.55rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(31,22,32,0.5)' }}>Abantu Bo Buntu</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-semibold" style={{ color: 'rgba(31,22,32,0.6)' }}>
            <Link href="/enter" className="transition-colors hover:text-[#b98114]">Enter</Link>
            <Link href="/towns" className="transition-colors hover:text-[#b98114]">Towns</Link>
            <Link href="/chat" className="transition-colors hover:text-[#b98114] flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />Kopano</Link>
            <Link href="/cv" className="transition-colors hover:text-[#b98114] flex items-center gap-1"><FileText className="w-3.5 h-3.5" />CV Builder</Link>
            <Link href="/about" className="transition-colors hover:text-[#b98114]">About</Link>
            <Link href="/contact" className="transition-colors hover:text-[#b98114]">Contact</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm font-semibold px-3 py-1.5" style={{ color: 'rgba(31,22,32,0.7)' }}>Sign in</Link>
          <a href="https://t.me/Ubuntu_Town_Ops_Intake_bot" target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all hover:-translate-y-0.5" style={{ background: '#eeb849', color: '#070509' }}>
            Start on Telegram
          </a>
        </div>
      </div>
    </header>
  );
}
