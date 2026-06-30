import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();

  return (
    <html {...htmlAttributes} lang="en">
      <head>
        {headNodes}
        <meta charSet="utf-8" />
        <meta name='impact-site-verification' content='a180ff90-b21a-4a80-93fc-36696aad5bdb'/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="dark light" />
        
        {/* Default SEO Meta Tags */}
        <meta name="author" content="David Grimsley" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="DJsPortfolio" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/pwa-180x180.png" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#20182D" />
        <script src="/__djsportfolio_runtime_config__" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {\n  try {\n    const meta = document.querySelector('meta[name="theme-color"]');\n    const mq = window.matchMedia('(prefers-color-scheme: dark)');\n    const set = () => {\n      const color = mq.matches ? '#20182D' : '#E9DDEE';\n      if (meta) meta.setAttribute('content', color);\n      document.documentElement.style.backgroundColor = color;\n      if (document.body) document.body.style.backgroundColor = color;\n    };\n    set();\n    if (mq.addEventListener) mq.addEventListener('change', set);\n    else mq.addListener(set);\n  } catch {}\n})();`,
          }}
        />

        {/* Google Fonts (web). Native uses local fonts via expo-font. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Londrina+Shadow&family=Noto+Sans+Display:ital,wght@0,100..900;1,100..900&family=Noto+Sans+Mono:wght@100..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif+Display:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap"
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const responsiveBackground = `
html, body, #root, #app, #expo-root {
  background-color: #20182D;
  height: 100%;
  min-height: 100%;
  min-height: 100svh;
  width: 100%;
  margin: 0;
  padding: 0;
}
body {
  overflow-x: hidden;
  overscroll-behavior: none;
}
@media (prefers-color-scheme: light) {
  html, body, #root, #app, #expo-root {
    background-color: #E9DDEE;
  }
}
`;
