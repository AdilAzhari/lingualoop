<?php

namespace Database\Seeders;

use App\Models\ImagePrompt;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class ImagePromptSeeder extends Seeder
{
    public function run(): void
    {
        Storage::disk('local')->makeDirectory('image-prompts');

        foreach ($this->prompts() as $p) {
            Storage::disk('local')->put('image-prompts/' . $p['file'], $p['svg']);
            ImagePrompt::firstOrCreate(
                ['title' => $p['title']],
                [
                    'image_path'       => 'image-prompts/' . $p['file'],
                    'type'             => $p['type'],
                    'topic'            => $p['topic'],
                    'level'            => $p['level'],
                    'task_instruction' => $p['task'],
                    'key_features'     => $p['features'],
                    'mode'             => $p['mode'],
                    'target_words'     => $p['words']   ?? 150,
                    'target_seconds'   => $p['seconds'] ?? 120,
                ]
            );
        }
    }

    // ── SVG helpers ───────────────────────────────────────────────────

    private function svg(int $w, int $h, string $content): string
    {
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="{$w}" height="{$h}" font-family="Arial, sans-serif">
  <rect width="{$w}" height="{$h}" fill="#fafaf8" rx="6"/>
  {$content}
</svg>
SVG;
    }

    // ── Prompt definitions ────────────────────────────────────────────

    private function prompts(): array
    {
        return [
            $this->museumBarChart(),
            $this->internetLineGraph(),
            $this->studentPieChart(),
            $this->chocolateProcess(),
            $this->townMap(),
            $this->marketScene(),
        ];
    }

    // ── 1. Bar chart — Museum Visitors ───────────────────────────────

    private function museumBarChart(): array
    {
        // Chart area: x80-570 (490px), y50-300 (250px). Max 8M → 31.25px/M
        $b = static fn($v) => round(300 - $v * 31.25); // bar top y
        $h = static fn($v) => round($v * 31.25);        // bar height

        $body = <<<SVG
  <text x="310" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#1a202c">Annual Visitors to Three London Museums, 2015–2021 (millions)</text>

  <!-- grid -->
  <line x1="80" y1="50"  x2="570" y2="50"  stroke="#e2e8f0" stroke-dasharray="4 3"/>
  <line x1="80" y1="112" x2="570" y2="112" stroke="#e2e8f0" stroke-dasharray="4 3"/>
  <line x1="80" y1="175" x2="570" y2="175" stroke="#e2e8f0" stroke-dasharray="4 3"/>
  <line x1="80" y1="237" x2="570" y2="237" stroke="#e2e8f0" stroke-dasharray="4 3"/>
  <line x1="80" y1="300" x2="570" y2="300" stroke="#cbd5e0"/>

  <!-- axes -->
  <line x1="80" y1="50" x2="80" y2="300" stroke="#718096" stroke-width="1.5"/>
  <line x1="80" y1="300" x2="570" y2="300" stroke="#718096" stroke-width="1.5"/>

  <!-- y labels -->
  <text x="72" y="54"  text-anchor="end" font-size="11" fill="#718096">8</text>
  <text x="72" y="116" text-anchor="end" font-size="11" fill="#718096">6</text>
  <text x="72" y="179" text-anchor="end" font-size="11" fill="#718096">4</text>
  <text x="72" y="241" text-anchor="end" font-size="11" fill="#718096">2</text>
  <text x="72" y="304" text-anchor="end" font-size="11" fill="#718096">0</text>
  <text transform="rotate(-90)" x="-175" y="18" text-anchor="middle" font-size="10" fill="#718096">Millions of visitors</text>

  <!-- 2015 group -->
  <rect x="105" y="{$b(6.7)}" width="38" height="{$h(6.7)}" fill="#3b82f6"/>
  <rect x="147" y="{$b(5.3)}" width="38" height="{$h(5.3)}" fill="#10b981"/>
  <rect x="189" y="{$b(4.7)}" width="38" height="{$h(4.7)}" fill="#f97316"/>

  <!-- 2018 group -->
  <rect x="260" y="{$b(5.9)}" width="38" height="{$h(5.9)}" fill="#3b82f6"/>
  <rect x="302" y="{$b(4.6)}" width="38" height="{$h(4.6)}" fill="#10b981"/>
  <rect x="344" y="{$b(5.8)}" width="38" height="{$h(5.8)}" fill="#f97316"/>

  <!-- 2021 group -->
  <rect x="415" y="{$b(4.8)}" width="38" height="{$h(4.8)}" fill="#3b82f6"/>
  <rect x="457" y="{$b(3.2)}" width="38" height="{$h(3.2)}" fill="#10b981"/>
  <rect x="499" y="{$b(4.1)}" width="38" height="{$h(4.1)}" fill="#f97316"/>

  <!-- x labels -->
  <text x="167" y="316" text-anchor="middle" font-size="12" fill="#4a5568">2015</text>
  <text x="322" y="316" text-anchor="middle" font-size="12" fill="#4a5568">2018</text>
  <text x="472" y="316" text-anchor="middle" font-size="12" fill="#4a5568">2021</text>

  <!-- legend -->
  <rect x="100" y="342" width="14" height="14" fill="#3b82f6" rx="2"/>
  <text x="118" y="354" font-size="11" fill="#4a5568">British Museum</text>
  <rect x="255" y="342" width="14" height="14" fill="#10b981" rx="2"/>
  <text x="273" y="354" font-size="11" fill="#4a5568">Natural History Museum</text>
  <rect x="450" y="342" width="14" height="14" fill="#f97316" rx="2"/>
  <text x="468" y="354" font-size="11" fill="#4a5568">Tate Modern</text>
SVG;

        return [
            'file'  => 'museum-visitors-bar.svg',
            'title' => 'Annual Visitors to Three London Museums (2015–2021)',
            'type'  => 'chart',
            'topic' => 'Culture',
            'level' => 'b2',
            'mode'  => 'both',
            'words' => 150,
            'seconds' => 120,
            'task' => 'The bar chart shows the number of visitors to three London museums — the British Museum, the Natural History Museum, and Tate Modern — in 2015, 2018, and 2021. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
            'features' => [
                'Overall trend: all three museums saw a decline in 2021',
                'British Museum had the highest visitor numbers in all three years',
                'Tate Modern increased from 2015 to 2018, unlike the other two',
                'Natural History Museum had the sharpest fall in 2021',
                'Specific figures: e.g. British Museum peaked at 6.7 million in 2015',
            ],
            'svg' => $this->svg(620, 380, $body),
        ];
    }

    // ── 2. Line graph — Internet Usage ───────────────────────────────

    private function internetLineGraph(): array
    {
        // Chart area x80-560 (480px), y50-320 (270px). 0-100% → 2.7px/%
        // X points at 80, 200, 320, 440, 560 (years 2000,2005,2010,2015,2020)
        $py = static fn($v) => round(320 - $v * 2.7);

        $ukPts    = "80,{$py(26)} 200,{$py(70)} 320,{$py(85)} 440,{$py(92)} 560,{$py(96)}";
        $jpPts    = "80,{$py(30)} 200,{$py(67)} 320,{$py(78)} 440,{$py(91)} 560,{$py(94)}";
        $brPts    = "80,{$py(3)}  200,{$py(21)} 320,{$py(41)} 440,{$py(58)} 560,{$py(74)}";
        $inPts    = "80,{$py(1)}  200,{$py(2)}  320,{$py(7)}  440,{$py(26)} 560,{$py(50)}";

        $body = <<<SVG
  <text x="320" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#1a202c">Internet Users per 100 People, Selected Countries (2000–2020)</text>

  <!-- grid -->
  <line x1="80" y1="50"  x2="560" y2="50"  stroke="#e2e8f0" stroke-dasharray="4 3"/>
  <line x1="80" y1="117" x2="560" y2="117" stroke="#e2e8f0" stroke-dasharray="4 3"/>
  <line x1="80" y1="185" x2="560" y2="185" stroke="#e2e8f0" stroke-dasharray="4 3"/>
  <line x1="80" y1="252" x2="560" y2="252" stroke="#e2e8f0" stroke-dasharray="4 3"/>
  <line x1="80" y1="320" x2="560" y2="320" stroke="#cbd5e0"/>

  <!-- axes -->
  <line x1="80" y1="50" x2="80" y2="320" stroke="#718096" stroke-width="1.5"/>
  <line x1="80" y1="320" x2="560" y2="320" stroke="#718096" stroke-width="1.5"/>

  <!-- y labels -->
  <text x="72" y="54"  text-anchor="end" font-size="11" fill="#718096">100</text>
  <text x="72" y="121" text-anchor="end" font-size="11" fill="#718096">75</text>
  <text x="72" y="189" text-anchor="end" font-size="11" fill="#718096">50</text>
  <text x="72" y="256" text-anchor="end" font-size="11" fill="#718096">25</text>
  <text x="72" y="324" text-anchor="end" font-size="11" fill="#718096">0</text>
  <text transform="rotate(-90)" x="-185" y="18" text-anchor="middle" font-size="10" fill="#718096">Users per 100 people</text>

  <!-- x labels -->
  <text x="80"  y="336" text-anchor="middle" font-size="11" fill="#4a5568">2000</text>
  <text x="200" y="336" text-anchor="middle" font-size="11" fill="#4a5568">2005</text>
  <text x="320" y="336" text-anchor="middle" font-size="11" fill="#4a5568">2010</text>
  <text x="440" y="336" text-anchor="middle" font-size="11" fill="#4a5568">2015</text>
  <text x="560" y="336" text-anchor="middle" font-size="11" fill="#4a5568">2020</text>

  <!-- lines -->
  <polyline points="{$ukPts}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round"/>
  <polyline points="{$jpPts}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round"/>
  <polyline points="{$brPts}" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linejoin="round"/>
  <polyline points="{$inPts}" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linejoin="round"/>

  <!-- dots — UK -->
  <circle cx="80"  cy="{$py(26)}" r="4" fill="#3b82f6"/>
  <circle cx="200" cy="{$py(70)}" r="4" fill="#3b82f6"/>
  <circle cx="320" cy="{$py(85)}" r="4" fill="#3b82f6"/>
  <circle cx="440" cy="{$py(92)}" r="4" fill="#3b82f6"/>
  <circle cx="560" cy="{$py(96)}" r="4" fill="#3b82f6"/>
  <!-- dots — Japan -->
  <circle cx="80"  cy="{$py(30)}" r="4" fill="#10b981"/>
  <circle cx="200" cy="{$py(67)}" r="4" fill="#10b981"/>
  <circle cx="320" cy="{$py(78)}" r="4" fill="#10b981"/>
  <circle cx="440" cy="{$py(91)}" r="4" fill="#10b981"/>
  <circle cx="560" cy="{$py(94)}" r="4" fill="#10b981"/>
  <!-- dots — Brazil -->
  <circle cx="80"  cy="{$py(3)}"  r="4" fill="#f97316"/>
  <circle cx="200" cy="{$py(21)}" r="4" fill="#f97316"/>
  <circle cx="320" cy="{$py(41)}" r="4" fill="#f97316"/>
  <circle cx="440" cy="{$py(58)}" r="4" fill="#f97316"/>
  <circle cx="560" cy="{$py(74)}" r="4" fill="#f97316"/>
  <!-- dots — India -->
  <circle cx="80"  cy="{$py(1)}"  r="4" fill="#8b5cf6"/>
  <circle cx="200" cy="{$py(2)}"  r="4" fill="#8b5cf6"/>
  <circle cx="320" cy="{$py(7)}"  r="4" fill="#8b5cf6"/>
  <circle cx="440" cy="{$py(26)}" r="4" fill="#8b5cf6"/>
  <circle cx="560" cy="{$py(50)}" r="4" fill="#8b5cf6"/>

  <!-- legend -->
  <line x1="80" y1="362" x2="100" y2="362" stroke="#3b82f6" stroke-width="2.5"/>
  <text x="104" y="366" font-size="11" fill="#4a5568">United Kingdom</text>
  <line x1="210" y1="362" x2="230" y2="362" stroke="#10b981" stroke-width="2.5"/>
  <text x="234" y="366" font-size="11" fill="#4a5568">Japan</text>
  <line x1="290" y1="362" x2="310" y2="362" stroke="#f97316" stroke-width="2.5"/>
  <text x="314" y="366" font-size="11" fill="#4a5568">Brazil</text>
  <line x1="370" y1="362" x2="390" y2="362" stroke="#8b5cf6" stroke-width="2.5"/>
  <text x="394" y="366" font-size="11" fill="#4a5568">India</text>
SVG;

        return [
            'file'  => 'internet-usage-line.svg',
            'title' => 'Internet Users per 100 People: Four Countries (2000–2020)',
            'type'  => 'graph',
            'topic' => 'Technology',
            'level' => 'b2',
            'mode'  => 'both',
            'words' => 150,
            'seconds' => 120,
            'task' => 'The line graph shows the percentage of the population using the internet in four countries — the United Kingdom, Japan, Brazil, and India — between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
            'features' => [
                'Overall: all four countries showed a significant increase over the period',
                'UK and Japan both started high and converged at around 95% by 2020',
                'Brazil grew steadily, reaching approximately 74% by 2020',
                'India started near zero but grew rapidly after 2010, reaching 50% in 2020',
                'The gap between UK/Japan and India was largest in 2005 but narrowed by 2020',
            ],
            'svg' => $this->svg(620, 390, $body),
        ];
    }

    // ── 3. Pie chart — Student Time ──────────────────────────────────

    private function studentPieChart(): array
    {
        // Center (200,210), R=130. Angles clockwise from top.
        // Segments: Studying 35%, Sleeping 25%, Socialising 15%, Work 12%, Exercise 8%, Other 5%
        // Cumulative: 0, 126, 216, 270, 313.2, 342, 360
        // Pre-computed boundary points on circle (cx=200, cy=210, r=130):
        //   0°   → (200, 80)
        //   126° → (305, 286)
        //   216° → (124, 315)
        //   270° → (70, 210)
        //   313° → (106, 121)
        //   342° → (160, 87)

        $body = <<<'SVG'
  <text x="310" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#1a202c">How University Students Spend Their Time (% of waking hours)</text>

  <!-- pie slices -->
  <!-- Studying 35% (blue): 0° → 126° -->
  <path d="M 200 210 L 200 80 A 130 130 0 0 1 305 286 Z" fill="#3b82f6"/>
  <!-- Sleeping 25% (green): 126° → 216° -->
  <path d="M 200 210 L 305 286 A 130 130 0 0 1 124 315 Z" fill="#10b981"/>
  <!-- Socialising 15% (orange): 216° → 270° -->
  <path d="M 200 210 L 124 315 A 130 130 0 0 1 70 210 Z" fill="#f97316"/>
  <!-- Part-time work 12% (purple): 270° → 313.2° -->
  <path d="M 200 210 L 70 210 A 130 130 0 0 1 106 121 Z" fill="#8b5cf6"/>
  <!-- Exercise 8% (amber): 313.2° → 342° -->
  <path d="M 200 210 L 106 121 A 130 130 0 0 1 160 87 Z" fill="#f59e0b"/>
  <!-- Other 5% (gray): 342° → 360° -->
  <path d="M 200 210 L 160 87 A 130 130 0 0 1 200 80 Z" fill="#9ca3af"/>

  <!-- thin white borders between slices -->
  <path d="M 200 210 L 200 80"   stroke="white" stroke-width="1.5" fill="none"/>
  <path d="M 200 210 L 305 286"  stroke="white" stroke-width="1.5" fill="none"/>
  <path d="M 200 210 L 124 315"  stroke="white" stroke-width="1.5" fill="none"/>
  <path d="M 200 210 L 70 210"   stroke="white" stroke-width="1.5" fill="none"/>
  <path d="M 200 210 L 106 121"  stroke="white" stroke-width="1.5" fill="none"/>
  <path d="M 200 210 L 160 87"   stroke="white" stroke-width="1.5" fill="none"/>

  <!-- legend (right side) -->
  <rect x="370" y="100" width="14" height="14" fill="#3b82f6" rx="2"/>
  <text x="390" y="112" font-size="12" fill="#4a5568">Studying</text>
  <text x="510" y="112" font-size="12" fill="#718096" text-anchor="end">35%</text>

  <rect x="370" y="130" width="14" height="14" fill="#10b981" rx="2"/>
  <text x="390" y="142" font-size="12" fill="#4a5568">Sleeping</text>
  <text x="510" y="142" font-size="12" fill="#718096" text-anchor="end">25%</text>

  <rect x="370" y="160" width="14" height="14" fill="#f97316" rx="2"/>
  <text x="390" y="172" font-size="12" fill="#4a5568">Socialising</text>
  <text x="510" y="172" font-size="12" fill="#718096" text-anchor="end">15%</text>

  <rect x="370" y="190" width="14" height="14" fill="#8b5cf6" rx="2"/>
  <text x="390" y="202" font-size="12" fill="#4a5568">Part-time work</text>
  <text x="510" y="202" font-size="12" fill="#718096" text-anchor="end">12%</text>

  <rect x="370" y="220" width="14" height="14" fill="#f59e0b" rx="2"/>
  <text x="390" y="232" font-size="12" fill="#4a5568">Exercise</text>
  <text x="510" y="232" font-size="12" fill="#718096" text-anchor="end">8%</text>

  <rect x="370" y="250" width="14" height="14" fill="#9ca3af" rx="2"/>
  <text x="390" y="262" font-size="12" fill="#4a5568">Other</text>
  <text x="510" y="262" font-size="12" fill="#718096" text-anchor="end">5%</text>
SVG;

        return [
            'file'  => 'student-time-pie.svg',
            'title' => 'How University Students Spend Their Time',
            'type'  => 'chart',
            'topic' => 'Education',
            'level' => 'b1',
            'mode'  => 'both',
            'words' => 120,
            'seconds' => 90,
            'task' => 'The pie chart shows how university students in the UK divide their waking hours across six activities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
            'features' => [
                'Studying accounts for the largest share at 35%',
                'Sleeping is the second largest category (25%), which is unusual to see in a "waking hours" chart — worth noting',
                'Socialising (15%) and part-time work (12%) together account for over a quarter',
                'Exercise and other activities together represent only 13%',
                'General overview: most time is spent on academic and rest activities',
            ],
            'svg' => $this->svg(540, 380, $body),
        ];
    }

    // ── 4. Process diagram — Chocolate Manufacturing ─────────────────

    private function chocolateProcess(): array
    {
        $body = <<<'SVG'
  <text x="300" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#1a202c">How Chocolate is Manufactured</text>

  <!-- Step boxes: left column top→bottom, then right column bottom→top -->
  <!-- Left column (steps 1-4): x=30, widths=220, heights at y=55,130,205,280 -->

  <!-- Step 1 -->
  <rect x="30" y="55" width="220" height="45" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <text x="140" y="72" text-anchor="middle" font-size="11" font-weight="bold" fill="#92400e">1. Harvesting</text>
  <text x="140" y="88" text-anchor="middle" font-size="10" fill="#78350f">Cocoa pods picked from trees</text>

  <!-- arrow 1→2 -->
  <line x1="140" y1="100" x2="140" y2="125" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 2 -->
  <rect x="30" y="125" width="220" height="45" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <text x="140" y="142" text-anchor="middle" font-size="11" font-weight="bold" fill="#92400e">2. Fermentation &amp; Drying</text>
  <text x="140" y="158" text-anchor="middle" font-size="10" fill="#78350f">Beans fermented 5–7 days, then sun-dried</text>

  <!-- arrow 2→3 -->
  <line x1="140" y1="170" x2="140" y2="195" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 3 -->
  <rect x="30" y="195" width="220" height="45" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <text x="140" y="212" text-anchor="middle" font-size="11" font-weight="bold" fill="#92400e">3. Roasting</text>
  <text x="140" y="228" text-anchor="middle" font-size="10" fill="#78350f">Beans roasted to develop flavour</text>

  <!-- arrow 3→4 -->
  <line x1="140" y1="240" x2="140" y2="265" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 4 -->
  <rect x="30" y="265" width="220" height="45" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <text x="140" y="282" text-anchor="middle" font-size="11" font-weight="bold" fill="#92400e">4. Grinding</text>
  <text x="140" y="298" text-anchor="middle" font-size="10" fill="#78350f">Roasted beans ground into cocoa liquor</text>

  <!-- connector: step 4 → step 5 (right column) -->
  <path d="M 250 287 L 310 287" stroke="#6b7280" stroke-width="1.5" fill="none" marker-end="url(#arrow)"/>

  <!-- Right column (steps 5-8): x=310, going upward: y=265,195,125,55 -->

  <!-- Step 5 -->
  <rect x="310" y="265" width="220" height="45" rx="6" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="420" y="282" text-anchor="middle" font-size="11" font-weight="bold" fill="#4c1d95">5. Mixing</text>
  <text x="420" y="298" text-anchor="middle" font-size="10" fill="#3730a3">Cocoa liquor, sugar, milk powder added</text>

  <!-- arrow 5→6 (upward) -->
  <line x1="420" y1="265" x2="420" y2="240" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 6 -->
  <rect x="310" y="195" width="220" height="45" rx="6" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="420" y="212" text-anchor="middle" font-size="11" font-weight="bold" fill="#4c1d95">6. Conching</text>
  <text x="420" y="228" text-anchor="middle" font-size="10" fill="#3730a3">Mixture kneaded for smoothness</text>

  <!-- arrow 6→7 -->
  <line x1="420" y1="195" x2="420" y2="170" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 7 -->
  <rect x="310" y="125" width="220" height="45" rx="6" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="420" y="142" text-anchor="middle" font-size="11" font-weight="bold" fill="#4c1d95">7. Tempering</text>
  <text x="420" y="158" text-anchor="middle" font-size="10" fill="#3730a3">Chocolate cooled and reheated precisely</text>

  <!-- arrow 7→8 -->
  <line x1="420" y1="125" x2="420" y2="100" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 8 -->
  <rect x="310" y="55" width="220" height="45" rx="6" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="420" y="72" text-anchor="middle" font-size="11" font-weight="bold" fill="#4c1d95">8. Moulding &amp; Packaging</text>
  <text x="420" y="88" text-anchor="middle" font-size="10" fill="#3730a3">Poured into moulds, cooled, wrapped</text>

  <!-- arrowhead marker -->
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 Z" fill="#6b7280"/>
    </marker>
  </defs>

  <!-- stage labels -->
  <text x="140" y="345" text-anchor="middle" font-size="10" fill="#9ca3af" font-style="italic">Raw material processing</text>
  <text x="420" y="345" text-anchor="middle" font-size="10" fill="#9ca3af" font-style="italic">Manufacturing &amp; finishing</text>
SVG;

        return [
            'file'  => 'chocolate-process-diagram.svg',
            'title' => 'The Process of Chocolate Manufacturing',
            'type'  => 'diagram',
            'topic' => 'Food & Industry',
            'level' => 'c1',
            'mode'  => 'both',
            'words' => 160,
            'seconds' => 120,
            'task' => 'The diagram illustrates the process by which cocoa beans are transformed into finished chocolate. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
            'features' => [
                'Clear beginning and end: starts with harvesting, ends with moulding and packaging',
                'Two distinct stages: raw material processing (steps 1–4) and manufacturing (steps 5–8)',
                'The role of fermentation and drying in developing flavour',
                'Conching and tempering as key quality steps in the manufacturing stage',
                'Passive voice and sequencing language: "is harvested", "is then fermented", "before being"',
            ],
            'svg' => $this->svg(560, 370, $body),
        ];
    }

    // ── 5. Map — Town Development ────────────────────────────────────

    private function townMap(): array
    {
        $body = <<<'SVG'
  <text x="300" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#1a202c">Riverside District: Before (2005) and After (2020) Development</text>

  <!-- Left map: 2005 -->
  <text x="145" y="52" text-anchor="middle" font-size="12" font-weight="bold" fill="#4a5568">2005 — Before</text>
  <rect x="20" y="60" width="250" height="270" rx="4" fill="#f7fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- roads (2005) -->
  <rect x="20"  y="167" width="250" height="16" fill="#e2e8f0"/>
  <rect x="120" y="60"  width="16"  height="270" fill="#e2e8f0"/>

  <!-- river (bottom) -->
  <rect x="20" y="300" width="250" height="30" rx="0" fill="#bfdbfe"/>
  <text x="145" y="320" text-anchor="middle" font-size="10" fill="#1d4ed8">River</text>

  <!-- 2005 blocks: industrial/warehouses (gray-dark) -->
  <!-- Top left quadrant -->
  <rect x="30"  y="70"  width="80"  height="88" rx="3" fill="#94a3b8"/>
  <text x="70"  y="110" text-anchor="middle" font-size="9" fill="#f8fafc">Warehouse</text>
  <text x="70"  y="122" text-anchor="middle" font-size="9" fill="#f8fafc">District</text>
  <rect x="120" y="70"  width="80"  height="40" rx="3" fill="#94a3b8"/>
  <text x="160" y="95"  text-anchor="middle" font-size="9" fill="#f8fafc">Factory A</text>
  <rect x="210" y="70"  width="50"  height="88" rx="3" fill="#78716c"/>
  <text x="235" y="110" text-anchor="middle" font-size="9" fill="#f8fafc">Mill</text>

  <!-- Top right, middle -->
  <rect x="120" y="118" width="130" height="40" rx="3" fill="#94a3b8"/>
  <text x="185" y="143" text-anchor="middle" font-size="9" fill="#f8fafc">Factory B</text>

  <!-- Bottom left quadrant -->
  <rect x="30"  y="190" width="80"  height="100" rx="3" fill="#a8a29e"/>
  <text x="70"  y="235" text-anchor="middle" font-size="9" fill="#f8fafc">Derelict</text>
  <text x="70"  y="247" text-anchor="middle" font-size="9" fill="#f8fafc">Land</text>

  <!-- Bottom right quadrant -->
  <rect x="120" y="190" width="140" height="100" rx="3" fill="#a8a29e"/>
  <text x="190" y="235" text-anchor="middle" font-size="9" fill="#f8fafc">Empty</text>
  <text x="190" y="247" text-anchor="middle" font-size="9" fill="#f8fafc">Lot</text>

  <!-- Right map: 2020 -->
  <text x="455" y="52" text-anchor="middle" font-size="12" font-weight="bold" fill="#4a5568">2020 — After</text>
  <rect x="330" y="60" width="250" height="270" rx="4" fill="#f7fafc" stroke="#e2e8f0" stroke-width="1.5"/>

  <!-- roads (2020) -->
  <rect x="330" y="167" width="250" height="16" fill="#e2e8f0"/>
  <rect x="430" y="60"  width="16"  height="270" fill="#e2e8f0"/>

  <!-- river (bottom, cleaner with path) -->
  <rect x="330" y="300" width="250" height="30" rx="0" fill="#bfdbfe"/>
  <rect x="330" y="290" width="250" height="12" rx="0" fill="#bbf7d0"/>
  <text x="455" y="320" text-anchor="middle" font-size="10" fill="#1d4ed8">River</text>
  <text x="455" y="304" text-anchor="middle" font-size="8"  fill="#166534">Riverside Walk</text>

  <!-- 2020 blocks -->
  <!-- Park (top left) -->
  <rect x="340" y="70"  width="80"  height="88" rx="3" fill="#86efac"/>
  <text x="380" y="108" text-anchor="middle" font-size="9" fill="#166534">Riverside</text>
  <text x="380" y="120" text-anchor="middle" font-size="9" fill="#166534">Park</text>
  <!-- trees -->
  <circle cx="355" cy="78"  r="6" fill="#4ade80"/>
  <circle cx="375" cy="76"  r="7" fill="#4ade80"/>
  <circle cx="398" cy="80"  r="5" fill="#4ade80"/>
  <circle cx="415" cy="77"  r="6" fill="#4ade80"/>

  <!-- Apartments (top right) -->
  <rect x="446" y="70"  width="80"  height="88" rx="3" fill="#c7d2fe"/>
  <text x="486" y="110" text-anchor="middle" font-size="9" fill="#3730a3">New</text>
  <text x="486" y="122" text-anchor="middle" font-size="9" fill="#3730a3">Apartments</text>
  <rect x="510" y="70" width="60" height="88" rx="3" fill="#a5b4fc"/>
  <text x="540" y="110" text-anchor="middle" font-size="9" fill="#3730a3">Flats</text>

  <!-- Shopping (bottom left) -->
  <rect x="340" y="190" width="80"  height="100" rx="3" fill="#fde68a"/>
  <text x="380" y="232" text-anchor="middle" font-size="9" fill="#92400e">Shopping</text>
  <text x="380" y="244" text-anchor="middle" font-size="9" fill="#92400e">Centre</text>

  <!-- School / Community (bottom right) -->
  <rect x="446" y="190" width="130" height="100" rx="3" fill="#fbcfe8"/>
  <text x="511" y="232" text-anchor="middle" font-size="9" fill="#831843">Community</text>
  <text x="511" y="244" text-anchor="middle" font-size="9" fill="#831843">Hub &amp; School</text>

  <!-- divider and arrow -->
  <line x1="290" y1="150" x2="320" y2="150" stroke="#6b7280" stroke-width="2" marker-end="url(#mapArrow)"/>
  <defs>
    <marker id="mapArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 Z" fill="#6b7280"/>
    </marker>
  </defs>

  <!-- Map key -->
  <rect x="20" y="345" width="12" height="12" fill="#86efac" rx="2"/>
  <text x="36" y="356" font-size="10" fill="#4a5568">Green space</text>
  <rect x="120" y="345" width="12" height="12" fill="#c7d2fe" rx="2"/>
  <text x="136" y="356" font-size="10" fill="#4a5568">Residential</text>
  <rect x="220" y="345" width="12" height="12" fill="#fde68a" rx="2"/>
  <text x="236" y="356" font-size="10" fill="#4a5568">Commercial</text>
  <rect x="330" y="345" width="12" height="12" fill="#94a3b8" rx="2"/>
  <text x="346" y="356" font-size="10" fill="#4a5568">Industrial (former)</text>
SVG;

        return [
            'file'  => 'town-development-map.svg',
            'title' => 'Riverside District: Before and After Development',
            'type'  => 'map',
            'topic' => 'Urban Development',
            'level' => 'b2',
            'mode'  => 'both',
            'words' => 150,
            'seconds' => 120,
            'task' => 'The maps show the Riverside District in 2005 and following its redevelopment in 2020. Summarise the changes by selecting and reporting the main features, and make comparisons where relevant.',
            'features' => [
                'The industrial warehouses and factories were demolished and replaced',
                'A riverside park was created in the top-left area where the main warehouse stood',
                'New residential apartments were built on the top-right',
                'The derelict land in the bottom half became a shopping centre and community hub',
                'A riverside walk was added alongside the river in 2020',
                'Use change language: "replaced by", "converted into", "where X once stood"',
            ],
            'svg' => $this->svg(600, 380, $body),
        ];
    }

    // ── 6. Photo — Market Scene ───────────────────────────────────────

    private function marketScene(): array
    {
        $body = <<<'SVG'
  <!-- sky -->
  <rect x="0" y="0" width="620" height="200" fill="#e0f2fe" rx="6"/>
  <!-- ground -->
  <rect x="0" y="200" width="620" height="200" fill="#fef9f0"/>

  <!-- background buildings -->
  <rect x="0"   y="80"  width="100" height="140" fill="#cbd5e0"/>
  <rect x="10"  y="90"  width="20"  height="30"  fill="#93c5fd"/>
  <rect x="40"  y="90"  width="20"  height="30"  fill="#93c5fd"/>
  <rect x="70"  y="90"  width="20"  height="30"  fill="#93c5fd"/>
  <rect x="10"  y="135" width="20"  height="30"  fill="#93c5fd"/>
  <rect x="40"  y="135" width="20"  height="30"  fill="#93c5fd"/>

  <rect x="110" y="70"  width="130" height="150" fill="#e2e8f0"/>
  <rect x="120" y="80"  width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="155" y="80"  width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="190" y="80"  width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="120" y="130" width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="155" y="130" width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="190" y="130" width="25"  height="35"  fill="#bfdbfe"/>

  <rect x="490" y="75"  width="130" height="145" fill="#e2e8f0"/>
  <rect x="500" y="85"  width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="535" y="85"  width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="570" y="85"  width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="500" y="130" width="25"  height="35"  fill="#bfdbfe"/>
  <rect x="535" y="130" width="25"  height="35"  fill="#bfdbfe"/>

  <!-- market stall 1 (left, red canopy) -->
  <polygon points="40,160 40,200 180,200 180,160" fill="#ef4444" opacity="0.9"/>
  <polygon points="30,155 35,175 185,175 190,155" fill="#dc2626"/>
  <rect x="60"  y="175" width="4" height="50" fill="#92400e"/>
  <rect x="160" y="175" width="4" height="50" fill="#92400e"/>
  <!-- stall table -->
  <rect x="45" y="195" width="140" height="12" rx="2" fill="#d97706"/>
  <!-- produce -->
  <circle cx="60"  cy="192" r="7" fill="#fbbf24"/>
  <circle cx="75"  cy="192" r="7" fill="#f97316"/>
  <circle cx="90"  cy="192" r="7" fill="#ef4444"/>
  <circle cx="105" cy="192" r="7" fill="#fbbf24"/>
  <circle cx="120" cy="192" r="7" fill="#84cc16"/>
  <circle cx="135" cy="192" r="7" fill="#f97316"/>
  <circle cx="150" cy="192" r="7" fill="#ef4444"/>
  <text x="115" y="220" text-anchor="middle" font-size="9" fill="#78350f">Fruit &amp; Veg</text>

  <!-- market stall 2 (centre, blue canopy) -->
  <polygon points="220,155 220,200 400,200 400,155" fill="#3b82f6" opacity="0.9"/>
  <polygon points="210,150 215,172 405,172 410,150" fill="#2563eb"/>
  <rect x="240" y="172" width="4" height="50" fill="#1e3a8a"/>
  <rect x="380" y="172" width="4" height="50" fill="#1e3a8a"/>
  <rect x="225" y="192" width="180" height="12" rx="2" fill="#d97706"/>
  <!-- bread/baked goods -->
  <ellipse cx="250" cy="190" rx="14" ry="8" fill="#d97706"/>
  <ellipse cx="278" cy="190" rx="14" ry="8" fill="#d97706"/>
  <ellipse cx="306" cy="190" rx="12" ry="7" fill="#92400e"/>
  <ellipse cx="330" cy="190" rx="14" ry="8" fill="#d97706"/>
  <ellipse cx="358" cy="190" rx="12" ry="7" fill="#92400e"/>
  <text x="308" y="220" text-anchor="middle" font-size="9" fill="#1e3a8a">Bakery &amp; Deli</text>

  <!-- market stall 3 (right, green canopy) -->
  <polygon points="430,158 430,200 590,200 590,158" fill="#10b981" opacity="0.9"/>
  <polygon points="420,153 425,176 595,176 600,153" fill="#059669"/>
  <rect x="450" y="176" width="4" height="50" fill="#064e3b"/>
  <rect x="573" y="176" width="4" height="50" fill="#064e3b"/>
  <rect x="435" y="193" width="160" height="12" rx="2" fill="#d97706"/>
  <!-- flowers -->
  <circle cx="455" cy="190" r="8" fill="#f9a8d4"/>
  <circle cx="475" cy="190" r="8" fill="#fbbf24"/>
  <circle cx="495" cy="190" r="8" fill="#c084fc"/>
  <circle cx="515" cy="190" r="8" fill="#f9a8d4"/>
  <circle cx="535" cy="190" r="8" fill="#fbbf24"/>
  <circle cx="555" cy="190" r="8" fill="#c084fc"/>
  <text x="507" y="220" text-anchor="middle" font-size="9" fill="#064e3b">Flowers &amp; Plants</text>

  <!-- people (simplified silhouettes) -->
  <!-- person 1 -->
  <circle cx="190" cy="205" r="8" fill="#d97706"/>
  <rect x="185" y="213" width="10" height="22" rx="3" fill="#3b82f6"/>
  <!-- person 2 -->
  <circle cx="210" cy="208" r="7" fill="#92400e"/>
  <rect x="205" y="215" width="10" height="20" rx="3" fill="#ef4444"/>
  <!-- person 3 (carrying bag) -->
  <circle cx="408" cy="203" r="8" fill="#d97706"/>
  <rect x="403" y="211" width="10" height="22" rx="3" fill="#8b5cf6"/>
  <rect x="413" y="218" width="12" height="10" rx="2" fill="#fbbf24"/>
  <!-- person 4 -->
  <circle cx="428" cy="207" r="7" fill="#78350f"/>
  <rect x="423" y="214" width="10" height="20" rx="3" fill="#10b981"/>
  <!-- person 5 (small, child) -->
  <circle cx="320" cy="215" r="6" fill="#d97706"/>
  <rect x="316" y="221" width="8"  height="18" rx="3" fill="#f97316"/>

  <!-- ground shadow under stalls -->
  <ellipse cx="115" cy="222" rx="75"  ry="6" fill="#94a3b8" opacity="0.2"/>
  <ellipse cx="310" cy="222" rx="90"  ry="6" fill="#94a3b8" opacity="0.2"/>
  <ellipse cx="510" cy="222" rx="75"  ry="6" fill="#94a3b8" opacity="0.2"/>

  <!-- sun -->
  <circle cx="570" cy="40" r="22" fill="#fbbf24" opacity="0.8"/>

  <!-- caption -->
  <rect x="0" y="360" width="620" height="40" fill="#1e293b" opacity="0.05" rx="0"/>
  <text x="310" y="378" text-anchor="middle" font-size="10" fill="#64748b" font-style="italic">An outdoor street market on a sunny day</text>
SVG;

        return [
            'file'  => 'outdoor-market-photo.svg',
            'title' => 'A Busy Outdoor Street Market',
            'type'  => 'photo',
            'topic' => 'Daily Life',
            'level' => 'b1',
            'mode'  => 'speaking',
            'words' => 0,
            'seconds' => 90,
            'task' => 'Look at the image showing an outdoor street market. Describe what you can see — the setting, the stalls, the products, and the people. Speak for about 90 seconds.',
            'features' => [
                'Three market stalls with coloured canopies (red, blue, green)',
                'Different products: fruit and vegetables, bakery/deli, flowers and plants',
                'Several people browsing and shopping',
                'The outdoor setting with buildings in the background',
                'The sunny atmosphere and general busy feeling',
            ],
            'svg' => $this->svg(620, 400, $body),
        ];
    }
}
