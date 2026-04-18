import { encodeBase64 } from 'jsr:@std/encoding@0.221/base64';

Deno.serve(async (req) => {
  const body = await req.json();
  const { url } = body;

  if (!url || typeof url !== 'string') {
    return Response.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TextureProxy/1.0)',
      'Accept': 'image/*',
    },
  });

  if (!response.ok) {
    return Response.json({ error: `Failed to fetch: ${response.status}` }, { status: 502 });
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // Use standard library base64 encoding
  const base64 = encodeBase64(uint8);

  return Response.json({ dataUrl: `data:${contentType};base64,${base64}` });
});