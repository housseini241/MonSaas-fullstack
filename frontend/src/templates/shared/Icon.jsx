import * as Lucide from "lucide-react";
import { Sparkles } from "lucide-react";

/**
 * Renders a Lucide icon from a kebab/snake-case name (e.g. "shield-check").
 * Falls back to a neutral Sparkles glyph when the name is unknown, so a bad
 * icon name coming from the AI content generator never breaks a template.
 */
export default function Icon({ name, className = "" }) {
  const pascal = (name || "")
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  const Component = Lucide[pascal] || Sparkles;
  return <Component className={className} />;
}
