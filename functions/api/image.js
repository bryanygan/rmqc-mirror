/**
 * Cloudflare Pages Function to proxy Yupoo images
 * This bypasses CORS/CORB restrictions by fetching images server-side
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  // Validate the image URL is from Yupoo
  if (!imageUrl || !imageUrl.startsWith('https://photo.yupoo.com/')) {
    return new Response('Invalid image URL', { status: 400 });
  }

  try {
    // Fetch the image from Yupoo with proper headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://rmqc.x.yupoo.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!imageResponse.ok) {
      return new Response('Failed to fetch image', { status: imageResponse.status });
    }

    // Return the image with appropriate headers
    return new Response(imageResponse.body, {
      headers: {
        'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response('Error fetching image: ' + error.message, { status: 500 });
  }
}
