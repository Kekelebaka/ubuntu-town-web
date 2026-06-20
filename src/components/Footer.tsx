import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Github,
  Linkedin,
  Twitter,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-muted/50 py-8 sm:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 pb-12 md:pb-16">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-emerald-500" />
              <span className="text-xl font-bold text-emerald-500">Ubuntu Town</span>
            </Link>

            <p className="text-sm text-muted-foreground">
              One Town. Many Hands. Real Opportunities.
            </p>

            <Separator />

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://github.com/ubuntu-town" aria-label="GitHub">
                  <Github className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://twitter.com/ubuntu_town" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="https://linkedin.com/company/ubuntu-town" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase">Resources</h4>
            <nav className="flex flex-col space-y-2.5">
              <Link
                href="https://usenextbase.com"
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                NextBase
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase">Follow us</h4>
            <nav className="flex flex-col space-y-2.5">
              <Link
                href="https://github.com/ubuntu-town"
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Github
              </Link>
              <Link
                href="https://twitter.com/ubuntu_town"
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Twitter
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase">Legal</h4>
            <nav className="flex flex-col space-y-2.5">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms &amp; Conditions
              </Link>
            </nav>
          </div>
        </div>

        <Separator className="my-6 lg:my-8" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © 2025 Ubuntu Town. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
