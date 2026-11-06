function assertWebRendering(html, pathname, expectedText) {
  // React can return HTTP 200 with a failed Suspense boundary and let the
  // browser render it again. Status codes alone cannot verify SSR health.
  if (/<!--\s*\$!\s*-->|Switched to client rendering|data-(?:msg|stck)=|Failed to load loader data/.test(html)) {
    throw new Error(`${pathname}: server rendering failed or fell back to client rendering`);
  }

  const content = html
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  if (!/<h1\b[^>]*>[\s\S]+?<\/h1>/i.test(content)) {
    throw new Error(`${pathname}: missing server-rendered page heading`);
  }

  const text = content.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, entity => ({
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'",
  })[entity]);
  if (expectedText && !text.includes(expectedText)) {
    throw new Error(`${pathname}: missing server-rendered content: ${expectedText}`);
  }
}

module.exports = { assertWebRendering };
