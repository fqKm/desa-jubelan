// api/visionMission.ts
import { db, visimisi } from './_db.js';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

export async function handler(req: Request) {
  const url = new URL(req.url);
  if (url.pathname !== '/api/vision-mission') return new Response('Not found', { status: 404 });

  if (req.method === 'GET') {
    const visionRows = await db.select().from(visimisi).where(eq(visimisi.type, 'vision'));
    const vision = visionRows.map(r => r.content);
    const missionRow = await db.select().from(visimisi).where(eq(visimisi.type, 'mission')).limit(1);
    const mission = missionRow[0]?.content ?? '';
    return new Response(JSON.stringify({ vision, mission }), { headers: { 'Content-Type': 'application/json' } });
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
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e) {
      console.error('[visionMission] error', e);
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
export const GET = handler;
export const PUT = handler;
