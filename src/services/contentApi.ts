import type { ContentPayload } from '@/types/content';

export async function getContent(): Promise<ContentPayload> {
  const response = await fetch('/api/content');

  if (!response.ok) {
    throw new Error(`Failed to load content (${response.status})`);
  }

  return response.json() as Promise<ContentPayload>;
}
