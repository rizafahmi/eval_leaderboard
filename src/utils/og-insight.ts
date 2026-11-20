import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CollectionEntry } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

type InsightEntry = CollectionEntry<'insight'>;
type InsightData = InsightEntry['data'];
type BadgeTone = 'acid' | 'violet' | 'mint' | 'sky' | 'magenta' | 'outline';

interface SatoriNode {
  type: string;
  props: Record<string, unknown> & {
    style?: Record<string, string | number>;
    children?: SatoriChild | SatoriChild[];
  };
}

type SatoriChild = SatoriNode | string | number | boolean | null | undefined;

const COLORS = {
  obsidian: '#121519',
  obsidianAlt: '#1b2026',
  ebony: '#0a0b0d',
  silver: '#e7ecf2',
  secondary: '#c2cad6',
  muted: '#8c96a3',
  borderStrong: '#434a56',
  borderSubtle: '#262c36',
  acid: '#c5f82a',
  violet: '#a984ff',
  mint: '#5ae67a',
  sky: '#8ce0ff',
  magenta: '#ff6ed4',
} as const;

const TONE_BG: Record<Exclude<BadgeTone, 'outline'>, string> = {
  acid: COLORS.acid,
  violet: COLORS.violet,
  mint: COLORS.mint,
  sky: COLORS.sky,
  magenta: COLORS.magenta,
};

interface FontSpec {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
  style: 'normal';
}

let cachedFontsPromise: Promise<FontSpec[]> | null = null;

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function loadFonts(): Promise<FontSpec[]> {
  if (!cachedFontsPromise) {
    const root = process.cwd();
    const fontFiles: Array<{
      name: string;
      weight: 400 | 700 | 800;
      relPath: string;
    }> = [
      {
        name: 'Unbounded',
        weight: 800,
        relPath: 'node_modules/@fontsource/unbounded/files/unbounded-latin-800-normal.woff',
      },
      {
        name: 'Schibsted Grotesk',
        weight: 400,
        relPath: 'node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-400-normal.woff',
      },
      {
        name: 'Schibsted Grotesk',
        weight: 700,
        relPath: 'node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-700-normal.woff',
      },
      {
        name: 'Martian Mono',
        weight: 400,
        relPath: 'node_modules/@fontsource/martian-mono/files/martian-mono-latin-400-normal.woff',
      },
      {
        name: 'Martian Mono',
        weight: 700,
        relPath: 'node_modules/@fontsource/martian-mono/files/martian-mono-latin-700-normal.woff',
      },
    ];

    cachedFontsPromise = Promise.all(
      fontFiles.map(async (f) => {
        const buf = await readFile(path.resolve(root, f.relPath));
        return {
          name: f.name,
          data: toArrayBuffer(buf),
          weight: f.weight,
          style: 'normal' as const,
        };
      })
    );
  }
  return cachedFontsPromise;
}

function sanitizeOgText(text: string): string {
  return text
    .replaceAll('≤', '<=')
    .replaceAll('≥', '>=')
    .replaceAll('≠', '!=')
    .replaceAll('→', '->');
}

function h(
  type: string,
  style: Record<string, string | number>,
  children?: SatoriChild | SatoriChild[]
): SatoriNode {
  const safeChildren =
    typeof children === 'string' ? sanitizeOgText(children) : children;
  return {
    type,
    props: {
      style: { boxSizing: 'border-box', ...style },
      ...(safeChildren !== undefined ? { children: safeChildren } : {}),
    },
  };
}

function renderBadge(text: string, tone: BadgeTone): SatoriNode {
  if (tone === 'outline') {
    return h(
      'div',
      {
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        border: `2px solid ${COLORS.borderStrong}`,
        color: COLORS.silver,
        fontFamily: 'Martian Mono',
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1.1,
      },
      text
    );
  }

  return h(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      padding: '7px 13px',
      backgroundColor: TONE_BG[tone],
      color: COLORS.ebony,
      fontFamily: 'Martian Mono',
      fontWeight: 700,
      fontSize: 15,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      lineHeight: 1.1,
    },
    text
  );
}

function renderBrandMark(): SatoriNode {
  return h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: 28,
      height: 28,
      border: `2px solid ${COLORS.borderStrong}`,
      flexShrink: 0,
    },
    [
      h('div', { display: 'flex', width: '100%', height: 12 }, [
        h('div', { width: 12, height: 12, backgroundColor: COLORS.acid }),
        h('div', { width: 12, height: 12, backgroundColor: COLORS.ebony }),
      ]),
      h('div', { display: 'flex', width: '100%', height: 12 }, [
        h('div', { width: 12, height: 12, backgroundColor: COLORS.mint }),
        h('div', { width: 12, height: 12, backgroundColor: COLORS.violet }),
      ]),
    ]
  );
}

export async function renderInsightOgPng(
  slug: string,
  insight: InsightData
): Promise<Uint8Array> {
  const fonts = await loadFonts();

  const coverSlide = insight.slides.find((s) => s.kind === 'cover');
  const headlinePrimary = coverSlide?.headlinePrimary ?? `${insight.title}.`;
  const headlineMuted = coverSlide?.headlineMuted ?? insight.subtitle;

  const badges: Array<{ text: string; tone: BadgeTone }> = coverSlide
    ? coverSlide.badges.slice(0, 3)
    : insight.tags.slice(0, 3).map((tag, idx) => ({
        text: tag,
        tone: idx === 0 ? 'acid' : idx === 1 ? 'sky' : 'outline',
      }));

  const stats = coverSlide?.stats?.slice(0, 3) ?? [];

  const totalHeadlineChars = Math.max(headlinePrimary.length, headlineMuted.length);
  const headlineSize = totalHeadlineChars > 52 ? 32 : totalHeadlineChars > 42 ? 35 : 40;

  const slideCountLabel = `${insight.slides.length} ${insight.slides.length === 1 ? 'SLIDE' : 'SLIDES'}`;

  const tree = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      backgroundColor: COLORS.obsidian,
      color: COLORS.silver,
      padding: '38px 54px 32px',
      fontFamily: 'Schibsted Grotesk',
    },
    [
      // Header bar
      h(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingBottom: 18,
          borderBottom: `4px solid ${COLORS.borderStrong}`,
        },
        [
          h('div', { display: 'flex', alignItems: 'center', gap: 14 }, [
            renderBrandMark(),
            h(
              'div',
              {
                display: 'flex',
                fontFamily: 'Martian Mono',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: COLORS.silver,
              },
              insight.brandLabel
            ),
          ]),
          h('div', { display: 'flex', alignItems: 'center', gap: 12 }, [
            h(
              'div',
              {
                display: 'flex',
                fontFamily: 'Martian Mono',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: COLORS.muted,
              },
              `INSIGHT · ${slideCountLabel}`
            ),
            renderBadge(insight.part, 'acid'),
          ]),
        ]
      ),

      // Main visual glimpse body
      h(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
          gap: 22,
          paddingTop: 22,
          paddingBottom: 22,
        },
        [
          // Badge row
          h(
            'div',
            {
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 10,
            },
            badges.map((b) => renderBadge(b.text, b.tone))
          ),

          // Two-tone headline
          h(
            'div',
            {
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            },
            [
              h(
                'div',
                {
                  display: 'flex',
                  fontFamily: 'Unbounded',
                  fontWeight: 800,
                  fontSize: headlineSize,
                  lineHeight: 1.14,
                  letterSpacing: '-0.025em',
                  color: COLORS.silver,
                },
                headlinePrimary
              ),
              h(
                'div',
                {
                  display: 'flex',
                  fontFamily: 'Unbounded',
                  fontWeight: 800,
                  fontSize: headlineSize,
                  lineHeight: 1.14,
                  letterSpacing: '-0.025em',
                  color: COLORS.muted,
                },
                headlineMuted
              ),
            ]
          ),

          // 3-stat glimpse strip (or fallback description box)
          stats.length > 0
            ? h(
                'div',
                {
                  display: 'flex',
                  gap: 16,
                  width: '100%',
                },
                stats.map((stat) => {
                  const isAccent = Boolean(stat.accent);
                  return h(
                    'div',
                    {
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flex: 1,
                      minWidth: 0,
                      padding: '18px 20px',
                      backgroundColor: isAccent ? COLORS.acid : COLORS.obsidianAlt,
                      border: `2px solid ${isAccent ? COLORS.ebony : COLORS.borderStrong}`,
                      gap: 8,
                    },
                    [
                      h(
                        'div',
                        {
                          display: 'flex',
                          fontFamily: 'Martian Mono',
                          fontWeight: 700,
                          fontSize: 13,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase',
                          color: isAccent ? COLORS.ebony : COLORS.muted,
                        },
                        stat.label
                      ),
                      h(
                        'div',
                        {
                          display: 'flex',
                          fontFamily: 'Unbounded',
                          fontWeight: 800,
                          fontSize: 36,
                          lineHeight: 1.05,
                          letterSpacing: '-0.02em',
                          color: isAccent ? COLORS.ebony : COLORS.silver,
                        },
                        stat.value
                      ),
                      h(
                        'div',
                        {
                          display: 'flex',
                          fontFamily: 'Schibsted Grotesk',
                          fontWeight: 700,
                          fontSize: 16,
                          lineHeight: 1.25,
                          color: isAccent ? COLORS.ebony : COLORS.secondary,
                        },
                        stat.sub
                      ),
                    ]
                  );
                })
              )
            : h(
                'div',
                {
                  display: 'flex',
                  padding: '20px 24px',
                  backgroundColor: COLORS.obsidianAlt,
                  border: `2px solid ${COLORS.borderStrong}`,
                  fontFamily: 'Schibsted Grotesk',
                  fontWeight: 400,
                  fontSize: 22,
                  lineHeight: 1.45,
                  color: COLORS.secondary,
                },
                insight.description
              ),
        ]
      ),

      // Footer bar
      h(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingTop: 18,
          borderTop: `1px solid ${COLORS.borderSubtle}`,
          fontFamily: 'Martian Mono',
          fontWeight: 700,
          fontSize: 15,
        },
        [
          h('div', { display: 'flex', color: COLORS.silver }, insight.footerLeft),
          h(
            'div',
            { display: 'flex', color: COLORS.muted },
            `eval.rizafahmi.com/insight/${slug}`
          ),
        ]
      ),
    ]
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      loadSystemFonts: false,
    },
  });

  return resvg.render().asPng();
}
