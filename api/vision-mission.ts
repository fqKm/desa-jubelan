// api/vision-mission.ts
import { db, visimisi } from './_db.js';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

// In-memory cache (Vercel may reuse serverless instances)
let visionCache: { data: { vision: string[]; mission: string }; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function handler(req: Request) {
  if (req.method === 'GET') {
    // Serve from cache if fresh
    if (visionCache && Date.now() - visionCache.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(visionCache.data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      });
    }

    const visionRows = await db.select().from(visimisi).where(eq(visimisi.type, 'vision'));
    const vision = visionRows.map(r => r.content);
    const missionRow = await db.select().from(visimisi).where(eq(visimisi.type, 'mission')).limit(1);
    const mission = missionRow[0]?.content ?? '';
    const payload = { vision, mission };
    // Store in cache
    visionCache = { data: payload, ts: Date.now() };
    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  }

  if (req.method === 'PUT') {
    try {
      const { vision, mission } = (await req.json()) as { vision: string[]; mission: string };
      await db.execute(sql`DELETE FROM visimisi WHERE type = 'vision'`);
      await db.execute(sql`DELETE FROM visimisi WHERE type = 'mission'`);
      for (const v of vision) {
        await db.insert(visimisi).values({ id: crypto.randomUUID(), type: 'vision', content: v });
      }
      if (mission?.trim()) {
        await db.insert(visimisi).values({ id: crypto.randomUUID(), type: 'mission', content: mission });
      }
      // Invalidate cache after update
      visionCache = null;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.error('[visionMission] error', e);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
export const GET = handler;
export const PUT = handler;
