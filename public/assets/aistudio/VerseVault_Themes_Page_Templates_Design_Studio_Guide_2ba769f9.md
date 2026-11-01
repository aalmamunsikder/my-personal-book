# VerseVault — Book Themes, Page Templates & Visual Customization System
## Complete design-system and implementation guide for a deeply customizable personal diary

**Product:** VerseVault  
**Product model:** Private, single-owner diary and literary archive  
**Core stack:** Lovable React + TypeScript + Vite, Supabase, Vercel  
**Primary writing languages:** Bangla and English  
**Design direction:** Personal literary journal, warm paper, refined typography, quiet visual details  
**Companion documents:**
- `VerseVault_Personal_Diary_Lovable_Spec.md`
- `VerseVault_QA_Testing_and_Release_Checklist.md`
- `VerseVault_Features_Implementation_UX_Vercel_Guide.md`
- `VerseVault_AI_Features_Privacy_Implementation_Guide.md`

> **Purpose:** Give VerseVault a rich library of book covers, page styles, layouts, themes, color palettes, typography, and personal presets—without compromising readability, writing speed, accessibility, or content integrity.

---

# 1. Product vision: make every page feel personal

VerseVault should feel like a collection of beautiful personal notebooks. The owner should be able to choose how a diary page, poem, quote, or collection looks and feels.

The customization experience should provide:
- Several complete visual themes.
- Multiple paper/page surfaces.
- Multiple page layouts for different writing types.
- Several typography pairings and reading presets.
- Book/collection cover designs.
- Accent colors and ink colors.
- Page margins, line spacing, and reading width.
- Optional borders, dividers, ornaments, and subtle textures.
- A live desktop and mobile preview.
- Ability to save custom themes and restore defaults.

The result should feel like a beautifully curated library, not a generic color-settings page.

## 1.1 Main recommendation: separate customization into four layers

Do not create one giant “theme” setting where every choice is mixed together. Use four independent layers:

<box>
  <escape> </escape>
</box>

| Layer | Controls | Example |
|---|---|---|
| **1. App Theme** | Sidebar, app background, toolbar, dialogs, general UI colors | Warm Archive |
| **2. Book / Collection Cover** | Cover art, cover color, title treatment, collection identity | Botanical Notebook |
| **3. Page Template** | Page composition, margins, rules, columns, title placement | Poetry Manuscript |
| **4. Reading Typography** | Bangla/English font, font size, line height, text width, alignment | Literary Comfort |

This separation is the most important architecture decision in this document.

A user should be able to use the Botanical cover with a Clean Paper page, or a Midnight theme with a Classic Journal layout. Presets can bundle all four layers, but the layers must remain independently configurable.

## 1.2 What “book” means in VerseVault

VerseVault is a personal diary, not an ebook publishing platform. In this specification:
- A **book** is the visual identity of the personal journal or a themed collection.
- A **collection** is the content grouping already supported by VerseVault.
- A collection may optionally have its own cover and page-theme override.
- The owner does not need a separate complex book-management system for the MVP.

Do not create a duplicate content model called Books unless a real product requirement appears. Reuse Collections as themed notebooks.

---

# 2. Design philosophy and guardrails

## 2.1 The design should feel like a real literary object

Recommended visual qualities:
- Warm, paper-like surfaces.
- Carefully selected ink colors.
- Fine borders and subtle page edges.
- Elegant serif titles where appropriate.
- Script-aware Bangla typography.
- Tactile but restrained cover treatments.
- Thoughtful whitespace.
- Calm transitions.
- Beautiful reading view.

Avoid:
- Heavy fake leather textures behind every screen.
- Excessive shadows and 3D page-turn effects.
- Low-contrast beige-on-beige text.
- Large decorative flowers behind writing.
- Decorative handwriting fonts for body text.
- Bright gradients and generic SaaS-blue controls.
- Too many visual options on the writing screen.
- Different random typography on every page.

## 2.2 Keep writing content separate from presentation

The entry body must remain plain text (or an explicitly supported content representation) independent of page theme.

Never insert:
- Decorative separators into the saved writing.
- Page numbers into the content.
- Generated borders or ornamental characters.
- Theme-specific markup into the original body.
- Background texture data into the writing record.

A theme is a presentation layer. Changing the theme must never alter the actual words.

## 2.3 Three levels of customization

Offer simple-to-advanced choices:

**Quick Style**
- Choose a preset.
- Immediately see a preview.
- Apply globally or to a collection.

**Customize**
- Change paper, palette, font, layout, and ornaments individually.

**Advanced**
- Create custom colors.
- Adjust margins and line spacing.
- Save named presets.
- Reset individual sections.

The majority of users should not need Advanced settings.

---

# 3. Complete visual theme library

Create a curated library with at least 8 ready-to-use theme presets. Each preset must define all required color tokens and be tested for text contrast.

Use the suggested hex values as design starting points, not as a guarantee that every combination passes accessibility checks. Run contrast calculations on all actual foreground/background pairs before release.

## 3.1 Theme 01 — Heritage Parchment

<badge color="success">Recommended default</badge>

A classic, warm literary diary. This should be the default VerseVault experience.

| Token | Color |
|---|---|
| App background | `#EDE4D6` |
| Page surface | `#FFF9EF` |
| Secondary surface | `#F4EBDD` |
| Primary ink | `#30261F` |
| Secondary ink | `#66584C` |
| Muted ink | `#817366` |
| Accent | `#754832` |
| Accent soft | `#E8D5C3` |
| Border/rule | `#DCCDBB` |
| UI dark surface | `#38271F` |
| UI dark text | `#F8EEDC` |

Paper: warm cotton / light parchment.  
Best for: diary entries, poems, personal memories.

## 3.2 Theme 02 — Botanical Journal

Soft natural greens, pale parchment, and muted olive.

| Token | Color |
|---|---|
| App background | `#E9EDE3` |
| Page surface | `#FAFCF5` |
| Secondary surface | `#F0F3E9` |
| Primary ink | `#263329` |
| Secondary ink | `#52604F` |
| Muted ink | `#6E7A68` |
| Accent | `#526B4D` |
| Accent soft | `#DCE6D5` |
| Border/rule | `#D2DCCB` |
| UI dark surface | `#27372B` |
| UI dark text | `#F2F4E9` |

Paper: clean botanical paper.  
Best for: nature writing, reflections, memories.

## 3.3 Theme 03 — Midnight Library

A dark reading atmosphere with warm paper-like content surfaces or a fully dark page option.

| Token | Color |
|---|---|
| App background | `#1C201F` |
| Page surface | `#292E2B` |
| Secondary surface | `#323834` |
| Primary ink | `#F3EBDD` |
| Secondary ink | `#D0C5B4` |
| Muted ink | `#B4A995` |
| Accent | `#C29368` |
| Accent soft | `#4B3B2D` |
| Border/rule | `#4C514A` |
| UI dark surface | `#171A19` |
| UI dark text | `#F5EDE0` |

Paper: dark slate / night paper.  
Best for: night writing and focused reading.

Important: Do not simply invert every light-theme color. Check code blocks, dialogs, form controls, images, and status badges individually.

## 3.4 Theme 04 — Rosewood Letters

Muted rose, warm blush pages, and deep plum-brown ink.

| Token | Color |
|---|---|
| App background | `#F1E5E1` |
| Page surface | `#FFF8F5` |
| Secondary surface | `#F7ECE8` |
| Primary ink | `#382724` |
| Secondary ink | `#705650` |
| Muted ink | `#856D66` |
| Accent | `#8B5149` |
| Accent soft | `#F0DAD4` |
| Border/rule | `#E4CFC8` |
| UI dark surface | `#422D2A` |
| UI dark text | `#FFF2EC` |

Paper: soft rose stationery.  
Best for: letters, personal reflections, romantic writing.

## 3.5 Theme 05 — Ocean & Ink

Cool blue-gray paper with deep navy ink.

| Token | Color |
|---|---|
| App background | `#E6EDF0` |
| Page surface | `#F8FCFD` |
| Secondary surface | `#EDF3F5` |
| Primary ink | `#202F39` |
| Secondary ink | `#4D606A` |
| Muted ink | `#697B84` |
| Accent | `#355F73` |
| Accent soft | `#D7E6EC` |
| Border/rule | `#CCDCE3` |
| UI dark surface | `#203642` |
| UI dark text | `#EDF5F7` |

Paper: cool cotton.  
Best for: philosophical notes, quiet and reflective writing.

## 3.6 Theme 06 — Old Library

Deep burgundy, ivory paper, and archival library details.

| Token | Color |
|---|---|
| App background | `#E9DFD1` |
| Page surface | `#FFF9ED` |
| Secondary surface | `#F1E7D8` |
| Primary ink | `#33221F` |
| Secondary ink | `#66504A` |
| Muted ink | `#806A62` |
| Accent | `#6F2F35` |
| Accent soft | `#EAD7D5` |
| Border/rule | `#D9C7B6` |
| UI dark surface | `#3B2227` |
| UI dark text | `#F8EBDD` |

Paper: aged ivory.  
Best for: poetry collections and literary archive covers.

## 3.7 Theme 07 — Minimal Chalk

A restrained neutral theme for people who want fewer decorative elements.

| Token | Color |
|---|---|
| App background | `#ECEBE7` |
| Page surface | `#FFFFFF` |
| Secondary surface | `#F5F4F1` |
| Primary ink | `#242424` |
| Secondary ink | `#555555` |
| Muted ink | `#707070` |
| Accent | `#55514B` |
| Accent soft | `#E8E6E1` |
| Border/rule | `#DDDBD5` |
| UI dark surface | `#282725` |
| UI dark text | `#F6F5F1` |

Paper: smooth white.  
Best for: distraction-free writing and long prose.

## 3.8 Theme 08 — Desert Clay

Warm terracotta, sandstone, and earthy ink.

| Token | Color |
|---|---|
| App background | `#EFE3D6` |
| Page surface | `#FFF9F1` |
| Secondary surface | `#F4E9DE` |
| Primary ink | `#342821` |
| Secondary ink | `#6B5547` |
| Muted ink | `#826B5C` |
| Accent | `#A3543B` |
| Accent soft | `#F1DCCF` |
| Border/rule | `#E0CABB` |
| UI dark surface | `#412C24` |
| UI dark text | `#FFF1E5` |

Paper: sandstone / recycled cream.  
Best for: personal notes and warm, nostalgic pages.

## 3.9 Theme 09 — Lavender Nocturne (optional)

A subdued lavender-gray reading atmosphere.

| Token | Color |
|---|---|
| App background | `#ECE8F1` |
| Page surface | `#FBF9FE` |
| Secondary surface | `#F2EEF7` |
| Primary ink | `#30283B` |
| Secondary ink | `#625672` |
| Muted ink | `#786C86` |
| Accent | `#68517F` |
| Accent soft | `#E6DDEE` |
| Border/rule | `#D9D0E3` |
| UI dark surface | `#342B40` |
| UI dark text | `#F6F0FC` |

Paper: pale lavender cotton.  
Best for: introspective poetry and literary reading.

---

# 4. Paper and page surface library

The page material is separate from the color theme. A user may choose a page surface independently.

Create these page surfaces:

| ID | Name | Description | Usage |
|---|---|---|---|
| PAPER-01 | Clean Cotton | Flat, clean, warm-white surface | Default/editor |
| PAPER-02 | Cream Stationery | Gentle warm paper tone | Diary and letters |
| PAPER-03 | Ruled Journal | Very subtle horizontal writing rules | Diary/editor |
| PAPER-04 | Dot Grid | Extremely subtle dotted grid | Fragments and notes |
| PAPER-05 | Fine Parchment | Almost invisible paper grain | Reading/poetry |
| PAPER-06 | Manuscript | Light page margin and writing guide | Poetry |
| PAPER-07 | Recycled Paper | Slightly warm, natural texture | Personal notebooks |
| PAPER-08 | Night Paper | Dark, low-glare content surface | Dark theme |
| PAPER-09 | Pure White | Clean, no texture | Minimal theme |
| PAPER-10 | Linen | Subtle woven texture, low contrast | Book cover/collection |

## 4.1 Texture rules

- Texture must never reduce text contrast.
- Use subtle CSS patterns or optimized local assets.
- Do not load large texture images from third-party URLs.
- Avoid repeating obvious bitmap patterns.
- Do not put high-frequency patterns behind Bangla body text.
- Add an option to disable textures.
- Default editor texture should be very subtle or disabled.
- Reading view may have a little more texture than the editor.

## 4.2 Ruled paper implementation

Rules must be a background layer, not characters inserted into the text.

Example:

```css
.page--ruled {
  background-color: var(--page);
  background-image:
    linear-gradient(
      to bottom,
      transparent calc(var(--rule-gap) - 1px),
      var(--page-rule) calc(var(--rule-gap) - 1px),
      var(--page-rule) var(--rule-gap)
    );
  background-size: 100% var(--rule-gap);
}
```

Test Bangla glyph height and line baseline alignment before enabling ruled paper in the editor. If lines collide with text, use ruled styling only in preview/reading mode.

---

# 5. Page layout template library

Templates define composition, not content. All templates must display the same source text without changing it.

Build the following layout templates.

## TEMPLATE-01 — Classic Journal

**Default daily diary layout**
- Date at top.
- Optional title.
- Large left-aligned writing area.
- Generous page margins.
- Optional subtle ruled paper.
- Mood/metadata below or in a discreet panel.

Best for: daily diary and reflections.

## TEMPLATE-02 — Clean Letter

- Simple date and title.
- Wide, clean paper.
- Paragraph-focused text.
- Optional small closing/attribution area.
- No lines or ornamental border.

Best for: personal letters and prose.

## TEMPLATE-03 — Poetry Manuscript

- Centered or left-aligned title.
- Narrow text column.
- Generous stanza spacing.
- Small optional section divider.
- No forced justification.
- Optional poem subtitle.

Best for: long poems and complex stanza structures.

## TEMPLATE-04 — Quote Folio

- One large quote as the main focus.
- Optional decorative quotation mark.
- Attribution/source below.
- Ample whitespace.
- Copy action remains available.

Best for: short quotes and aphorisms.

## TEMPLATE-05 — Pocket Fragment

- Compact page.
- Content-first with minimal title treatment.
- Optional date in small type.
- Quick capture.
- Minimal metadata.

Best for: fragments and unfinished thoughts.

## TEMPLATE-06 — Daily Reflection

- Date and optional mood annotation.
- Title.
- Main writing column.
- Optional “what stayed with me” reflection block only if manually entered.
- Metadata kept outside the original content body.

Best for: personal reflection and daily journaling.

## TEMPLATE-07 — Literary Book Page

- Strong book-like reading composition.
- Centered title.
- Narrow reading column.
- Discreet page-edge shadow.
- Previous/next navigation.
- Optional chapter/collection label.

Best for: immersive reading.

## TEMPLATE-08 — Marginalia

- Main writing column.
- Desktop-only optional side margin for notes/annotations.
- Side notes must be stored separately from original body.
- On mobile, annotations move below the main text or into a separate tab.

Best for: annotated poetry and study.

## TEMPLATE-09 — Distraction-Free Canvas

- No visible sidebar.
- Minimal top bar.
- Full writing focus.
- Optional wide/narrow toggle.
- No decorative textures.
- Easy exit without losing draft.

Best for: writing sessions.

## TEMPLATE-10 — Vintage Journal

- Date stamp.
- Warm paper surface.
- Fine border and restrained ornaments.
- Serif title.
- Comfortable text width.

Best for: nostalgic diary entries.

## 5.1 Templates by content type

Recommended defaults:

| Content type | Default template | Other suggested templates |
|---|---|---|
| Diary | Classic Journal | Daily Reflection, Vintage Journal |
| Poem | Poetry Manuscript | Literary Book Page, Distraction-Free |
| Quote | Quote Folio | Clean Letter |
| Fragment | Pocket Fragment | Distraction-Free |
| Prose | Clean Letter | Literary Book Page, Classic Journal |

The owner can override the default template for any entry. Do not force the template solely from content type.

## 5.2 Template behavior

- A template switch updates the visual presentation only.
- The same text must remain intact.
- Any template-specific metadata must live in structured fields, not inserted into content.
- Missing title/attribution fields should be gracefully omitted.
- Mobile must adapt the layout rather than merely shrink the desktop design.
- Print/export should use a clean print layout, not blindly reproduce all UI decorations.

---

# 6. Typography and reading presets

Provide curated typography presets instead of exposing dozens of low-level controls immediately.

## 6.1 Presets

| Preset | Bangla | English | Feel |
|---|---|---|---|
| Classic Literary | Hind Siliguri | Literata | Book-like |
| Modern Journal | Hind Siliguri | Inter | Clean |
| Editorial Serif | Hind Siliguri | Lora | Literary |
| Minimal Reading | Hind Siliguri | Georgia | Familiar |
| Comfortable Large | Hind Siliguri, larger size | Georgia, larger size | High readability |

Do not use one English serif font for Bangla. Use script-aware font selection.

## 6.2 Fine controls

Allow:
- Bangla font size.
- English font size.
- Line height.
- Paragraph spacing.
- Reading width: Narrow / Standard / Wide.
- Alignment: Left / Center (where appropriate).
- Font preset.
- UI font scale.
- Letter spacing only where appropriate for Latin text; do not apply arbitrary letter spacing to Bangla body text.

Suggested initial ranges:
- Bangla reading size: 18–24px.
- English reading size: 17–22px.
- Bangla body line height: 1.65–1.95.
- English prose line height: 1.6–1.85.
- Poem stanza spacing: configurable, with a comfortable default.
- Reading width: 600–760px for desktop; full-width with safe padding on mobile.

These are product defaults, not hard constraints. The user must be able to increase text size.

## 6.3 Typography rules

- Never clip Bengali vowel signs or conjuncts.
- Avoid narrow font weights for body text.
- Avoid very small metadata text.
- Respect user text scaling up to at least 200% without losing content or functionality.
- Test long titles and mixed-script lines.
- Use `lang="bn"` for Bangla passages and `lang="en"` for English passages where language is known.

---

# 7. Book and collection cover library

Collections should feel like small personal notebooks.

Create several cover styles that can be applied to a collection.

## COVER-01 — Heritage Leather
- Dark walnut cover.
- Warm cream title.
- Small embossed-style icon.
- Thin border.

## COVER-02 — Botanical Press
- Sage/olive cover.
- Minimal leaf illustration.
- Natural paper title panel.

## COVER-03 — Midnight Library
- Deep charcoal/navy.
- Muted gold title.
- Tiny moon/star detail.

## COVER-04 — Rosewood Letters
- Muted burgundy.
- Cream title.
- Fine ornamental divider.

## COVER-05 — Ocean Archive
- Blue-gray.
- Minimal wave or horizon artwork.
- Clean typography.

## COVER-06 — Minimal Linen
- Neutral linen color.
- Typography-only.
- No illustration.

## COVER-07 — Old Library
- Burgundy or dark green.
- Small archive mark.
- Classic serif title.

## COVER-08 — Custom Color
- Owner selects cover and text color from a safe palette.
- Optional uploaded image can be added later, not required for MVP.

### Cover rules

- Covers are optional visual metadata on collections.
- A collection's cover must not change content privacy or access.
- No large image upload system is required initially.
- Keep cover thumbnails optimized and local.
- Ensure titles remain readable and do not overflow.
- Provide a fallback cover when no selection exists.

---

# 8. Decorative elements and ornaments

Provide restrained optional decorations.

Available elements:
- Simple botanical line art.
- Fine divider lines.
- Small ornamental title separators.
- Minimal chapter marker.
- Page corner accent.
- Subtle date stamp.
- Drop cap (English/Latin only by default; Bangla drop caps require careful design and are off by default).
- Small quotation mark motif.

Rules:
- Decorative elements are outside the actual content body.
- They must not be selected/copied with the writing.
- They must not reduce contrast.
- They must not create layout clutter.
- User can turn all decoration off.
- Do not use large background illustrations behind the text.

---

# 9. Design Studio — full customization experience

Create a dedicated **Appearance Studio** or **Book Design** area in Settings.

It should feel like a miniature book-design workspace.

## 9.1 Studio layout

Desktop:
- Left side: category navigation.
- Center: large live preview.
- Right side: selected settings and controls.
- Preview toggle for Desktop / Mobile.
- Save, Save as preset, Reset, Apply controls.

Mobile:
- Full-screen design studio.
- Preview tab and Customize tab.
- Sticky bottom Save/Apply action.
- Do not compress desktop three-column UI into a narrow phone screen.

## 9.2 Studio navigation

Categories:
1. Presets.
2. App Theme.
3. Paper & Texture.
4. Page Layout.
5. Typography.
6. Book Covers.
7. Colors.
8. Decorations.
9. Custom Presets.

## 9.3 Live preview

Preview must show:
- A sample diary entry.
- A poem with at least three stanzas.
- A short quote with attribution.
- Both Bangla and English text.
- Optional metadata such as mood/date/tags.
- Desktop and mobile previews.

Use synthetic preview content. Never send the owner's writing to an external service to generate a visual preview.

The preview must update immediately as options change.

## 9.4 Applying customization

Provide explicit scope:
- Apply as my default.
- Apply to this collection.
- Apply to this entry.
- Save as a new preset.

Recommended behavior:
- Global default controls app and reading defaults.
- Collection override controls its cover and default page presentation.
- Entry override is optional and should remain lightweight.
- A collection's override takes precedence over global defaults.
- An entry's explicit override takes precedence over collection defaults.

Do not make settings inheritance impossible to understand. Show “Using default theme” or “Custom for this collection”.

## 9.5 Preset management

Features:
- Save current setup as a named preset.
- Rename preset.
- Duplicate preset.
- Delete custom preset.
- Reset to system preset.
- Mark favorite presets.
- Preview before applying.
- Restore factory presets if deleted accidentally.

Factory presets cannot be permanently deleted; users may hide them from their quick list.

---

# 10. Personalization data model

Appearance settings should be stored as structured, versioned JSON. Do not put these properties into diary content.

## 10.1 `appearance_preferences`

One owner row:
- `user_id uuid primary key`
- `schema_version integer`
- `global_theme_id text`
- `global_config jsonb`
- `reduced_motion boolean nullable`
- `updated_at timestamptz`

## 10.2 `appearance_presets`

Saved custom presets:
- `id uuid primary key`
- `user_id uuid`
- `name text`
- `description text nullable`
- `config jsonb`
- `is_favorite boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

Unique name per user if desired.

## 10.3 Collection overrides

Add nullable `appearance_config jsonb` to `collections`.

This should store only collection-level overrides such as:
- cover ID.
- cover colors.
- preferred page template.
- optional reading palette override.

Do not duplicate the entire global theme if only one or two values are overridden.

## 10.4 Optional entry overrides

If implemented, add `appearance_override jsonb` to `entries`. Prefer not to build per-entry overrides in the first MVP unless useful. A page template choice per entry may be enough.

## 10.5 Validate JSON config

Never trust arbitrary JSON from the browser. Validate through Zod or a database constraint/function.

Example shape:

```ts
type AppearanceConfig = {
  schemaVersion: 1;
  appThemeId: string;
  paperId: string;
  pageTemplateId: string;
  typographyPresetId: string;
  coverId?: string;
  colors?: {
    accent?: string;
    page?: string;
    ink?: string;
  };
  typography?: {
    banglaFontSize?: number;
    englishFontSize?: number;
    lineHeight?: number;
    readingWidth?: "narrow" | "standard" | "wide";
  };
  decorations?: {
    botanical?: boolean;
    divider?: boolean;
    pageEdge?: boolean;
  };
};
```

Use allowlists for preset IDs and numeric ranges for custom values. Do not accept CSS strings or arbitrary style injection from user configuration.

## 10.6 Theme inheritance

Recommended precedence:

```text
System factory defaults
       |
       v
Owner global appearance preferences
       |
       v
Collection appearance overrides
       |
       v
Entry-specific page template/override (if set)
```

Each layer overrides only fields it explicitly defines. Missing values inherit from the parent.

---

# 11. Design-system implementation

## 11.1 Theme tokens

Use centralized CSS custom properties.

```css
:root {
  --app-bg: #EDE4D6;
  --surface: #FFF9EF;
  --surface-secondary: #F4EBDD;
  --ink: #30261F;
  --ink-secondary: #66584C;
  --ink-muted: #817366;
  --accent: #754832;
  --accent-soft: #E8D5C3;
  --border: #DCCDBB;
  --page-rule: rgba(117, 72, 50, 0.12);

  --font-ui: "Inter", sans-serif;
  --font-bangla: "Hind Siliguri", sans-serif;
  --font-reading: "Literata", Georgia, serif;

  --reading-width: 720px;
  --reading-line-height: 1.85;
  --page-padding-x: 52px;
  --page-padding-y: 48px;
  --rule-gap: 34px;
}
```

Set theme using `data-theme`:

```html
<div data-theme="heritage-parchment">
```

Set page style separately:

```html
<article
  data-paper="cream-stationery"
  data-template="poetry-manuscript"
>
```

Do not create separate hardcoded CSS for every screen/theme combination.

## 11.2 Component architecture

Suggested components:

```text
src/
  components/
    appearance/
      AppearanceStudio.tsx
      PresetGallery.tsx
      ThemePicker.tsx
      ColorPalettePicker.tsx
      PaperPicker.tsx
      PageTemplatePicker.tsx
      TypographyPicker.tsx
      CoverPicker.tsx
      DecorationPicker.tsx
      AppearancePreview.tsx
      PreviewDeviceToggle.tsx
      SavePresetDialog.tsx
      ResetAppearanceDialog.tsx
    book/
      BookCover.tsx
      CollectionCover.tsx
      JournalPage.tsx
      PageFrame.tsx
      PageHeader.tsx
      PageFooter.tsx
      PoetryLayout.tsx
      QuoteLayout.tsx
      DiaryLayout.tsx
      LetterLayout.tsx
```

The preview renderer should use the same page components as the real reading view wherever practical. Avoid maintaining separate preview-only layout code that drifts from production.

## 11.3 Avoid style explosion

Do not create a separate component for every possible combination. Use:
- Theme tokens.
- Page template components.
- Paper surface classes.
- Typography variables.
- Small decoration components.

The combination should be composable.

---

# 12. Export, print, and visual fidelity

## 12.1 On-screen reading vs export

The on-screen reading theme and exported document theme may differ.

Provide:
- Export in current appearance.
- Export in clean print style.
- Optional PDF/print format later.
- Markdown and JSON exports remain content-first, not visual-format-dependent.

## 12.2 Print CSS

A print stylesheet should:
- Remove sidebar, toolbar, buttons, and interactive controls.
- Use a white/cream print-friendly background.
- Use ink-safe text colors.
- Avoid printing large background textures.
- Preserve page breaks where practical.
- Keep poem stanzas together when possible.
- Avoid splitting a short quote and its attribution.
- Use appropriate margins.

Example:

```css
@media print {
  .app-shell,
  .toolbar,
  .sidebar,
  .no-print {
    display: none !important;
  }

  .journal-content {
    color: #1f1f1f !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .poem-stanza {
    break-inside: avoid;
  }
}
```

Never make Markdown/JSON export depend on the selected visual template.

---

# 13. Accessibility and customization safeguards

Visual customization must not allow the owner to accidentally create unreadable pages.

## 13.1 Contrast validation

- Normal text must target at least 4.5:1 contrast against its background.
- Large text may use at least 3:1 where WCAG criteria permit.
- Important UI boundaries/icons should target at least 3:1 against adjacent colors.
- Warn when a custom color pair fails.
- Offer “Fix contrast” or “Use accessible ink” action.
- Do not block creative color selection for decorative-only elements, but never apply unreadable colors to body text silently.

These values follow WCAG 2.2 Success Criteria 1.4.3 and 1.4.11. See W3C: https://www.w3.org/TR/WCAG22/

## 13.2 Text scaling

- Allow text size increase to at least 200% without loss of content/functionality.
- Preview large type.
- Avoid fixed-height text containers.
- Ensure mobile controls reflow when text scale grows.

WCAG 2.2 includes text resize guidance: https://www.w3.org/TR/WCAG22/

## 13.3 Reduced motion

Respect `prefers-reduced-motion`. Provide a low-motion setting for page transitions and decorative animations. Do not use parallax or animated page turns by default.

Reference: MDN `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## 13.4 System theme

Support Light, Dark, and System. System should respond to the operating system preference, while an explicit user choice takes precedence. Avoid flashing the wrong theme during initial load.

Reference: MDN `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme

---

# 14. Performance and asset strategy

- Use CSS for simple rules, dots, and subtle gradients.
- Use optimized local SVG/WEBP assets for cover artwork.
- Avoid large repeated background images.
- Lazy-load cover thumbnails not initially visible.
- Keep theme switching instant; do not refetch content.
- Save appearance preferences with debouncing or explicit Apply.
- Cache factory preset definitions in the app bundle.
- Store only user custom configuration in Supabase.
- Do not send theme selection to AI.
- Do not fetch remote textures from random image sources.
- Avoid unnecessary animation on mobile.

A theme switch must not trigger a database refetch of the entire diary.

---

# 15. User journeys

## Journey A — Choose a ready-made book theme

1. Open Settings → Appearance Studio.
2. Open Presets.
3. Preview Heritage Parchment.
4. Switch Desktop/Mobile preview.
5. Preview Botanical Journal.
6. Select the preferred preset.
7. Click Apply as my default.
8. Return to My Journal.
9. Verify all screens use the selected app-level theme.
10. Open an existing poem and verify the text is unchanged.

## Journey B — Customize a poetry page

1. Open a poem.
2. Choose Page Style.
3. Select Poetry Manuscript.
4. Choose Clean Cotton paper.
5. Select Classic Literary typography.
6. Adjust reading width.
7. Preview desktop and mobile.
8. Apply to this entry.
9. Refresh and verify appearance persists.
10. Copy/export text and verify no style markup was inserted into original content.

## Journey C — Give a collection its own identity

1. Open Collections.
2. Choose a collection.
3. Open Design Collection.
4. Select Botanical Press cover.
5. Choose Botanical Journal palette.
6. Choose Literary Book Page template.
7. Preview desktop and mobile.
8. Apply to this collection.
9. Open another collection.
10. Verify global theme remains unchanged.

## Journey D — Create a custom preset

1. Open Appearance Studio.
2. Select a base preset.
3. Change accent and page colors.
4. Adjust typography.
5. Choose paper and template.
6. Run contrast validation.
7. Preview desktop/mobile.
8. Save as a named preset.
9. Reload the app.
10. Apply the saved preset and verify exact settings.

## Journey E — Reset one layer

1. Open a collection with custom cover and page theme.
2. Reset only its typography.
3. Verify cover and palette remain.
4. Reset collection appearance to global defaults.
5. Verify global preferences are unchanged.

---

# 16. Testing and acceptance criteria

Add these cases to the main VerseVault QA plan.

## 16.1 Theme and palette tests

| ID | Priority | Test | Expected result |
|---|---|---|---|
| THEME-001 | P1 | Apply each factory theme | All major UI surfaces update consistently |
| THEME-002 | P1 | Refresh after applying theme | Selection persists |
| THEME-003 | P1 | Switch theme while editor open | Text and editor state unchanged |
| THEME-004 | P1 | Apply dark theme | Forms, dialogs, menus, and editor remain readable |
| THEME-005 | P1 | System theme | Responds to OS preference |
| THEME-006 | P1 | Custom color pair with low contrast | Warning appears |
| THEME-007 | P1 | Restore default theme | Correct defaults restored |
| THEME-008 | P1 | Theme change on mobile | No overflow or unreadable controls |

## 16.2 Page template tests

| ID | Priority | Test | Expected result |
|---|---|---|---|
| PAGE-001 | P0 | Switch diary template | Original text unchanged |
| PAGE-002 | P0 | Switch poem template | All stanzas and lines preserved |
| PAGE-003 | P0 | Switch quote layout | Attribution remains correct |
| PAGE-004 | P1 | Switch template with no title | No broken title area |
| PAGE-005 | P1 | Apply template to one entry | Other entries unchanged |
| PAGE-006 | P1 | Apply template to a collection | Only collection entries inherit it |
| PAGE-007 | P1 | Preview template on mobile | Correct responsive adaptation |
| PAGE-008 | P1 | Change template and copy text | Clipboard remains original content |
| PAGE-009 | P1 | Delete/reset custom preset | Current entry content unaffected |
| PAGE-010 | P1 | Open unknown template ID | Safe fallback; no crash |

## 16.3 Paper and texture tests

| ID | Priority | Test | Expected result |
|---|---|---|---|
| PAPER-001 | P1 | Apply ruled paper | Rules behind text; no characters inserted |
| PAPER-002 | P1 | Render Bangla on ruled paper | Glyphs do not collide with rules |
| PAPER-003 | P1 | Apply dot grid | Text remains readable |
| PAPER-004 | P1 | Disable texture | Clean page displayed |
| PAPER-005 | P1 | Slow network | No remote texture dependency |
| PAPER-006 | P1 | Dark paper surface | Contrast passes |
| PAPER-007 | P1 | Print a textured page | Texture removed or print-safe |

## 16.4 Typography tests

| ID | Priority | Test | Expected result |
|---|---|---|---|
| TYPESTYLE-001 | P0 | Hind Siliguri Bangla page | No clipped marks or missing glyphs |
| TYPESTYLE-002 | P0 | Mixed Bangla/English | Font fallback is appropriate |
| TYPESTYLE-003 | P1 | Increase font size | Content reflows without clipping |
| TYPESTYLE-004 | P1 | 200% text scale | No loss of content/function |
| TYPESTYLE-005 | P1 | Change line height | Content remains readable |
| TYPESTYLE-006 | P1 | Narrow reading width | No horizontal scroll |
| TYPESTYLE-007 | P1 | Long title | Layout remains stable |
| TYPESTYLE-008 | P1 | Refresh after typography preference | Setting persists |

## 16.5 Cover and collection style tests

| ID | Priority | Test | Expected result |
|---|---|---|---|
| COVER-001 | P1 | Apply cover to collection | Correct collection updates |
| COVER-002 | P1 | Change one cover | Other collections unchanged |
| COVER-003 | P1 | Long Bangla collection name | Wraps without clipping |
| COVER-004 | P1 | No cover selected | Default cover used |
| COVER-005 | P1 | Delete custom cover selection | Safe fallback |
| COVER-006 | P1 | Cover on mobile | Art and title remain readable |

## 16.6 Appearance Studio tests

| ID | Priority | Test | Expected result |
|---|---|---|---|
| STUDIO-001 | P1 | Open studio | Current settings loaded |
| STUDIO-002 | P1 | Change option | Preview updates immediately |
| STUDIO-003 | P1 | Toggle desktop/mobile | Preview reflects same configuration |
| STUDIO-004 | P1 | Save preset | Named preset persists |
| STUDIO-005 | P1 | Rename preset | Name updates |
| STUDIO-006 | P1 | Duplicate preset | Separate copy created |
| STUDIO-007 | P1 | Delete custom preset | Preset removed after confirmation |
| STUDIO-008 | P1 | Attempt delete factory preset | Factory preset protected/hidden only |
| STUDIO-009 | P1 | Apply globally | Global appearance changes |
| STUDIO-010 | P1 | Apply to collection | Only target collection changes |
| STUDIO-011 | P1 | Apply to one entry | Only target entry changes |
| STUDIO-012 | P1 | Reset one layer | Other layers remain unchanged |
| STUDIO-013 | P1 | Cancel without save | Existing appearance unchanged |
| STUDIO-014 | P1 | Mobile studio | Controls and preview usable |

## 16.7 Persistence and security tests

| ID | Priority | Test | Expected result |
|---|---|---|---|
| STYLEDB-001 | P0 | Load appearance settings | Only owner settings accessible |
| STYLEDB-002 | P0 | Attempt anonymous appearance query | Denied |
| STYLEDB-003 | P0 | Attempt another account's preset ID | Denied |
| STYLEDB-004 | P1 | Invalid JSON config | Rejected safely |
| STYLEDB-005 | P1 | Unknown preset ID | Safe default/fallback |
| STYLEDB-006 | P1 | Old `schema_version` config | Migration or safe fallback |
| STYLEDB-007 | P1 | Save settings failure | UI indicates failure; current local selection not misreported as saved |
| STYLEDB-008 | P1 | Theme change during save | Latest choice wins; no stale overwrite |

## 16.8 Visual and accessibility tests

- Desktop preview.
- Mobile preview.
- Narrow viewport.
- High text zoom.
- Reduced motion.
- Light and dark theme.
- High contrast pair warning.
- Bangla line-height and glyph clipping.
- Keyboard navigation inside studio.
- Dialog focus management.
- Touch controls.

---

# 17. Recommended implementation phases

## Phase STYLE-1 — Token and preset foundation

Build:
- CSS variables.
- Theme registry.
- 8 factory themes.
- Theme application and persistence.
- Light/dark/system support.
- Basic appearance picker.

Do not build every template yet.

## Phase STYLE-2 — Paper and page templates

Build:
- 8–10 page templates.
- Paper surface library.
- Poetry/quote/diary variants.
- Responsive template rendering.
- Text preservation tests.

## Phase STYLE-3 — Typography controls

Build:
- Bangla/English font presets.
- Font size and line-height controls.
- Reading width.
- Alignment and paragraph spacing.
- Font loading fallbacks.

## Phase STYLE-4 — Collection covers

Build:
- Cover preset library.
- Collection appearance override.
- Collection-specific preview.
- Fallback cover.

## Phase STYLE-5 — Appearance Studio

Build:
- Three-area desktop design studio.
- Mobile design studio.
- Live previews.
- Custom preset save/rename/duplicate/delete.
- Apply globally/collection/entry.
- Reset controls.

## Phase STYLE-6 — Polish and accessibility

Build:
- Contrast warnings.
- Text zoom.
- Reduced motion.
- Print stylesheet.
- Performance and responsive QA.
- Full test suite.

---

# 18. Lovable master prompt for the customization system

Use this after the diary app, editor, and core persistence are working.

```text
Implement the VerseVault Book Themes, Page Templates & Visual Customization
System using the dedicated design customization specification.

PRODUCT CONTEXT:
VerseVault is a private personal diary. It should feel like a library of
beautiful personal notebooks. Keep the existing warm literary identity.

MOST IMPORTANT ARCHITECTURE RULE:
Separate customization into four independent layers:
1. App Theme.
2. Book/Collection Cover.
3. Page Template.
4. Reading Typography.

Do not combine all choices into one giant theme setting.

FEATURES:
- At least 8 factory color themes.
- At least 8 paper/page surfaces.
- At least 8 page layout templates.
- At least 6 collection cover designs.
- Bangla/English typography presets.
- Font size, line height, reading width, and paragraph spacing controls.
- Optional decorations and textures.
- Appearance Studio with live preview.
- Desktop/mobile preview toggle.
- Save, rename, duplicate, delete custom presets.
- Apply globally, to a collection, or to a specific entry.
- Reset one layer or all settings.
- Contrast warning for unreadable custom color pairs.

TEMPLATES:
Classic Journal, Clean Letter, Poetry Manuscript, Quote Folio,
Pocket Fragment, Daily Reflection, Literary Book Page, Marginalia,
Distraction-Free Canvas, Vintage Journal.

PRESERVE CONTENT:
Themes and templates are presentation only. Never insert rules,
decorations, page numbers, or HTML into the original entry content.
Switching a theme/template must never change the stored writing.
Copy and Markdown/JSON export must continue to return the original text.

BILINGUAL TYPOGRAPHY:
Use Hind Siliguri for Bangla and appropriate serif/sans fonts for English.
Test Bangla vowel signs, conjuncts, mixed-script lines, and large text.
Do not use arbitrary letter spacing on Bangla body text.

DATA:
Store owner preferences and custom presets as versioned structured JSON.
Use Supabase RLS. Validate allowed preset IDs and custom numeric/color ranges.
Store collection overrides separately from global defaults.

UX:
Desktop studio: navigation/categories on the left, live preview in the center,
controls on the right. Mobile studio: Preview and Customize tabs with sticky
Save/Apply actions. Do not squeeze the desktop three-column layout onto mobile.

QUALITY:
Use the same page components in the preview and actual reading view.
Test all themes and templates at desktop/mobile sizes.
Test text preservation, persistence, reset, collection isolation, contrast,
reduced motion, zoom, and Bangla rendering.
Record test evidence according to the VerseVault QA specification.

FIRST ACTION:
Inspect the existing theme/settings architecture. Report what already exists,
then implement STYLE-1 only. Do not change the rest of the product design
or add every customization feature in one pass.
```

---

# 19. Recommended defaults and rollout decision

For the first release:
- Default theme: Heritage Parchment.
- Default paper: Clean Cotton or Cream Stationery.
- Default diary template: Classic Journal.
- Default poem template: Poetry Manuscript.
- Default quote template: Quote Folio.
- Default fragment template: Pocket Fragment.
- Default typography: Hind Siliguri for Bangla and Literata for English reading.
- Default decorations: minimal.
- Default texture: very subtle or off in editor.
- Default collection cover: Heritage Leather or Minimal Linen.

Build at least:
- 8 color themes.
- 8 paper styles.
- 8 page templates.
- 6 cover styles.

But do not ship all possible custom controls at the same time. Start with factory presets and live preview, then add advanced customization after the core system is stable.

---

# 20. Official design and accessibility references

Use these references as standards for implementation:

1. [W3C — Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) — accessibility criteria for contrast, text resizing, semantics, and interaction.
2. [W3C — Understanding Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — 4.5:1 normal text contrast and 3:1 large text guidance.
3. [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — honor reduced-motion preferences.
4. [MDN — `prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) — support system light/dark preference.

WCAG 2.2 specifies at least 4.5:1 contrast for normal text and 3:1 for large text under Success Criterion 1.4.3; non-text UI components have a 3:1 requirement under 1.4.11. Text resizing to 200% without loss of content/functionality is addressed by 1.4.4. Validate real rendered combinations, not only the palette swatches. (W3C: https://www.w3.org/TR/WCAG22/)

---

# 21. Final design standard

VerseVault should let the owner choose the atmosphere of a page without making the writing harder to read.

A good theme makes the words feel more personal.  
A good page template gives each kind of writing its own space.  
A good customization system offers freedom without visual chaos.

**Final rule:** The page may change its paper, ink, margins, ornaments, and atmosphere. The words themselves must remain exactly as the owner wrote them.
