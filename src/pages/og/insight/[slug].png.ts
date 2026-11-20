import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { renderInsightOgPng } from '../../../utils/og-insight';

export const getStaticPaths: GetStaticPaths = async () => {
  const insights = (await getCollection('insight')).filter(
    (entry) => entry.data.published !== false
  );

  return insights.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const entry = props.entry as CollectionEntry<'insight'>;
  const png = await renderInsightOgPng(entry.id, entry.data);

  return new Response(Buffer.from(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
