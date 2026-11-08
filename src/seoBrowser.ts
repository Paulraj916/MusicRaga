import { pageSeo, siteConfig } from './seo';
/** Updates the same route metadata emitted at build time; no client-only SEO dependency. */
export function applySeo(path: string) {
  const base =
    document.querySelector<HTMLMetaElement>('meta[name="powerwords-base-url"]')?.content ??
    window.location.origin;
  const allow =
    document.querySelector<HTMLMetaElement>('meta[name="powerwords-indexing"]')?.content === 'true';
  const data = pageSeo(path, siteConfig(base, allow));
  document.title = data.title;
  const meta = (attribute: string, key: string, value: string) => {
    let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!node) {
      node = document.createElement('meta');
      node.setAttribute(attribute, key);
      document.head.append(node);
    }
    node.content = value;
  };
  meta('name', 'description', data.description);
  meta('name', 'robots', data.robots);
  meta('property', 'og:title', data.title);
  meta('property', 'og:description', data.description);
  meta('property', 'og:url', data.canonical);
  meta('property', 'og:type', 'website');
  meta('property', 'og:image', base + '/social-card.png');
  document.head
    .querySelectorAll('link[rel="canonical"],link[rel="alternate"][hreflang]')
    .forEach((node) => node.remove());
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = data.canonical;
  document.head.append(canonical);
  data.alternates.forEach((item) => {
    const node = document.createElement('link');
    node.rel = 'alternate';
    node.hreflang = item.lang;
    node.href = item.url;
    document.head.append(node);
  });
  let json = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
  if (!json) {
    json = document.createElement('script');
    json.type = 'application/ld+json';
    document.head.append(json);
  }
  json.textContent = JSON.stringify(data.structured);
}
