# AMD Credits Enrichment Plan
# "Nothing orthodox" — using AI compute to make Ubuntu Town data 100%

## The Opportunity

Ubuntu Town has AMD credits available for compute. The goal is to use those credits to:
1. Generate enriched content for ALL 161 towns
2. Create AI-powered descriptions, opportunity matching, and signal analysis
3. Build the intelligence layer that makes the platform truly smart

---

## WHAT AMD CREDITS CAN DO

### Tier 1: Content Generation (Immediate)
Use AMD GPU compute to run open-source LLMs for:

**Town Descriptions (161 towns)**
- Input: Town name, province, GPS coordinates, population, archetype
- Output: 2-3 compelling sentences capturing the town's character
- Model: Llama 3.1 8B or Mistral 7B (fits in single GPU)
- Cost: ~161 inference calls = negligible

**Opportunity Matching (158 opportunities × 50 towns)**
- Input: Opportunity title, type, source + town profile
- Output: Relevance score (0-100) per town-opportunity pair
- Model: Embedding model (all-MiniLM-L6-v2) + cosine similarity
- Cost: ~8,000 embedding comparisons = fast

**Signal Classification (13 existing + future)**
- Input: Signal text (e.g., "Pothole crisis — M1 off-ramp")
- Output: Category, severity, estimated affected population
- Model: Fine-tuned classifier on 5 categories
- Cost: Real-time inference, negligible

### Tier 2: Intelligence Layer (Week 2)
**Town Readiness Calculator**
- Input: All data points for a town (metrics, opportunities, signals, stories)
- Output: Real render_pct calculated from actual data
- Formula: youth_mapped × 0.3 + coordinator_active × 0.2 + opportunities × 0.15 + signals × 0.1 + stories × 0.1 + businesses × 0.15

**Opportunity Scorer**
- Input: Opportunity metadata + town demographics
- Output: Impact score, feasibility score, youth relevance score
- Use: Rank opportunities per town for the investor/funder lens

**Coordinator Matchmaker**
- Input: Coordinator skills + town needs
- Output: Match score, recommended focus areas
- Use: Help coordinators prioritize which towns to claim

### Tier 3: Predictive Analytics (Week 3)
**Town Growth Predictor**
- Input: Historical metrics (render_pct over time)
- Output: Predicted render_pct in 30/60/90 days
- Use: Show "Projected to go live in 2 months" on province pages

**Signal Trend Detector**
- Input: Signal categories over time
- Output: Trend analysis (infrastructure improving/declining)
- Use: "Infrastructure signals down 20% this quarter"

**Network Effect Model**
- Input: All town data + coordinator activity
- Output: Which towns will light up next
- Use: "Next 5 towns likely to go live: X, Y, Z"

---

## IMPLEMENTATION ARCHITECTURE

### Option A: AMD GPU Instance (Recommended)
```
┌─────────────────────────────────────────┐
│  AMD GPU Instance (MI250X or similar)   │
│                                          │
│  ┌──────────┐  ┌──────────┐            │
│  │ vLLM     │  │ Python   │            │
│  │ Server   │  │ Scripts  │            │
│  │ (Llama)  │  │ (embeds) │            │
│  └────┬─────┘  └────┬─────┘            │
│       │              │                   │
│       └──────┬───────┘                   │
│              │                           │
│    ┌─────────▼─────────┐                │
│    │  Output Pipeline  │                │
│    │  - JSON files     │                │
│    │  - Supabase seed  │                │
│    │  - S3/cache       │                │
│    └───────────────────┘                │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Ubuntu Town Build   │
│  (Cloudflare Pages)  │
└─────────────────────┘
```

### Option B: AMD Cloud API
If AMD has a cloud inference API:
- Call API from build scripts
- Cache responses in Supabase
- Refresh monthly

---

## DATA PIPELINE

### Step 1: Prepare Input Data
```javascript
// scripts/amd/prepare-inputs.js
const towns = require('../data/towns.js').TOWNS;
const opportunities = require('../data/opportunities.js');

const inputs = towns.map(town => ({
  name: town.name,
  slug: town.slug,
  province: town.province_slug,
  lat: town.latitude,
  lng: town.longitude,
  population: town.population_estimate,
  archetype: town.archetype,
  description: town.description,
  // From Supabase enrichment:
  metrics: town.metrics,
  opportunities: town.opportunities,
  signals: town.signals,
  stories: town.stories,
}));
```

### Step 2: Run AMD Inference
```bash
# Generate descriptions
python3 scripts/amd/generate-descriptions.py --model llama-3.1-8b --input towns.json

# Score opportunities
python3 scripts/amd/score-opportunities.py --model all-miniLM --input opps.json

# Classify signals
python3 scripts/amd/classify-signals.py --model classifier --input signals.json

# Calculate render scores
python3 scripts/amd/calculate-render.py --input all-data.json
```

### Step 3: Output to Supabase
```bash
# Seed enriched data
SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node scripts/amd/seed-enriched.js
```

### Step 4: Build with Enriched Data
```bash
npm run build  # picks up enriched data at build time
```

---

## SPECIFIC USE CASES FOR AMD CREDITS

### 1. Town Description Generator
**Input:** `{ name: "Ladybrand", province: "Free State", lat: -29.19, lng: 27.46, population: 8500, archetype: "heritage_town" }`

**Prompt:** "Write a 2-sentence description of {name}, a {archetype} in the {province} province of South Africa. Population: {population}. Coordinates: {lat}, {lng}. Focus on what makes this town unique."

**Output:** "Nestled against the Maloti mountain escarpment at the Lesotho border, Ladybrand is a charming town of sandstone buildings, art galleries, and some of the best farm stalls in the Free State. The nearby Basotho Cultural Village connects visitors to thousands of years of human settlement."

**Cost:** 161 calls × ~200 tokens = ~32K tokens = negligible on AMD GPU

### 2. Opportunity-Town Matcher
**Input:** Opportunity: "NYDA Grant Programme — R100K to R1M" | Town: "Johannesburg, 5.6M, major_city"

**Model:** Embedding similarity + rule-based scoring

**Output:** `{ relevance: 92, reason: "High youth population, major city, existing coordinator" }`

**Cost:** 158 opportunities × 50 towns = 7,900 comparisons = ~1 minute on GPU

### 3. Signal Severity Classifier
**Input:** "Pothole crisis — M1 off-ramp Braamfontein"

**Model:** Fine-tuned classifier (5 categories × 3 severity levels)

**Output:** `{ category: "infrastructure", severity: "high", affected: "~50,000 commuters/day" }`

**Cost:** Real-time, negligible

### 4. Render Score Calculator
**Input:** All town data points

**Formula:**
```
render_pct = (
  min(youth_mapped / 500, 30) +      // Youth engagement (max 30%)
  (has_coordinator ? 20 : 0) +        // Coordinator active (20%)
  min(opportunities_count * 3, 15) +  // Opportunities (max 15%)
  min(signals_count * 5, 15) +        // Signals logged (max 15%)
  min(stories_count * 5, 10) +        // Stories shared (max 10%)
  min(businesses_count * 2, 10)       // Businesses mapped (max 10%)
)
```

**Output:** `{ render_pct: 67, breakdown: { youth: 25, coordinator: 20, opps: 12, signals: 5, stories: 5, businesses: 0 } }`

**Cost:** Pure calculation, no GPU needed

---

## PRIORITY ORDER

| Priority | Task | AMD Credits? | Timeline |
|----------|------|-------------|----------|
| 1 | Town descriptions | Yes (LLM) | Day 1 |
| 2 | Opportunity matching | Yes (embeddings) | Day 1 |
| 3 | Render score calculation | No (formula) | Day 1 |
| 4 | Signal classification | Yes (classifier) | Day 2 |
| 5 | Town growth prediction | Yes (LLM) | Week 2 |
| 6 | Coordinator matching | Yes (embeddings) | Week 2 |
| 7 | Network effect modeling | Yes (LLM) | Week 3 |

---

## EXPECTED OUTCOMES

After AMD enrichment:
- **161 towns** with AI-generated descriptions (if not already present)
- **158 opportunities** scored and ranked per town
- **13 signals** classified with severity and impact
- **50 towns** with real render_pct calculated from data
- **Province pages** showing "Projected to go live" predictions
- **National view** showing network growth trajectory

---

## NEXT STEPS

1. Confirm AMD credits are available and what compute is accessible
2. Set up AMD GPU instance or API endpoint
3. Run Tier 1 content generation (descriptions + opportunity matching)
4. Seed results to Supabase
5. Rebuild and deploy enriched platform

---

*Plan by: Ubuntu Town Chief of Staff*
*Date: 2026-06-25*
*Status: Ready to execute on AMD credit confirmation*
