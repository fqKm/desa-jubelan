import { put } from '@vercel/blob';

/**
 * Vercel Serverless Function
 * Route: POST /api/upload
 * Body: FormData with field "file"
 * Returns: { url: string }
 *
 * Digunakan untuk upload:
 * - Foto UMKM
 * - Thumbnail Berita
 * - File Dokumen PDF
 */
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

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
    const ext = file.name.split('.').pop() ?? 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `desa-jubelan/${Date.now()}-${safeName}`;

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return Response.json({ status: 'success', url: blob.url });
  } catch (err) {
    console.error('[Upload Error]', err);
    return Response.json({ error: 'Upload gagal' }, { status: 500 });
  }
}
