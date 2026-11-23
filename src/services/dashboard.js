import * as repo from '../repositories/dashboard.js';

function bentuk(d, cakupan, peran) {
  const r = d.ring;
  return {
    cakupan,
    ringkas: {
      barangBerpindah: r.berpindah, dijual: r.dijual, digratiskan: r.digratiskan, uang: r.uang,
      hemat: peran === 'penjual' ? null : r.hemat,
      skorKesesuaian: peran === 'pembeli' || r.dinilai === 0 ? null : { persen: Math.round((100 * r.sesuai) / r.dinilai), jumlah: r.dinilai },
    },
    dampak: { beratKg: Math.round(r.berat * 10) / 10, emisiKgCo2e: Math.round(r.emisi * 10) / 10, nilaiDiselamatkan: r.nilai },
    status: d.status,
    perBulan: d.perBulan,
    perKategori: d.perKategori,
  };
}

export const akun = async (user) =>
  bentuk(
    await repo.ambil(user.peran === 'penjual' ? { kolom: 'o.toko_id', nilai: user.tokoId } : { kolom: 'o.pembeli_id', nilai: user.id }),
    'akun', user.peran,
  );

export async function platform() {
  const { ring, perBulan, perKategori } = await repo.ambil({ kolom: null });
  return {
    cakupan: 'platform',
    ringkas: { barangBerpindah: ring.berpindah, digratiskan: ring.digratiskan },
    dampak: { beratKg: Math.round(ring.berat * 10) / 10, emisiKgCo2e: Math.round(ring.emisi * 10) / 10 },
    perBulan: perBulan.map(({ bulan, label, dijual, digratiskan }) => ({ bulan, label, total: dijual + digratiskan })),
    perKategori,
  };
}
