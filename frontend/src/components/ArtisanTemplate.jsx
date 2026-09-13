/**
 * ArtisanTemplate — public entry point for the artisan site renderer.
 *
 * Kept at this path so existing importers (PublicSite, Preview, Builder) do not
 * change. Rendering is delegated to TemplateRenderer, which selects the layout
 * from `site.template_id` (falling back to "essential" when absent — this keeps
 * sites created before the template system rendering exactly as before).
 *
 * All shared logic (lead/devis form, theme resolution, section grouping,
 * inline editing) now lives in `@/templates/shared/*` and is used by every
 * template, so there is a single implementation of the business logic.
 */
export { default } from "@/templates/TemplateRenderer";
