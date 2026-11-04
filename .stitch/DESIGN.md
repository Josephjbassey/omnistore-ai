# Design System: OmniStore AI (Micro-Commerce Engine)

## 1. Visual Theme & Atmosphere
An authentic, culturally grounded, executive-grade micro-commerce design system tailored for emerging market stall merchants and informal retail traders.
Moves completely away from generic "AI purple/neon cyan sci-fi" tropes into a tactile, trustworthy, high-agency physical-to-digital commerce experience.
The visual character is warm, clean, and engineered: deep charcoal and slate surfaces punctuated by authentic African market earth tones (terracotta, warm sand ochre, slate teal, olive sage) and focused WhatsApp commerce emerald.

## 2. Color Palette & Roles (Calibrated with Authentic Stall & Inspiration Identity)
- **Obsidian Canvas** (`#080a0f` / `#0b0e14`) — Primary background medium; prevents eye strain while giving rich contrast to product imagery.
- **Merchant Panel Surface** (`#111622` / `#131826`) — Card and module container fill.
- **Elevated Surface** (`#182030`) — Active/hover states, elevated modals, sticky checkouts.
- **Terracotta Amber** (`#c1793f`) — Signature primary brand accent; reflects natural market earth, spices, and pottery.
- **Warm Sand Ochre** (`#cab695`) — Subtle category labels, price tags, and secondary borders.
- **Deep Slate Teal** (`#526569`) — Structural accents, location pins, and secondary telemetry badges.
- **WhatsApp Emerald** (`#25D366` / `#10b981`) — Dedicated strictly to checkout actions, live order routing, and active stock status.
- **Olive Sage** (`#788166`) — Inventory health and stock abundance tags.
- **Crimson Rust** (`#975151`) — Low-stock indicators and urgent alerts.
- **Whisper Border** (`rgba(255, 255, 255, 0.08)` / `rgba(202, 182, 149, 0.15)`) — Precision 1px structural dividing lines.

## 3. Typography Architecture
- **Display / Headlines:** Geist / Cabinet Grotesk font stack, tight letter tracking (`tracking-tight`), weight-driven hierarchy (`font-bold` and `font-semibold`), no loud all-caps shouting.
- **Body & Captions:** Inter / Geist regular, relaxed line-heights (`leading-relaxed`), max-width 65 characters per line for readability.
- **Monospace Stack:** Geist Mono / JetBrains Mono exclusively for numerical prices (`tabular-nums`), SKU counts, coordinates, and phone numbers.
- **Banned Typography:** Generic serif fonts in software dashboard views; random font-size scaling without weight differentiation.

## 4. E-Commerce Component Stylings
- **Product Cards:** Generous 16px border radii, high-contrast imagery, inline editable pricing in local currency (`NGN ₦`), stock stepper controls (`- 1 +`), clean "In Stock" indicators.
- **Primary Buttons:** Tactile `-1px` translate on active click (`active:scale-[0.98]`). High contrast, solid backgrounds with subtle inner border highlights. No blinding neon glows.
- **Mobile Camera & Upload Triggers:** Prominent, friendly, friction-free action buttons ("Take Stall Photo", "Upload Picture", "Scan & Update Inventory").
- **WhatsApp Checkout Drawer:** High-converting, floating order summary bar (`Order on WhatsApp`) with direct `wa.me/234...` deep linking and pre-filled itemized shopping carts.

## 5. Dual-Mode UX Separation
- **Store Owner Mode (`merchant`):** Completely non-technical. Clean product grid, camera snap trigger, price adjustments, and WhatsApp store link. Zero model names, zero latency numbers, zero raw JSON contracts.
- **Judge Mode (`judge`):** High-density technical telemetry inspector. Exposes SAM 3.1 polygon overlays, Muse Spark multimodal pricing logic, and Muse Code AST synthesis.

## 6. Anti-Patterns (Banned Clichés)
- NO generic AI purple-to-pink mesh gradients or glowing cybernetic borders.
- NO emoji icons in place of professional vector glyphs.
- NO duplicate headers or stacked navigation bars.
- NO centered, empty hero sections with meaningless AI filler buzzwords ("Unleash", "Next-Gen", "Seamless").
- NO fake statistics or fabricated benchmarks.
