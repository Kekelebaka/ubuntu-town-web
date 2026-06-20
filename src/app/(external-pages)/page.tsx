import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, FileText, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { HomeCTA } from './home-cta';
import { HomeFeatures, type HomeFeature } from './home-features';
import { HomeHero } from './home-hero';
import { NationalActivationPipeline } from './national-pipeline';

const features: HomeFeature[] = [
  {
    icon: FileText,
    title: 'CV Engine',
    description:
      'Turn your experience into an employer-ready CV in minutes. No sign-up, no forms — just conversation.',
  },
  {
    icon: MessageSquare,
    title: 'Kopano Assistant',
    description:
      'Your community opportunity assistant on Telegram. Ask, find work, build your profile — all in chat.',
  },
  {
    icon: ShieldCheck,
    title: 'Proof & Trust',
    description:
      'Verified evidence builds trust. Every workpack, every signal, every coordinator — tracked and proven.',
  },
  {
    icon: Users,
    title: 'Coordinator Network',
    description:
      'Trained local ambassadors activate towns, map demand, and turn real needs into real work.',
  },
  {
    icon: Zap,
    title: 'Ecosystem Pathways',
    description:
      'Ten lanes — from Ubuntu Academy to KasiBuy — each mapped into actionable workpacks.',
  },
  {
    icon: ArrowRight,
    title: 'Signal to Memory',
    description:
      'A repeatable loop: capture a need, build a workpack, collect proof, build town memory.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HomeHero />
      <NationalActivationPipeline />
      <HomeFeatures features={features} />
      <HomeCTA />
    </div>
  );
}
