<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "./Ikon.vue";
import { num, rp0 } from "../lib/format.js";
import { adalahPenjual } from "../lib/session.js";
import { useKategori } from "../composables/useKategori.js";

// data: respons GET /dashboard atau /dashboard/platform.
const props = defineProps({ data: { type: Object, required: true } });
const { data: kat } = useKategori();

const platform = computed(() => props.data.cakupan === "platform");
const penjual = computed(() => !platform.value && adalahPenjual());
const r = computed(() => props.data.ringkas);

const kartu = computed(() => {
  if (platform.value) {
    return [
      { n: "Barang berpindah tangan", v: num(r.value.barangBerpindah), h: "Dijual ditambah digratiskan.", hi: true, ik: "loop" },
      { n: "Diberikan gratis", v: num(r.value.digratiskan), h: "Lewat Give It Forward.", ik: "gift" },
      { n: "Berat barang dipakai ulang", v: `${num(props.data.dampak.beratKg, 1)} kg`, h: "Estimasi berdasarkan jenis barang.", ik: "leaf" },
    ];
  }
  if (penjual.value) {
    const s = r.value.skorKesesuaian;
    return [
      { n: "Barang terjual", v: num(r.value.dijual), h: "Penjualan yang sudah selesai.", hi: true, ik: "loop" },
      { n: "Pendapatan diterima", v: rp0(r.value.uang), h: "Dari pesanan selesai.", ik: "bag" },
      { n: "Diberikan gratis", v: num(r.value.digratiskan), h: "Barang Give It Forward.", ik: "gift" },
      { n: "Skor kesesuaian kartu", v: s ? `${s.persen}%` : "–", h: s ? `Dari ${s.jumlah} konfirmasi pembeli.` : "Belum ada konfirmasi pembeli.", ik: "shield" },
    ];
  }
  return [
    { n: "Barang dipakai lagi", v: num(r.value.barangBerpindah), h: "Pesanan yang sudah selesai.", hi: true, ik: "loop" },
    { n: "Total hemat", v: rp0(r.value.hemat), h: "Harga barang baru dikurangi harga bayar.", ik: "bag" },
    { n: "Barang gratis diterima", v: num(r.value.digratiskan), h: "Lewat Give It Forward.", ik: "gift" },
    { n: "Uang dibelanjakan", v: rp0(r.value.uang), h: "Total pesanan selesai.", ik: "tag" },
  ];
});

// Rincian dijual dan digratiskan hanya ditampilkan untuk penjual.
const grafik = computed(() => {
  const data = props.data.perBulan.map((b) => ({ ...b, total: b.total ?? b.dijual + b.digratiskan }));
  const W = 560, H = 250, ml = 40, mr = 12, mt = 14, mb = 32;
  const iw = W - ml - mr, ih = H - mt - mb;
  const maks = Math.max(1, ...data.map((d) => d.total));
  let langkah = Math.pow(10, Math.floor(Math.log10(maks)));
  if (maks / langkah < 2) langkah /= 5;
  else if (maks / langkah < 5) langkah /= 2;
  if (langkah < 1) langkah = 1;
  const atas = Math.ceil(maks / langkah) * langkah;
  const y = (v) => mt + ih - (v / atas) * ih;
  const garis = [];
  for (let v = 0; v <= atas; v += langkah) garis.push({ v, y: y(v) });
  const bw = Math.min(44, (iw / data.length) * 0.55);
  const batang = data.map((d, i) => {
    const cx = ml + (iw / data.length) * (i + 0.5);
    const total = d.total;
    const h2 = penjual.value ? (d.digratiskan / atas) * ih : 0;
    const h1 = (total / atas) * ih - h2;
    return { ...d, cx, x: cx - bw / 2, bw, y1: y(0) - h1, h1, y2: y(0) - h1 - h2, h2, total, yTotal: y(total) - 5 };
  });
  return { W, H, ml, mr, garis, batang, dasar: y(0) };
});

const bulanAktif = ref(null);
const rincianBulan = computed(() => grafik.value.batang.find((b) => b.bulan === bulanAktif.value));
const totalEnamBulan = computed(() => grafik.value.batang.reduce((a, b) => a + b.total, 0));
const maksKategori = computed(() => Math.max(1, ...props.data.perKategori.map((k) => k.jumlah)));
const labelKategori = (kode) => kat.value?.kategori.find((k) => k.kode === kode)?.label || kode;
const st = computed(() => props.data.status);
</script>

<template>
  <dl class="metrics" :class="{ 'impact-public-metrics': platform }">
    <div v-for="m in kartu" :key="m.n" class="metric" :class="{ hi: m.hi }">
      <dt><span class="tile"><Ikon :nama="m.ik" /></span>{{ m.n }}</dt>
      <dd><strong>{{ m.v }}</strong><p>{{ m.h }}</p></dd>
    </div>
  </dl>

  <div class="dash-grid" :class="{ 'impact-single': !penjual }">
    <section class="panel" style="align-content: start">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px">
        <h2 style="font-size: 1.2rem">Barang berpindah tangan per bulan</h2>
        <div v-if="penjual" class="legend"><span><i style="background: var(--brand)"></i>Dijual</span><span><i style="background: var(--tag)"></i>Digratiskan</span></div>
      </div>
      <div class="chart-wrap impact-chart">
        <svg :viewBox="`0 0 ${grafik.W} ${grafik.H}`" role="group" aria-label="Diagram batang jumlah barang berpindah tangan per bulan">
          <g class="chart">
            <template v-for="g in grafik.garis" :key="g.v">
              <line class="grid" :x1="grafik.ml" :x2="grafik.W - grafik.mr" :y1="g.y" :y2="g.y" />
              <text :x="grafik.ml - 8" :y="g.y + 4" text-anchor="end">{{ g.v }}</text>
            </template>
            <g
              v-for="(b, i) in grafik.batang"
              :key="b.bulan"
              class="impact-month"
              tabindex="0"
              :aria-label="penjual ? `${b.label}, ${b.dijual} dijual, ${b.digratiskan} digratiskan, total ${b.total}` : `${b.label}, ${b.total} barang`"
              @mouseenter="bulanAktif = b.bulan"
              @mouseleave="bulanAktif = null"
              @focus="bulanAktif = b.bulan"
              @blur="bulanAktif = null"
              @click="bulanAktif = b.bulan"
            >
              <rect class="impact-highlight" :x="b.x - 7" :y="8" :width="b.bw + 14" :height="grafik.dasar - 8" rx="7" />
              <g class="impact-stack" :style="{ transformOrigin: `${b.cx}px ${grafik.dasar}px`, animationDelay: `${i * 55}ms` }">
                <rect class="b1" :x="b.x" :y="b.y1" :width="b.bw" :height="b.h1" rx="4" />
                <rect v-if="b.h2 > 0" class="b2" :x="b.x" :y="b.y2" :width="b.bw" :height="b.h2" rx="4" />
              </g>
              <text :x="b.cx" :y="grafik.H - 10" text-anchor="middle">{{ b.label }}</text>
              <text v-if="b.total" :x="b.cx" :y="b.yTotal" text-anchor="middle" class="impact-total">{{ b.total }}</text>
            </g>
          </g>
        </svg>
      </div>
      <p class="impact-detail">
        <template v-if="rincianBulan"><strong>{{ rincianBulan.label }}</strong> <template v-if="penjual">· {{ rincianBulan.dijual }} dijual · {{ rincianBulan.digratiskan }} digratiskan</template><template v-else>· {{ rincianBulan.total }} barang</template></template>
        <template v-else>Enam bulan terakhir · <strong>{{ totalEnamBulan }} barang</strong></template>
      </p>
    </section>

    <section v-if="penjual" class="panel" style="align-content: start">
      <h2 style="font-size: 1.2rem">Status pesanan</h2>
      <dl class="stat-list" style="margin: 0">
        <div><dt>Menunggu konfirmasi</dt><dd>{{ st.menunggu }}</dd></div>
        <div><dt>Diterima penjual</dt><dd>{{ st.dikonfirmasi }}</dd></div>
        <div><dt>Siap diambil atau dikirim</dt><dd>{{ st.siap }}</dd></div>
        <div><dt>Selesai</dt><dd>{{ st.selesai }}</dd></div>
        <div><dt>Dibatalkan atau ditolak</dt><dd>{{ st.batal }}</dd></div>
      </dl>
      <RouterLink class="btn btn-2 btn-sm" to="/pesanan">Buka pesanan<Ikon nama="arrow" /></RouterLink>
    </section>
  </div>

  <div class="dash-grid">
    <section class="panel" style="align-content: start">
      <h2 style="font-size: 1.2rem">Per kategori</h2>
      <p v-if="!data.perKategori.length" class="note-small">Belum ada pesanan selesai.</p>
      <div v-else class="bars">
        <div v-for="k in data.perKategori" :key="k.kategori" class="bar-row">
          <span>{{ labelKategori(k.kategori) }}</span>
          <div class="tr"><div class="fl impact-category" :style="{ width: `${(k.jumlah / maksKategori) * 100}%` }"></div></div>
          <b>{{ k.jumlah }}</b>
        </div>
      </div>
      <p class="note-small">Jumlah pesanan selesai menurut kategori.</p>
    </section>

    <section class="panel" style="align-content: start">
      <h2 style="font-size: 1.2rem">Dampak lingkungan (estimasi)</h2>
      <dl class="stat-list" style="margin: 0">
        <div><dt>Estimasi berat barang dipakai ulang</dt><dd>{{ num(data.dampak.beratKg, 1) }} kg</dd></div>
        <div><dt>Simulasi CO₂e</dt><dd>{{ num(data.dampak.emisiKgCo2e, 1) }} kg</dd></div>
        <div v-if="!platform"><dt>Nilai barang diselamatkan</dt><dd>{{ rp0(data.dampak.nilaiDiselamatkan) }}</dd></div>
      </dl>
      <p class="note-small">Cakupan: {{ platform ? "seluruh LAGI." : penjual ? "toko Anda" : "akun Anda" }}.</p>
    </section>
  </div>

  <section class="panel" style="margin-top: 16px">
    <h2 style="font-size: 1.2rem">Cara perhitungan dan asumsi</h2>
    <ul class="impact-method">
      <li><strong>Berat barang dipakai ulang (kg)</strong> dihitung dengan menjumlahkan berat asumsi per jenis barang untuk setiap pesanan selesai. Berat di tabel adalah perkiraan per barang, tanpa penimbangan. Barang yang berpindah tangan hanya menjadi indikator potensi penundaan timbulan sampah, karena nasib barang tanpa transaksi tidak diketahui.</li>
      <li><strong>Simulasi CO₂e (kg)</strong> dihitung dengan menjumlahkan faktor contoh per jenis barang untuk setiap pesanan selesai. Model ini belum membandingkan skenario dasar dengan skenario pemanfaatan kembali, termasuk penggantian pembelian baru, pengiriman, perbaikan, dan akhir masa pakai. Angkanya berstatus simulasi internal.</li>
      <li v-if="!platform"><strong>Penghematan pembeli</strong> adalah jumlah selisih harga acuan barang baru dan harga yang dibayar. <strong>Nilai barang diselamatkan</strong> adalah jumlah harga acuan barang baru pada pesanan selesai, termasuk barang gratis.</li>
    </ul>
    <h3 class="impact-subtitle">Rujukan resmi</h3>
    <ul class="impact-method">
      <li><a href="https://peraturan.bpk.go.id/Details/39067/uu-no-18-tahun-2008">UU No. 18 Tahun 2008 tentang Pengelolaan Sampah, Pasal 20</a> memasukkan pemanfaatan kembali sebagai bagian dari pengurangan sampah.</li>
      <li><a href="https://www.epa.gov/waste-reduction-model/basic-information-about-waste-reduction-model">U.S. EPA Waste Reduction Model (WARM)</a> menjelaskan estimasi emisi dengan membandingkan skenario dasar dan alternatif pengelolaan material.</li>
    </ul>
    <h3 class="impact-subtitle">Asumsi internal LAGI per barang</h3>
    <p class="note-small">Angka berikut adalah data contoh LAGI. Rujukan resmi di atas menjelaskan konsep dan metode pembanding.</p>
    <div v-if="kat" class="tbl-wrap">
      <table>
        <thead><tr><th>Kategori</th><th>Jenis</th><th>Berat asumsi (kg)</th><th>Faktor contoh CO₂e (kg)</th></tr></thead>
        <tbody>
          <template v-for="k in kat.kategori" :key="k.kode">
            <tr v-for="j in k.jenis" :key="j.kode"><td>{{ k.label }}</td><td>{{ j.nama }}</td><td>{{ num(j.beratKg, 2) }}</td><td>{{ num(j.emisiKgCo2e, 1) }}</td></tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>


<style scoped>
.impact-single { grid-template-columns: minmax(0, 1fr); }
@media (min-width: 901px) {
  .impact-public-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.impact-chart { background: #faf8f4; border: 1px solid var(--line); border-radius: 14px; padding: 8px 6px 0; }
.impact-highlight { fill: transparent; transition: fill 160ms ease; }
.impact-month:hover .impact-highlight, .impact-month:focus-visible .impact-highlight { fill: #efe5dc; }
.chart .impact-total { fill: var(--ink); font-weight: 700; }
.impact-detail { padding: 8px 12px; background: var(--surface-2); border-radius: 8px; font-size: .85rem; }
.impact-method { display: grid; gap: 8px; margin: 0; padding-inline-start: 22px; }
.impact-method a { color: var(--brand); text-decoration: underline; text-underline-offset: 3px; }
.impact-subtitle { margin-top: 8px; font-size: 1rem; }

@media (prefers-reduced-motion: no-preference) {
  .impact-stack { animation: impact-grow 680ms cubic-bezier(.2, .75, .3, 1) both; }
  .impact-category { animation: impact-category-grow 750ms ease-out both; transform-origin: left; }
}
@keyframes impact-grow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
@keyframes impact-category-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
</style>
