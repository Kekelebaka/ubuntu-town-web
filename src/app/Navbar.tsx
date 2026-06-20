import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { MapPin, Sparkles, FileText, ClipboardList, Users } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-ubuntu-border bg-ubuntu-dark/95 backdrop-blur supports-[backdrop-filter]:bg-ubuntu-dark/60">
      <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/enter" className="flex items-center gap-2 font-bold text-lg">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <span className="text-emerald-500">Ubuntu Town</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/enter" className="text-muted-foreground transition-colors hover:text-emerald-400">
              Enter
            </Link>
            <Link href="/towns" className="text-muted-foreground transition-colors hover:text-emerald-400">
              Towns
            </Link>
            <Link href="/chat" className="text-muted-foreground transition-colors hover:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Kopano
            </Link>
            <Link href="/cv" className="text-muted-foreground transition-colors hover:text-emerald-400 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              CV Builder
            </Link>
            <Link href="/assignments" className="text-muted-foreground transition-colors hover:text-emerald-400 flex items-center gap-1">
              <ClipboardList className="w-4 h-4" />
              Assignments
            </Link>
            <Link href="/profile" className="text-muted-foreground transition-colors hover:text-emerald-400 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Profile
            </Link>
            <Link href="/about" className="text-muted-foreground transition-colors hover:text-emerald-400">
              About
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link href="/auth/login">
            <Button asChild variant="ghost" size="sm">
              <span>Sign in</span>
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <span>Get Started</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
