import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TEXTURE_SOURCES = {
  moon: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
  mars: 'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
  mercury: 'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
  venus: 'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
  earth: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
  jupiter: 'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
  saturn: 'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
  uranus: 'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg',
  neptune: 'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg',
  sun: 'https://www.solarsystemscope.com/textures/download/2k_sun.jpg',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action; // 'download' or 'get'
    const textureKey = body.textureKey;

    if (action === 'download') {
      // Download and cache texture from source
      const sourceUrl = TEXTURE_SOURCES[textureKey];
      if (!sourceUrl) {
        return Response.json({ error: 'Unknown texture key' }, { status: 400 });
      }

      let textureRes;
      try {
        textureRes = await fetch(sourceUrl, { timeout: 30000 });
      } catch (fetchErr) {
        return Response.json({ error: `Failed to fetch texture: ${fetchErr.message}` }, { status: 502 });
      }

      if (!textureRes.ok) {
        return Response.json({ error: `Texture source returned ${textureRes.status}` }, { status: 502 });
      }

      let blob;
      try {
        blob = await textureRes.blob();
      } catch (blobErr) {
        return Response.json({ error: `Failed to process texture: ${blobErr.message}` }, { status: 500 });
      }

      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload as private file
      let uploadRes;
      try {
        uploadRes = await base44.integrations.Core.UploadPrivateFile({
          file: uint8Array,
        });
      } catch (uploadErr) {
        return Response.json({ error: `Failed to upload texture: ${uploadErr.message}` }, { status: 500 });
      }

      // Store mapping in AppSettings
      try {
        // Check if entry already exists
        const existing = await base44.asServiceRole.entities.AppSettings.filter({
          key: `texture_${textureKey}`,
        });

        if (existing.length > 0) {
          // Update existing
          await base44.asServiceRole.entities.AppSettings.update(existing[0].id, {
            value: uploadRes.file_uri,
          });
        } else {
          // Create new
          await base44.asServiceRole.entities.AppSettings.create({
            key: `texture_${textureKey}`,
            value: uploadRes.file_uri,
            category: 'textures',
            label: `${textureKey} texture URI`,
            description: `Private file URI for ${textureKey} texture`,
          });
        }
      } catch (settingsErr) {
        return Response.json({ error: `Failed to save texture: ${settingsErr.message}` }, { status: 500 });
      }

      return Response.json({
        success: true,
        textureKey,
        fileUri: uploadRes.file_uri,
      });
    } else if (action === 'getAll') {
      // Get all cached texture URIs
      const settings = await base44.asServiceRole.entities.AppSettings.filter({
        category: 'textures',
      });

      const textures = {};
      settings.forEach(s => {
        const key = s.key.replace('texture_', '');
        textures[key] = s.value;
      });

      return Response.json({ textures });
    } else if (action === 'get') {
      // Get signed URL for a specific texture
      const setting = await base44.asServiceRole.entities.AppSettings.filter({
        key: `texture_${textureKey}`,
      });

      if (setting.length === 0) {
        return Response.json({ signedUrl: null, isCached: false });
      }

      const fileUri = setting[0].value;
      try {
        const signedUrlRes = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: fileUri,
          expires_in: 86400, // 24 hours
        });
        return Response.json({ signedUrl: signedUrlRes.signed_url, isCached: true });
      } catch (signErr) {
        return Response.json({ signedUrl: null, isCached: false, error: signErr.message });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});