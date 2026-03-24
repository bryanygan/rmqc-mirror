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

    /* Lightbox styles */
    .lightbox {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      cursor: pointer;
    }
    .lightbox.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lightbox-content {
      position: relative;
      max-width: 90%;
      max-height: 90%;
      cursor: default;
    }
    .lightbox-image {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
      display: block;
    }
    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      font-size: 48px;
      padding: 20px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.3s;
      border-radius: 4px;
      line-height: 1;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lightbox-nav:hover {
      background-color: rgba(255, 255, 255, 0.4);
    }
    .lightbox-nav.prev {
      left: 20px;
    }
    .lightbox-nav.next {
      right: 20px;
    }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 30px;
      color: white;
      font-size: 40px;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      width: 40px;
      height: 40px;
      line-height: 1;
    }
    .lightbox-close:hover {
      color: #ccc;
    }
    .lightbox-counter {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 18px;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 8px 16px;
      border-radius: 4px;
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
        <div class="image-item" onclick="openLightbox(${i})">
          <img src="${escapeHtml(img.small)}" alt="Image ${i + 1}" loading="lazy"
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22250%22%3E%3Crect fill=%22%23ddd%22 width=%22250%22 height=%22250%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage Error%3C/text%3E%3C/svg%3E'">
        </div>
      `).join('')}
    </div>

  </div>

  <!-- Lightbox Modal -->
  <div id="lightbox" class="lightbox">
    <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
    <div class="lightbox-counter" id="lightbox-counter"></div>
    <button class="lightbox-nav prev" onclick="navigateLightbox(-1); event.stopPropagation();">&#10094;</button>
    <div class="lightbox-content" onclick="event.stopPropagation()">
      <img id="lightbox-image" class="lightbox-image" src="" alt="">
    </div>
    <button class="lightbox-nav next" onclick="navigateLightbox(1); event.stopPropagation();">&#10095;</button>
  </div>

  <script>
    var currentImages = [${mirror.images.map(img => `{small:"${escapeHtml(img.small)}",large:"${escapeHtml(img.big)}"}`).join(',')}];
    var currentIndex = 0;

    function openLightbox(index) {
      currentIndex = index;
      var lightbox = document.getElementById('lightbox');
      var lightboxImage = document.getElementById('lightbox-image');
      var counter = document.getElementById('lightbox-counter');
      var imgData = currentImages[currentIndex];
      lightboxImage.src = imgData.large || imgData.small;
      counter.textContent = (currentIndex + 1) + ' / ' + currentImages.length;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
      document.body.style.overflow = '';
    }

    function navigateLightbox(direction) {
      currentIndex += direction;
      if (currentIndex < 0) currentIndex = currentImages.length - 1;
      else if (currentIndex >= currentImages.length) currentIndex = 0;
      var imgData = currentImages[currentIndex];
      document.getElementById('lightbox-image').src = imgData.large || imgData.small;
      document.getElementById('lightbox-counter').textContent = (currentIndex + 1) + ' / ' + currentImages.length;
    }

    document.addEventListener('keydown', function(e) {
      if (!document.getElementById('lightbox').classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') navigateLightbox(-1);
      else if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    document.getElementById('lightbox').addEventListener('click', closeLightbox);
  </script>
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
