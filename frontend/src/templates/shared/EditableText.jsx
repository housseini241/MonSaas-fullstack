/**
 * Inline-editable text primitive shared by all site templates.
 *
 * Mirrors the behaviour of the historical inline `Editable` component in
 * ArtisanTemplate.jsx so the `essential` template keeps rendering identically:
 * when `editable` is false it simply renders the value inside the given tag;
 * when true it becomes contentEditable and reports changes through `onEdit`.
 */
export default function EditableText({
  value,
  field,
  editable = false,
  onEdit,
  as: As = "span",
  className = "",
}) {
  if (!editable) return <As className={className}>{value}</As>;
  return (
    <As
      className={`${className} outline-none focus:bg-[#FEF3C7] focus:ring-2 focus:ring-[var(--site-grad-a)]/40 px-1 -mx-1 rounded transition-colors`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onEdit && onEdit(field, e.currentTarget.textContent)}
    >
      {value}
    </As>
  );
}
