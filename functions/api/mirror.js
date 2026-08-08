/**
 * Cloudflare Pages Function to create album mirrors
 * POST /api/mirror
 * Body: { url: "https://rmqc.x.yupoo.com/albums/123456?uid=1" }
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Get the request URL to build mirror URLs dynamically
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    // Parse request body
    const body = await request.json();
    const yupooUrl = body.url;

    // Validate URL
    const parsed = parseAlbumUrl(yupooUrl);
    if (!parsed) {
      return jsonResponse({
        success: false,
        error: 'invalid_url',
        message: 'Invalid Yupoo album URL. Expected format: https://{vendor}.x.yupoo.com/albums/[ID]',
      }, 400);
    }
    const { vendor, albumId } = parsed;

    // Check if already mirrored (cache hit)
    const existingMirrorId = await env.MIRRORS.get(`yupoo:${vendor}:${albumId}`);
    if (existingMirrorId) {
      // Return cached mirror
      const existingMirror = await env.MIRRORS.get(`mirror:${existingMirrorId}`);
      if (existingMirror) {
        const mirrorData = JSON.parse(existingMirror);
        return jsonResponse({
          success: true,
          mirror_id: existingMirrorId,
          mirror_url: `${baseUrl}/m/${existingMirrorId}`,
          album: {
            title: mirrorData.title,
            image_count: mirrorData.images.length,
            thumbnail: mirrorData.cover,
          },
          cached: true,
        });
      }
    }

    // Fetch album from Yupoo
    const albumData = await fetchYupooAlbum(vendor, albumId);
    if (!albumData) {
      return jsonResponse({
        success: false,
        error: 'fetch_failed',
        message: 'Failed to fetch album from Yupoo. The album may not exist.',
      }, 404);
    }

    // Generate unique mirror ID
    const mirrorId = generateMirrorId();

    // Store mirror data
    const mirrorData = {
      id: mirrorId,
      vendor,
      yupoo_id: albumId,
      title: albumData.title,
      cover: albumData.cover,
      images: albumData.images,
      created_at: new Date().toISOString(),
      views: 0,
      source_url: yupooUrl,
    };

    // Save to KV
    await env.MIRRORS.put(`mirror:${mirrorId}`, JSON.stringify(mirrorData));
    await env.MIRRORS.put(`yupoo:${vendor}:${albumId}`, mirrorId);

    // Return success
    return jsonResponse({
      success: true,
      mirror_id: mirrorId,
      mirror_url: `${baseUrl}/m/${mirrorId}`,
      album: {
        title: albumData.title,
        image_count: albumData.images.length,
        thumbnail: albumData.cover,
      },
      cached: false,
    });

  } catch (error) {
    console.error('Mirror creation error:', error);
    return jsonResponse({
      success: false,
      error: 'server_error',
      message: 'An internal error occurred. Please try again.',
    }, 500);
  }
}

// Helper: Extract vendor + album ID from a Yupoo album URL
function parseAlbumUrl(url) {
  const match = url.match(/https?:\/\/([a-zA-Z0-9_-]+)\.x\.yupoo\.com\/albums\/(\d+)/);
  if (!match) return null;
  return { vendor: match[1], albumId: match[2] };
}

// Helper: Fetch and parse Yupoo album
async function fetchYupooAlbum(vendor, albumId) {
  const url = `https://${vendor}.x.yupoo.com/albums/${albumId}?uid=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].split(' _ ')[0] : `Album ${albumId}`;

    // Extract images using regex
    const images = [];
    // Try data-src pattern (current Yupoo format)
    const imagePattern = new RegExp(`data-src="[^"]*photo\\.yupoo\\.com/${vendor}/([^/"]+)`, 'g');
    let match;

    while ((match = imagePattern.exec(html)) !== null) {
      const imgId = match[1];
      images.push({
        small: `/api/image/${vendor}/${imgId}/small.jpg`,
        big: `/api/image/${vendor}/${imgId}/big.jpg`,
      });
    }

    // Fallback: try data-origin pattern (older format)
    if (images.length === 0) {
      const fallbackPattern = new RegExp(`data-origin="[^"]*photo\\.yupoo\\.com/${vendor}/([^/"]+)`, 'g');
      while ((match = fallbackPattern.exec(html)) !== null) {
        const imgId = match[1];
        images.push({
          small: `/api/image/${vendor}/${imgId}/small.jpg`,
          big: `/api/image/${vendor}/${imgId}/big.jpg`,
        });
      }
    }

    // Deduplicate images
    const uniqueImages = Array.from(
      new Map(images.map(img => [img.big, img])).values()
    );

    // Get cover (first image)
    const cover = uniqueImages[0]?.big.replace('/big.jpg', '/medium.jpg') || null;

    return {
      title: title.trim(),
      cover,
      images: uniqueImages,
    };

  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

// Helper: Generate unique mirror ID
function generateMirrorId() {
  // Generate random 8-character alphanumeric ID
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Helper: Create JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
