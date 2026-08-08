const RESERVED_SUBDOMAINS = ["www", "app", "api", "admin", "staging", "dev", "mail", "ftp", "analytics"];

export function getSubdomainSlug() {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (!host.endsWith(".hustart.fr")) return null;
  const sub = host.slice(0, -".hustart.fr".length);
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.includes(sub)) return null;
  return sub;
}

export function siteBasePath(slug) {
  return getSubdomainSlug() === slug ? "" : `/site/${slug}`;
}

export function publicSiteUrl(slug) {
  const host = window.location.hostname;
  if (host === "hustart.fr" || host === "www.hustart.fr") {
    return `https://${slug}.hustart.fr`;
  }
  return `${window.location.origin}/site/${slug}`;
}
