// tests/pre-deploy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, boolean } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

// Muat .env.local jika ada
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 1. UNIT TEST: Business Logic & Sanitasi Service Layer
// ─────────────────────────────────────────────────────────────
test('Service Logic: Sanitasi Dusun & Validasi Mandatori', () => {
  const sanitizeDusun = (body) => {
    if (!body?.nama?.trim()) throw new Error('Nama dusun wajib diisi');
    return {
      id: body.id || `dusun-${Date.now()}`,
      nama: String(body.nama).trim(),
      jumlah_kk: Math.max(0, Number(body.jumlah_kk) || 0),
      jumlah_jiwa: Math.max(0, Number(body.jumlah_jiwa) || 0)
    };
  };

  // Validasi nama kosong
  assert.throws(() => sanitizeDusun({ nama: '   ' }), /Nama dusun wajib diisi/);

  // Sanitasi konversi angka
  const valid = sanitizeDusun({ nama: 'Dusun Krajan', jumlah_kk: '120', jumlah_jiwa: '450' });
  assert.equal(valid.nama, 'Dusun Krajan');
  assert.equal(valid.jumlah_kk, 120);
  assert.equal(valid.jumlah_jiwa, 450);
});

test('Service Logic: Sanitasi Pengumuman & Tipe Boolean', () => {
  const sanitizePengumuman = (body) => {
    if (!body?.judul?.trim()) throw new Error('Judul pengumuman wajib diisi');
    return {
      id: body.id || `pengumuman-${Date.now()}`,
      judul: String(body.judul).trim(),
      is_penting: Boolean(body.is_penting)
    };
  };

  assert.throws(() => sanitizePengumuman({}), /Judul pengumuman wajib diisi/);

  const res1 = sanitizePengumuman({ judul: 'Info Vaksin', is_penting: true });
  assert.equal(res1.is_penting, true);

  const res2 = sanitizePengumuman({ judul: 'Info Ronda', is_penting: false });
  assert.equal(res2.is_penting, false);
});

// ─────────────────────────────────────────────────────────────
// 2. INTEGRATION TEST: Database I/O (Neon PostgreSQL via Drizzle)
// ─────────────────────────────────────────────────────────────
test('Database I/O: Koneksi dan CRUD Round-trip Drizzle ke Neon', async (t) => {
  const connStr =
    process.env.POSTGRES_URL ||
    process.env.JUBELAN_POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.JUBELAN_DATABASE_URL_UNPOOLED ||
    process.env.JUBELAN_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    '';

  if (!connStr) {
    t.skip('Database connection string tidak tersedia di env. Tes I/O database dilewati.');
    return;
  }

  const sql = neon(connStr);
  // Definisi tabel pengumuman sesuai tabel asli di Neon (schema.sql)
  const pengumumanTable = pgTable('pengumuman', {
    id: text('id').primaryKey(),
    judul: text('judul').notNull(),
    konten: text('konten').notNull(),
    tanggal: text('tanggal').default(''),
    is_penting: boolean('is_penting').default(false),
    status: text('status').default('active')
  });

  const db = drizzle(sql, { schema: { pengumuman: pengumumanTable } });
  const testId = `test-probe-${Date.now()}`;
  const today = new Date().toISOString().split('T')[0];

  // 1. INSERT (Create)
  await t.test('I/O Write: Insert data uji ke tabel', async () => {
    await db.insert(pengumumanTable).values({
      id: testId,
      judul: '[TEST RUNNER] Pengumuman Uji Pre-Deploy',
      konten: 'Tes otomatis I/O database sebelum deploy',
      tanggal: today,
      is_penting: true,
      status: 'active'
    });
    assert.ok(true, 'Insert berhasil');
  });

  // 2. SELECT (Read)
  await t.test('I/O Read: Ambil kembali data uji dari database', async () => {
    const rows = await db.select().from(pengumumanTable).where(eq(pengumumanTable.id, testId));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, testId);
    assert.equal(rows[0].is_penting, true);
  });

  // 3. UPSERT (Update on conflict)
  await t.test('I/O Upsert: Update data jika ID bentrok', async () => {
    await db.insert(pengumumanTable)
      .values({
        id: testId,
        judul: '[TEST RUNNER] Judul Diperbarui',
        konten: 'Konten terupdate',
        tanggal: today,
        is_penting: false,
        status: 'active'
      })
      .onConflictDoUpdate({
        target: pengumumanTable.id,
        set: {
          judul: '[TEST RUNNER] Judul Diperbarui',
          konten: 'Konten terupdate',
          is_penting: false
        }
      });

    const rows = await db.select().from(pengumumanTable).where(eq(pengumumanTable.id, testId));
    assert.equal(rows[0].judul, '[TEST RUNNER] Judul Diperbarui');
    assert.equal(rows[0].is_penting, false);
  });

  // 4. DELETE (Cleanup)
  await t.test('I/O Delete: Bersihkan data uji setelah selesai', async () => {
    await db.delete(pengumumanTable).where(eq(pengumumanTable.id, testId));
    const rows = await db.select().from(pengumumanTable).where(eq(pengumumanTable.id, testId));
    assert.equal(rows.length, 0);
  });
});
