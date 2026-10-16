// api/collection/[collection].ts
import { collectionService } from '../services/collectionService.js';

/**
 * Controller Tier: Route Handler GET & POST /api/collection/[collection]
 */
function sendResponse(res: any, status: number, data: any, headers: Record<string, string> = {}) {
  if (res && typeof res.status === 'function') {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(status).json(data);
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

export default async function handler(req: any, res?: any) {
  const method = req.method || 'GET';

  try {
    const collectionName = req.query?.collection || req.url?.split('?')[0].split('/').filter(Boolean).pop();

    if (!collectionService.isValidCollection(collectionName)) {
      return sendResponse(res, 400, { error: `Koleksi tidak valid: ${collectionName}` });
    }

    if (method === 'GET') {
      const data = await collectionService.getAll(collectionName);
      return sendResponse(
        res,
        200,
        { status: 'success', data },
        { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
      );
    }

    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      } else if (!body && typeof req.json === 'function') {
        body = await req.json();
      }

      const id = await collectionService.save(collectionName, body || {});
      return sendResponse(res, 200, { status: 'success', id });
    }

    return sendResponse(res, 405, { error: `Method ${method} tidak didukung` });
  } catch (err: any) {
    console.error('[API Controller Error]', err);
    return sendResponse(res, 500, {
      error: err?.message || 'Database error',
      details: String(err)
    });
  }
}
