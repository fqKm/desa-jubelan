import { db, config } from './_db.js';

/**
 * Vercel Serverless Function (Node.js & Edge compatible)
 * Route: GET /api/config   → Ambil semua config sebagai key-value object
 *        PUT /api/config   → Update/upsert config keys
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
  console.log(`[CONFIG START] Method: ${method}, URL: ${req.url}`);

  try {
    // GET — return { kepala_desa: '...', mode: '...' }
    if (method === 'GET') {
      try {
        const rows = await db.select().from(config);
        const result: Record<string, string> = {};
        for (const row of rows) {
          result[row.key] = row.value;
        }
        console.log(`[CONFIG GET SUCCESS] Loaded ${rows.length} keys`);
        return sendResponse(
          res,
          200,
          { status: 'success', data: result },
          { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' }
        );
      } catch (err: any) {
        console.error('[CONFIG GET ERROR]', err);
        return sendResponse(res, 500, {
          error: err?.message || 'Database error reading config',
          details: String(err)
        });
      }
    }

    // PUT — upsert one or more keys: { kepala_desa: '...', ... }
    if (method === 'PUT') {
      try {
        let body: any = req.body;
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body);
          } catch {
            body = {};
          }
        } else if (!body && typeof req.json === 'function') {
          body = await req.json();
        }
        body = body || {};

        console.log('[CONFIG PUT PAYLOAD]', JSON.stringify(body));

        for (const [key, value] of Object.entries(body)) {
          await db.insert(config)
            .values({ key, value: String(value) })
            .onConflictDoUpdate({
              target: config.key,
              set: { value: String(value) }
            });
        }

        console.log('[CONFIG PUT SUCCESS]');
        return sendResponse(res, 200, { status: 'success' });
      } catch (err: any) {
        console.error('[CONFIG PUT ERROR]', err);
        return sendResponse(res, 500, {
          error: err?.message || 'Database error writing config',
          details: String(err)
        });
      }
    }

    return sendResponse(res, 405, { error: `Method ${method} not allowed` });
  } catch (fatalErr: any) {
    console.error('[CONFIG FATAL ERROR]', fatalErr);
    return sendResponse(res, 500, {
      error: fatalErr?.message || 'Server error',
      details: String(fatalErr)
    });
  }
}
