import fs from 'node:fs';
import path from 'node:path';
import type { Pieces } from '@/types/portfolio';
import { relatedProjectHref } from '../portfolio-links';

const root = path.resolve(__dirname, '../../..');
const data: Pieces = JSON.parse(fs.readFileSync(path.join(root, 'src/constants/json/pieces.json'), 'utf8'));
const newSlugs = ['time2pay', 'medimagen', 'guess-the-qubit-ar', 'quasicombo', 'neo-rock-em-sock-em-robots', 'guess-the-qubit-unreal', 'football-game', 'isquared'];
const all = Object.values(data).flat();
const entries = all.filter(piece => newSlugs.includes(piece.title));

it('publishes all eight case studies with Quasicombo as the only homepage feature', () => {
  expect(entries).toHaveLength(8);
  expect(all.filter(piece => piece.isFeatured).map(piece => piece.title)).toEqual(['quasicombo']);
  for (const pieces of Object.values(data)) expect(new Set(pieces.map(piece => piece.title)).size).toBe(pieces.length);
});

it('lists the three AR apps individually and treats XR Showcase only as their source workspace', () => {
  expect(all.some(piece => piece.title === 'xr-showcase')).toBe(false);
  expect(data['game-design'].some(piece => piece.title === 'neo-rock-em-sock-em-robots')).toBe(true);
  expect(data['mobile-apps'].some(piece => piece.title === 'neo-rock-em-sock-em-robots')).toBe(false);
  for (const slug of ['medimagen', 'guess-the-qubit-ar']) {
    expect(data['mobile-apps'].some(piece => piece.title === slug)).toBe(true);
  }
  const tools = all.find(piece => piece.title === 'isquared')!;
  for (const slug of ['medimagen', 'guess-the-qubit-ar', 'neo-rock-em-sock-em-robots']) {
    const app = all.find(piece => piece.title === slug)!;
    expect(app.links!.some(link => link.url === 'https://github.com/DavidJGrimsley/xr-showcase')).toBe(true);
    expect(app.links!.map(link => link.label).join(' ')).not.toContain('XR Showcase');
    expect(app.otherSections!.some(section => section.title === 'isquared')).toBe(true);
    expect(tools.otherSections!.some(section => section.title === slug)).toBe(true);
  }
  expect(all.flatMap(piece => piece.otherSections ?? []).some(section => section.title === 'xr-showcase')).toBe(false);
});

it('resolves every old and new related project to an existing page', () => {
  const routes = new Set(Object.entries(data).flatMap(([category, pieces]) => pieces.map(piece => `/portfolio/${category}/${encodeURIComponent(piece.title)}`)));
  routes.add('/public-facing/api/quantum');
  for (const piece of all) for (const section of piece.otherSections ?? []) expect(routes.has(relatedProjectHref(section))).toBe(true);
});

it('ships descriptive, local media and labeled external links for each new case study', () => {
  for (const piece of entries) {
    expect(piece.pictureDescription?.trim()).toBeTruthy();
    expect(piece.highlights!.length).toBeGreaterThanOrEqual(3);
    const images = [piece.picture, ...(piece.gif ? [piece.gif] : []), ...piece.highlights!.flatMap(highlight => highlight.highlightPictures ?? [])];
    for (const image of images) expect(fs.existsSync(path.join(root, 'public', image))).toBe(true);
    for (const highlight of piece.highlights!) {
      if (highlight.highlightPictures) expect(highlight.highlightPictureDescriptions).toHaveLength(highlight.highlightPictures.length);
    }
    for (const link of piece.links!) {
      expect(link.label.trim()).toBeTruthy();
      expect(new URL(link.url).protocol).toBe('https:');
    }
  }
});

it('keeps platform versions and the separate no-code entry distinct', () => {
  const find = (slug: string) => entries.find(piece => piece.title === slug)!;
  expect(find('guess-the-qubit-unreal').links!.some(link => link.url.includes('guess-the-qubit/releases'))).toBe(true);
  expect(find('guess-the-qubit-ar').links!.some(link => link.url.includes('testflight.apple.com'))).toBe(true);
  expect(find('football-game').links!.some(link => link.url.includes('testflight.apple.com'))).toBe(false);
  expect(find('isquared').highlights!.some(highlight => highlight.highlightCaption?.includes('Design exploration'))).toBe(true);
});
