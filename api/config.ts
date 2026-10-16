// api/config.ts
import { db, config } from './_db.js';

/**
 * Controller: GET & PUT /api/config
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
    if (method === 'GET') {
      const rows = await db.select().from(config);
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }
      return sendResponse(res, 200, { status: 'success', data: result }, {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      });
    }

    if (method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      } else if (!body && typeof req.json === 'function') {
        body = await req.json();
      }
      body = body || {};

      for (const [key, value] of Object.entries(body)) {
        await db.insert(config)
          .values({ key, value: String(value) })
          .onConflictDoUpdate({
            target: config.key,
            set: { value: String(value) }
          });
      }

      return sendResponse(res, 200, { status: 'success' });
    }

    return sendResponse(res, 405, { error: `Method ${method} tidak didukung` });
  } catch (err: any) {
    console.error('[Config Error]', err);
    return sendResponse(res, 500, {
      error: err?.message || 'Database error',
      details: String(err)
    });
  }
}
