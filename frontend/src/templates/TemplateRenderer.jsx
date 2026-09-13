import { getTemplate } from "@/templates/registry";

/**
 * Dispatches rendering to the template selected by `site.template_id`.
 *
 * Every site — published or draft — goes through this component, so the
 * template choice is a single, centralised decision. Unknown or missing
 * `template_id` falls back to `essential`, which guarantees backward
 * compatibility for sites created before the template system existed.
 */
export default function TemplateRenderer({
  site,
  onSubmitLead,
  editable = false,
  onEdit,
  isPreview = false,
}) {
  const template = getTemplate(site && site.template_id);
  const Component = template.Component;

  return (
    <Component
      site={site}
      onSubmitLead={onSubmitLead}
      editable={editable}
      onEdit={onEdit}
      isPreview={isPreview}
      templateDefaults={template.defaultTheme}
      defaultSectionOrder={template.defaultSectionOrder}
    />
  );
}
