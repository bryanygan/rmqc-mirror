/**
 * Cloudflare Pages Function to serve mirror viewer
 * GET /m/[id]
 */

export async function onRequest(context) {
  const { params, env } = context;
  const mirrorId = params.id;

  // Fetch mirror data
  try {
    const mirrorData = await env.MIRRORS.get(`mirror:${mirrorId}`);

    if (!mirrorData) {
      return new Response(generateErrorHTML('Mirror not found'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const mirror = JSON.parse(mirrorData);

    // Increment view count (async, don't await)
    const currentViews = mirror.views || 0;
    mirror.views = currentViews + 1;
    env.MIRRORS.put(`mirror:${mirrorId}`, JSON.stringify(mirror));

    // Generate and return HTML
    return new Response(generateMirrorHTML(mirror), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Mirror viewer error:', error);
    return new Response(generateErrorHTML('Failed to load mirror'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

function generateMirrorHTML(mirror) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="origin">
  <title>${escapeHtml(mirror.title)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f8f8f8;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 10px;
    }
    .info {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .image-item {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .image-item:hover {
      transform: scale(1.05);
    }
    .image-item img {
      width: 100%;
      height: 250px;
      object-fit: cover;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
    }
    .footer a {
      color: #49bc85;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(mirror.title)}</h1>
    <div class="info">
      ${mirror.images.length} images
    </div>
    <div class="image-grid">
      ${mirror.images.map((img, i) => `
        <div class="image-item" onclick="window.open('${escapeHtml(img.big)}', '_blank')">
          <img src="${escapeHtml(img.small)}" alt="Image ${i + 1}" loading="lazy"
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22250%22%3E%3Crect fill=%22%23ddd%22 width=%22250%22 height=%22250%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage Error%3C/text%3E%3C/svg%3E'">
        </div>
      `).join('')}
    </div>

  </div>
</body>
</html>`;
}

function generateErrorHTML(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f8f8f8;
    }
    .error {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .error h2 {
      color: #c62828;
    }
    .error a {
      color: #49bc85;
      text-decoration: none;
    }
    .error a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="error">
    <h2>Error</h2>
    <p>${escapeHtml(message)}</p>
             <p><a href="/">Back to home</a></p>  </div>
</body>
</html>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
