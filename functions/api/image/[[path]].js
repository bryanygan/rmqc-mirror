/**
 * Cloudflare Pages Function to proxy images
 * Path format: /api/image/{vendor}/{imageId}/{size}
 * Example: /api/image/rmqc/4c321195/medium.jpg
 */

export async function onRequest(context) {
  const { params } = context;

  // Get the catch-all path parameter
  // For /api/image/rmqc/xxx/medium.jpg, params.path = ["rmqc", "xxx", "medium.jpg"]
  const pathParts = params.path || [];

  if (pathParts.length !== 3) {
    return new Response('Invalid path format. Expected: /api/image/{vendor}/{imageId}/{size}', { status: 400 });
  }

  const vendor = pathParts[0];
  const imageId = pathParts[1];
  const sizeFile = pathParts[2]; // e.g., "medium.jpg" or "medium.jpeg"

  // Construct the upstream URL (internal - not exposed to client)
  const imageUrl = `https://photo.yupoo.com/${vendor}/${imageId}/${sizeFile}`;

  try {
    // Fetch the image with proper headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://rmqc.x.yupoo.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!imageResponse.ok) {
      return new Response('Image not found', { status: imageResponse.status });
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
    return new Response('Error loading image', { status: 500 });
  }
}
