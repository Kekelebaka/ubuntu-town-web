# Ubuntu Town OS — Brand / Design System (Phase 1)

The design foundation for the apex go-live port. Everything here is presentation
only and safe to adopt incrementally — no data wiring (that's Phase 2/3).

## Tokens
Defined in `src/styles/globals.css`:
- **Semantic (shadcn) tokens** — `background/foreground/card/primary/secondary/muted/accent/border/ring/sidebar-*`. Light values in `:root`, dark values in `.dark, [data-theme="dark"]`, mapped via `@theme inline` so dark mode now actually re-themes (it previously did not).
- **Brand palette** — `--color-ubuntu-purple` (#6B1F66, primary), `--color-ubuntu-orange` (#F79412, accent), `--color-ubuntu-cream`, `--color-ubuntu-ink`, `--color-ubuntu-green`, `--color-ubuntu-pink`, `--color-ubuntu-indigo`, plus `-deep`/`-soft` shades. Legacy token names retained so existing components keep rendering.
- **Fonts** — `font-display` (Bricolage Grotesque), `font-sans` (Inter), `font-mono` (IBM Plex Mono), `font-hand` (Caveat). Wired in `src/app/layout.tsx`.

Light is the default (`DynamicLayoutProviders` sets `enableSystem={false}`, `defaultTheme="light"`). Users opt into dark via `<ThemeToggle />`.

## Components (`@/components/brand`)
| Component | Type | Purpose |
|---|---|---|
| `NodeCard` | server | One of the 10 opportunity nodes |
| `RebootKasiCounter` | client | Animated campaign progress (wire to `uto.opportunity_points` in Phase 2) |
| `TownScoreBadge` | server | 0–100 town readiness pill with band |
| `SectionHeading` | server | eyebrow + display title + subtitle |
| `ThemeToggle` | client | light/dark switch (next-themes) |

## Data
`src/lib/nodes.ts` — `OPPORTUNITY_NODES`, the canonical ten-node taxonomy (AI Café, The Plug, KasiBuy, Ubuntu Academy, The Workshop, FixEasy24, EcoCycle, HubWorks, Ubuntu Finance, Ubuntu Health). Ubuntu Wallet / fintech positioning intentionally excluded.

## Usage
```tsx
import { SectionHeading, NodeCard, OPPORTUNITY_NODES } from '@/components/brand';

<SectionHeading eyebrow="The OS" title="Ten ways a town earns" align="center" />
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {OPPORTUNITY_NODES.map((n) => (
    <NodeCard key={n.slug} name={n.name} tagline={n.tagline} Icon={n.Icon} accentVar={n.accentVar} href={`/nodes/${n.slug}`} />
  ))}
</div>
```
