/**
 * Get mirror data by ID
 * GET /api/get-mirror/[id]
 */

export async function onRequest(context) {
  const { params, env } = context;
  const mirrorId = params.id;

  if (!mirrorId) {
    return jsonResponse({
      success: false,
      error: 'missing_id',
      message: 'Mirror ID is required',
    }, 400);
  }

  try {
    const mirrorData = await env.MIRRORS.get(`mirror:${mirrorId}`);

    if (!mirrorData) {
      return jsonResponse({
        success: false,
        error: 'not_found',
        message: 'Mirror not found',
      }, 404);
    }

    const mirror = JSON.parse(mirrorData);

    return jsonResponse({
      success: true,
      mirror,
    });

  } catch (error) {
    console.error('Get mirror error:', error);
    return jsonResponse({
      success: false,
      error: 'server_error',
      message: 'Failed to retrieve mirror',
    }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
