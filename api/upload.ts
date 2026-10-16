import { put } from '@vercel/blob';

/**
 * Vercel Serverless Function (Node.js Runtime)
 * Route: POST /api/upload?filename=...
 * Body: Raw File / Stream (bukan FormData agar kompatibel murni dengan Node.js stream)
 * Returns: { status: 'success', url: string }
 */
export default async function handler(req: any, res?: any) {
  if (req.method !== 'POST') {
    if (res && typeof res.status === 'function') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const url = new URL(req.url || '', 'http://localhost');
    const rawFilename = url.searchParams.get('filename') || req.query?.filename || `upload-${Date.now()}`;
    const safeName = String(rawFilename).replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `desa-jubelan/${Date.now()}-${safeName}`;

    const contentType = req.headers?.['content-type'] || 'application/octet-stream';
    const token =
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.JUBELAN_READ_WRITE_TOKEN ||
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

    if (!token) {
      console.warn('[Upload WARNING] BLOB_READ_WRITE_TOKEN tidak ditemukan di environment variables!');
    }

    // Node.js req merupakan Readable Stream yang langsung didukung oleh @vercel/blob
    const blob = await put(filename, req, {
      access: 'public',
      contentType,
      ...(token ? { token } : {})
    });

    console.log(`[Upload SUCCESS] File uploaded: ${blob.url}`);

    if (res && typeof res.status === 'function') {
      return res.status(200).json({ status: 'success', url: blob.url });
    }
    return new Response(JSON.stringify({ status: 'success', url: blob.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('[Upload Error]', err);
    const msg = err?.message || 'Error uploading to Blob';
    if (res && typeof res.status === 'function') {
      return res.status(500).json({ error: 'Upload gagal: ' + msg });
    }
    return new Response(JSON.stringify({ error: 'Upload gagal: ' + msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
