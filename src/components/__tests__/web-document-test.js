/** @jest-environment node */
import React from 'react';
import { afterEach, expect, it, jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import RootDocument from '@/app/+html';

jest.mock('expo-router/html', () => ({
  useServerDocumentContext: () => ({}),
  ScrollViewStyleReset: () => null,
}));

const originalNodeEnv = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

it.each(['development', 'production'])('uses the appropriate CSS bootstrap in %s', environment => {
  process.env.NODE_ENV = environment;
  const html = renderToStaticMarkup(<RootDocument><h1>Portfolio</h1></RootDocument>);
  expect(html.includes('src="/__djsportfolio_css__"')).toBe(environment === 'production');
  expect(html).toContain('src="/__djsportfolio_runtime_config__"');
  expect(html).toContain('<h1>Portfolio</h1>');
});
