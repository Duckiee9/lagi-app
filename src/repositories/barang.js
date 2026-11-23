import { pool } from '../db/pool.js';

const num = (v) => (v === null || v === undefined ? null : Number(v));

const DASAR = `
  FROM barang b
  JOIN jenis_barang jb ON jb.id = b.jenis_barang_id
  JOIN toko t ON t.id = b.toko_id`;

const KOLOM_RINGKAS = `
  b.id, b.nama, jb.kategori, jb.kode AS jenis, jb.nama AS jenis_nama, b.jenis_transaksi,
  b.harga_jual, b.harga_baru, b.grade, b.status, t.id AS toko_id, t.nama_toko, t.kota,
  (b.foto IS NOT NULL) AS ada_foto, b.dibuat_pada`;

export const ringkas = (r) => ({
  id: r.id, nama: r.nama, kategori: r.kategori, jenis: r.jenis, jenisNama: r.jenis_nama,
  jenisTransaksi: r.jenis_transaksi, hargaJual: num(r.harga_jual), hargaBaru: num(r.harga_baru),
  grade: r.grade, status: r.status, tokoId: r.toko_id, namaToko: r.nama_toko, kota: r.kota,
  adaFoto: r.ada_foto, dibuatPada: r.dibuat_pada,
});

const URUTAN = {
  baru: 'b.dibuat_pada DESC, b.id DESC',
  murah: 'b.harga_jual ASC, b.id DESC',
  mahal: 'b.harga_jual DESC, b.id DESC',
  hemat: '(b.harga_baru - b.harga_jual) DESC, b.id DESC',
};

export async function katalog({ q, kategori, grade, jenis, urut }, { limit, offset }) {
  const w = ["b.status IN ('aktif', 'dipesan')"];
  const p = [];
  const tambah = (sql, v) => { p.push(v); w.push(sql.replace('?', `$${p.length}`)); };
  if (q) {
    p.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    w.push(`(b.nama ILIKE $${p.length} ESCAPE '\\' OR t.nama_toko ILIKE $${p.length} ESCAPE '\\')`);
  }
  if (kategori) tambah('jb.kategori = ?', kategori);
  if (grade) tambah('b.grade = ?', grade);
  if (jenis) tambah('b.jenis_transaksi = ?', jenis);
  const where = `WHERE ${w.join(' AND ')}`;
  const total = (await pool.query(`SELECT COUNT(*)::int AS n ${DASAR} ${where}`, p)).rows[0].n;
  const { rows } = await pool.query(
    `SELECT ${KOLOM_RINGKAS} ${DASAR} ${where} ORDER BY ${URUTAN[urut] || URUTAN.baru} LIMIT ${limit} OFFSET ${offset}`,
    p,
  );
  return { jumlah: total, baris: rows.map(ringkas) };
}

export async function milikToko(tokoId, status) {
  const p = [tokoId];
  let where = 'WHERE b.toko_id = $1';
  if (status) { p.push(status); where += ' AND b.status = $2'; }
  const { rows } = await pool.query(
    `SELECT ${KOLOM_RINGKAS},
            (SELECT COUNT(*)::int FROM permintaan_gratis pg WHERE pg.barang_id = b.id AND pg.status = 'menunggu') AS jumlah_permintaan
       ${DASAR} ${where} ORDER BY b.dibuat_pada DESC, b.id DESC`,
    p,
  );
  return rows.map((r) => ({ ...ringkas(r), jumlahPermintaan: r.jumlah_permintaan }));
}

export async function detail(id, db = pool, kunci = false) {
  const { rows } = await db.query(
    `SELECT ${KOLOM_RINGKAS}, b.deskripsi, b.catatan, b.kondisi, b.jenis_barang_id,
            jb.berat_kg, jb.emisi_kg_co2e, t.pengguna_id AS pemilik_id, t.status_verifikasi
       ${DASAR} WHERE b.id = $1 ${kunci ? 'FOR UPDATE OF b' : ''}`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    ...ringkas(r), deskripsi: r.deskripsi, catatan: r.catatan, kondisi: r.kondisi,
    jenisBarangId: r.jenis_barang_id, pemilikId: r.pemilik_id, statusVerifikasi: r.status_verifikasi,
    beratKg: num(r.berat_kg), emisiKgCo2e: num(r.emisi_kg_co2e),
  };
}

export async function cacatDari(barangId, db = pool) {
  const { rows } = await db.query(
    'SELECT id, label, (foto IS NOT NULL) AS ada_foto FROM cacat_barang WHERE barang_id = $1 ORDER BY urutan, id',
    [barangId],
  );
  return rows.map((r) => ({ id: r.id, label: r.label, adaFoto: r.ada_foto }));
}

export async function jenisByKode(kode, db = pool) {
  const { rows } = await db.query('SELECT id, kategori, kode, nama FROM jenis_barang WHERE kode = $1', [kode]);
  return rows[0] || null;
}

export async function semuaJenis() {
  const { rows } = await pool.query('SELECT kategori, kode, nama, berat_kg, emisi_kg_co2e FROM jenis_barang ORDER BY id');
  return rows.map((r) => ({ kategori: r.kategori, kode: r.kode, nama: r.nama, beratKg: num(r.berat_kg), emisiKgCo2e: num(r.emisi_kg_co2e) }));
}

export async function fotoUtama(id) {
  const { rows } = await pool.query(
    `SELECT b.foto, b.foto_mime, b.status, t.pengguna_id FROM barang b JOIN toko t ON t.id = b.toko_id WHERE b.id = $1`,
    [id],
  );
  return rows[0] || null;
}

export async function fotoCacat(barangId, cacatId) {
  const { rows } = await pool.query(
    `SELECT c.foto, c.foto_mime, b.status, t.pengguna_id
       FROM cacat_barang c JOIN barang b ON b.id = c.barang_id JOIN toko t ON t.id = b.toko_id
      WHERE c.id = $1 AND c.barang_id = $2`,
    [cacatId, barangId],
  );
  return rows[0] || null;
}

export async function sisipkan(db, d) {
  const { rows } = await db.query(
    `INSERT INTO barang (toko_id, jenis_barang_id, nama, deskripsi, jenis_transaksi, harga_jual, harga_baru,
                         grade, kondisi, catatan, status, foto_mime, foto)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13) RETURNING id`,
    [d.tokoId, d.jenisBarangId, d.nama, d.deskripsi, d.jenisTransaksi, d.hargaJual, d.hargaBaru,
     d.grade, JSON.stringify(d.kondisi), d.catatan, d.status, d.foto?.mime ?? null, d.foto?.data ?? null],
  );
  return rows[0].id;
}

// fotoMode: 'tetap' | 'hapus' | 'ganti'
export async function perbarui(db, id, d, fotoMode) {
  const p = [id, d.jenisBarangId, d.nama, d.deskripsi, d.jenisTransaksi, d.hargaJual, d.hargaBaru,
             d.grade, JSON.stringify(d.kondisi), d.catatan, d.status];
  let fotoSql = '';
  if (fotoMode === 'hapus') fotoSql = ', foto = NULL, foto_mime = NULL';
  if (fotoMode === 'ganti') { p.push(d.foto.mime, d.foto.data); fotoSql = ', foto_mime = $12, foto = $13'; }
  await db.query(
    `UPDATE barang SET jenis_barang_id=$2, nama=$3, deskripsi=$4, jenis_transaksi=$5, harga_jual=$6, harga_baru=$7,
            grade=$8, kondisi=$9::jsonb, catatan=$10, status=$11, diubah_pada=CURRENT_TIMESTAMP ${fotoSql}
      WHERE id=$1`,
    p,
  );
}

export const ubahStatus = (db, id, status) =>
  db.query('UPDATE barang SET status = $2, diubah_pada = CURRENT_TIMESTAMP WHERE id = $1', [id, status]);

export const hapus = (db, id) => db.query('DELETE FROM barang WHERE id = $1', [id]);

export const punyaPesanan = async (db, id) =>
  (await db.query('SELECT 1 FROM pesanan WHERE barang_id = $1 LIMIT 1', [id])).rowCount > 0;

export async function cacatLama(db, barangId) {
  const { rows } = await db.query('SELECT id FROM cacat_barang WHERE barang_id = $1', [barangId]);
  return rows.map((r) => r.id);
}

export const sisipkanCacat = (db, barangId, urutan, label, foto) =>
  db.query(
    'INSERT INTO cacat_barang (barang_id, urutan, label, foto_mime, foto) VALUES ($1,$2,$3,$4,$5)',
    [barangId, urutan, label, foto?.mime ?? null, foto?.data ?? null],
  );

export const perbaruiCacat = (db, id, barangId, urutan, label, foto) =>
  foto
    ? db.query('UPDATE cacat_barang SET urutan=$3, label=$4, foto_mime=$5, foto=$6 WHERE id=$1 AND barang_id=$2', [id, barangId, urutan, label, foto.mime, foto.data])
    : db.query('UPDATE cacat_barang SET urutan=$3, label=$4 WHERE id=$1 AND barang_id=$2', [id, barangId, urutan, label]);

export const hapusCacat = (db, barangId, ids) =>
  ids.length ? db.query('DELETE FROM cacat_barang WHERE barang_id = $1 AND id = ANY($2::bigint[])', [barangId, ids]) : null;

export async function skorToko(tokoId, db = pool) {
  const { rows } = await db.query('SELECT persen, jumlah FROM v_skor_kesesuaian WHERE toko_id = $1', [tokoId]);
  return rows[0] ? { persen: rows[0].persen, jumlah: rows[0].jumlah } : null;
}

export async function infoToko(tokoId, db = pool) {
  const { rows } = await db.query('SELECT id, nama_toko, kota, status_verifikasi FROM toko WHERE id = $1', [tokoId]);
  const r = rows[0];
  return r ? { id: r.id, namaToko: r.nama_toko, kota: r.kota, statusVerifikasi: r.status_verifikasi } : null;
}
