import { put } from '@vercel/blob';

/**
 * Vercel Serverless Function (Edge Runtime)
 * Route: POST /api/upload
 * Body: FormData with field "file"
 * Returns: { status: 'success', url: string }
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('[Upload] Processing upload request...');
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.warn('[Upload] File tidak ditemukan di FormData');
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[Upload] File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    // Validasi tipe file
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf'
    ];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: 'Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.' },
        { status: 400 }
      );
    }

    // Validasi ukuran (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: 'Ukuran file terlalu besar. Maksimum 5 MB.' },
        { status: 400 }
      );
    }

    // Buat nama file unik dengan timestamp
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `desa-jubelan/${Date.now()}-${safeName}`;

    const token =
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.JUBELAN_READ_WRITE_TOKEN ||
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

    if (!token) {
      console.warn('[Upload WARNING] BLOB_READ_WRITE_TOKEN tidak ditemukan di env!');
    }

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
      ...(token ? { token } : {})
    });

    console.log(`[Upload SUCCESS] File uploaded to: ${blob.url}`);
    return Response.json({ status: 'success', url: blob.url });
  } catch (err: any) {
    console.error('[Upload Error]', err);
    return Response.json({
      error: 'Upload gagal: ' + (err?.message || 'Error uploading to Blob'),
      details: String(err)
    }, { status: 500 });
  }
}
