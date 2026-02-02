import { CONTENT_VERSION, services } from '@/server/data/servicesConfig';
import type { ContentPayload } from '@/types/content';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export function GET() {
  const payload: ContentPayload = {
    version: CONTENT_VERSION,
    generatedAt: new Date().toISOString(),
    services,
  };

  return Response.json(payload, { headers: corsHeaders });
}
