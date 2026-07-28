export function applyRuntimeMetadata() {
  const canonicalUrl = new URL(window.location.pathname, window.location.origin).href
  const socialImageUrl = new URL('/og.png', window.location.origin).href

  const canonical = document.createElement('link')
  canonical.rel = 'canonical'
  canonical.href = canonicalUrl
  document.head.append(canonical)

  const updateMeta = (selector, value) => {
    const element = document.head.querySelector(selector)
    if (element) element.setAttribute('content', value)
  }

  updateMeta('meta[property="og:url"]', canonicalUrl)
  updateMeta('meta[property="og:image"]', socialImageUrl)
  updateMeta('meta[name="twitter:image"]', socialImageUrl)
}
