// api/item/[collection]/[id].ts
import { collectionService } from '../../services/collectionService.js';

/**
 * Controller Tier: Route Handler DELETE /api/item/[collection]/[id]
 */
function sendResponse(res: any, status: number, data: any) {
  if (res && typeof res.status === 'function') {
    return res.status(status).json(data);
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async function handler(req: any, res?: any) {
  if (req.method !== 'DELETE') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  try {
    const parts = (req.url || '').split('?')[0].split('/').filter(Boolean);
    const collectionName = req.query?.collection || parts[2];
    const id = req.query?.id || parts[3];

    if (!collectionService.isValidCollection(collectionName) || !id) {
      return sendResponse(res, 400, { error: `Parameter tidak valid: collection=${collectionName}, id=${id}` });
    }

    await collectionService.remove(collectionName, id);
    return sendResponse(res, 200, { status: 'success' });
  } catch (err: any) {
    console.error('[Delete Controller Error]', err);
    return sendResponse(res, 500, {
      error: err?.message || 'Database delete error',
      details: String(err)
    });
  }
}
