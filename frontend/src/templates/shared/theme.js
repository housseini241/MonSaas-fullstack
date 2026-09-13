import { DEFAULT_THEME, ensureGoogleFontsLoaded } from "@/components/ThemePicker";

export { ensureGoogleFontsLoaded };

/**
 * Resolve the effective theme for a site.
 *
 * Priority (low → high):
 *   1. DEFAULT_THEME              — global fallback (identical to legacy behaviour)
 *   2. template.defaultTheme      — the selected template's signature tokens
 *   3. site.theme                 — the artisan's explicit choice via ThemePicker
 *
 * The artisan's stored theme always wins, so switching template never loses a
 * customisation. For a site with no stored theme, the template defaults apply —
 * this is what lets `atelier`/`batisseur` ship their own colours & fonts while
 * `essential` falls back to DEFAULT_THEME exactly as before.
 */
export function buildTheme(siteTheme, templateDefaults) {
  return { ...DEFAULT_THEME, ...(templateDefaults || {}), ...(siteTheme || {}) };
}

/**
 * CSS custom properties consumed by every template and by the shared
 * SiteHeader / SiteFooter (they reference --site-grad-a / --site-grad-b).
 * Kept byte-for-byte identical to the legacy ArtisanTemplate style block.
 */
export function buildThemeCss(theme) {
  return `
    .artisan-site{
      --site-grad-a: ${theme.primary_color};
      --site-grad-b: ${theme.accent_color};
      font-family: '${theme.font_body}', 'Inter', sans-serif;
    }
    .artisan-site .font-display{ font-family: '${theme.font_heading}', 'Space Grotesk', sans-serif; }
  `;
}
