# Design System Specification

## 1. Overview & Creative North Star: "The Digital Obsidian"

This design system is engineered to feel less like a software interface and more like a high-end physical object—weighty, precise, and authoritative. Our Creative North Star is **"The Digital Obsidian."** Like the volcanic glass it’s named after, the UI should feel dark, sleek, and sharp, with depth emerging from light reflecting off polished surfaces rather than artificial lines.

We move beyond the "standard SaaS" look by rejecting the rigid 1px border. Instead, we use intentional asymmetry, expansive negative space, and a sophisticated layering of dark tones to establish trust and professionalism. The experience is editorial; it prioritizes content through massive typographic contrast and allows the vibrant accent blue to act as a laser-focused guide for the user’s intent.

---

## 2. Colors: Tonal Architecture

In this system, color is used to define space. We utilize a monochromatic base with a high-energy blue to signify "action" and "precision."

### The Palette
- **Background (`surface`):** `#131313` – The void from which all elements emerge.
- **Primary Action (`tertiary`):** `#0A84FF` – A vibrant blue used exclusively for critical interactions.
- **Surface Accents (`primary`):** `#FFFFFF` – Used for maximum legibility and high-contrast headlines.
- **Secondary Neutral (`secondary_container`):** `#474649` – Used for subtle interactive states.

### Core Rules for Application
* **The "No-Line" Rule:** Prohibit the use of 1px solid borders for sectioning. Structural boundaries must be defined solely through background shifts. For instance, a `surface_container_low` section sitting against a `surface` background creates a natural, sophisticated edge.
* **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of glass.
* *Base:* `surface` (`#131313`)
* *Section:* `surface_container_low` (`#1B1B1B`)
* *Component:* `surface_container` (`#1F1F1F`)
* *Active/Hover:* `surface_container_high` (`#2A2A2A`)
* **The "Glass & Gradient" Rule:** Main CTAs and featured hero areas should utilize a subtle linear gradient (from `tertiary` to `tertiary_container`) to provide "soul" and depth. Floating modals or navigation bars must use semi-transparent `surface_container_highest` with a **24px backdrop blur** to maintain environmental context.

---

## 3. Typography: Editorial Authority

We use **Inter** to bridge the gap between technical precision and human readability. The hierarchy is extreme, utilizing large scale differences to create an editorial feel.

* **Display (lg/md/sm):** 3.5rem to 2.25rem. Used for hero statements. Kerned tightly (-2%) to feel bespoke.
* **Headline (lg/md/sm):** 2rem to 1.5rem. Bold and authoritative. These act as the primary anchors for the user’s eye.
* **Title (lg/md/sm):** 1.375rem to 1rem. Used for card headers and section titles.
* **Body (lg/md/sm):** 1rem to 0.75rem. The "workhorse" text. Use `on_surface_variant` (`#C0C6D6`) for secondary body text to reduce visual noise.
* **Label (md/sm):** 0.75rem to 0.6875rem. All-caps with +5% letter spacing for functional metadata.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are largely replaced by **Tonal Layering**. We communicate "upward" movement through lightness, not just shadows.

* **The Layering Principle:** To lift an element, move it one step up the `surface_container` scale. A `surface_container_lowest` card placed on a `surface` background creates a soft, natural lift without the "dirty" look of a black shadow.
* **Ambient Shadows:** For floating elements (like dropdowns), use a "Shadow-Glow." A massive 40px blur at 6% opacity using the `on_surface` color. This mimics a soft light source hitting a dark object.
* **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a **Ghost Border**: `outline_variant` (`#414754`) at 20% opacity. Never use 100% opaque borders.
* **Roundedness:**
* **LG (1rem/16px):** Standard for cards and containers.
* **MD (0.75rem/12px):** Standard for buttons and input fields.
* **Full (9999px):** Exclusively for tags and pills.

---

## 5. Components: Precision Primitives

### Buttons
* **Primary:** Background `tertiary` (`#0A84FF`), Text `on_tertiary` (`#FFFFFF`). Roundedness `md`. No border.
* **Secondary:** Background `surface_container_high`, Text `on_surface`.
* **Tertiary/Ghost:** No background. Text `tertiary` blue. High-intent, low-weight.

### Input Fields
* **Default:** `surface_container_lowest` background with a 1px Ghost Border.
* **Focus:** Border shifts to 100% opacity `tertiary` blue with a subtle 4px outer "glow" (blur).
* **Validation:** Error states use `error` (`#FFB4AB`) text and a matching ghost border.

### Cards & Lists
* **Rule:** Forbid divider lines.
* **Implementation:** Separate list items using `spacing-4` (1rem) and a background shift on hover (`surface_container_low`). In a marketplace context, use "Asymmetric Padding"—more padding at the top than the bottom—to create a sense of elegant "weight."

### Floating Marketplace Nav
* A "Dock" style component. Background: `surface_container_highest` at 80% opacity. 24px Backdrop Blur. `Rounded-full`. Icons use `on_surface_variant` and switch to `tertiary` blue when active.

---

## 6. Do’s and Don’ts

### Do
* **Do** use `spacing-12` and `spacing-16` (large gaps) to separate major sections. White space is a luxury signal.
* **Do** use "Optical Alignment." Sometimes a button needs to be 1px higher than its neighbor to *look* centered in a dark UI.
* **Do** prioritize typography over icons. Let the words do the heavy lifting.

### Don’t
* **Don’t** use pure black (`#000000`) for anything other than the base background. It kills the sense of depth in components.
* **Don’t** use high-contrast dividers. If you feel you need a line, use a background color shift instead.
* **Don’t** use "Alert Red" for everything. Reserve high-contrast colors for moments where the user's workflow is truly broken.