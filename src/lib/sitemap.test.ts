import { describe, expect, it } from 'vitest';
import { LANGUAGES } from './i18n';
// Read through Vite rather than `node:fs`, which would mean adding @types/node
// to a project that otherwise never touches a Node API.
import sitemap from '../../public/sitemap.xml?raw';
import robots from '../../public/robots.txt?raw';
import stylesheet from '../../public/sitemap.xsl?raw';

/**
 * The sitemap is hand-written, which means it can quietly fall behind the app.
 * The thing it declares — which languages exist — is derived from `i18n.ts`
 * everywhere else, so a third language added there and not here would ship a
 * sitemap that lies. That is what this catches.
 */
const SITE = 'https://duty.commutator.io';

describe('the sitemap', () => {
  it('declares an alternate for every language the app ships', () => {
    for (const l of LANGUAGES) {
      expect(sitemap, `hreflang="${l}" is missing`).toContain(
        `hreflang="${l}" href="${SITE}/?lang=${l}"`,
      );
    }
  });

  it('declares no language the app does not ship', () => {
    const declared = [...sitemap.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
    for (const l of new Set(declared)) {
      expect(l === 'x-default' || (LANGUAGES as readonly string[]).includes(l)).toBe(true);
    }
  });

  it('points x-default at the address that follows the reader, not at one language', () => {
    expect(sitemap).toContain(`hreflang="x-default" href="${SITE}/"`);
  });

  it('gives every alternate block to every listed URL, as hreflang requires', () => {
    const blocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect(b).toMatch(/<loc>https:\/\/duty\.commutator\.io\/[^<]*<\/loc>/);
      expect([...b.matchAll(/hreflang=/g)]).toHaveLength(LANGUAGES.length + 1);
    }
  });

  it('is reachable, because a sitemap nothing points at is not discovered', () => {
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  /**
   * WebKit builds no document body for an unstyled XML file, so Safari shows a
   * blank page and the file reads as broken to anyone checking it by hand.
   * Losing the stylesheet would bring that back silently.
   */
  it('carries the stylesheet that makes it visible in Safari', () => {
    expect(sitemap).toContain('<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>');
    expect(stylesheet).toContain('xmlns:xsl="http://www.w3.org/1999/XSL/Transform"');
  });

  it('gives the stylesheet every namespace it has to reach into', () => {
    for (const ns of [
      'http://www.sitemaps.org/schemas/sitemap/0.9',
      'http://www.w3.org/1999/xhtml',
    ]) {
      expect(stylesheet).toContain(ns);
    }
  });

  it('keeps the rendered view out of the index — it is furniture, not a page', () => {
    expect(stylesheet).toContain('name="robots" content="noindex"');
  });
});
