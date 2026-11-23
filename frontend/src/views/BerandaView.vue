<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "../components/Ikon.vue";
import HonestCard from "../components/HonestCard.vue";
import KartuBarang from "../components/KartuBarang.vue";
import JudulBagian from "../components/JudulBagian.vue";
import TepiSobek from "../components/TepiSobek.vue";
import VisualBarang from "../components/VisualBarang.vue";
import { ambil } from "../lib/api.js";
import { num } from "../lib/format.js";
import { svgIlustrasi } from "../lib/ilustrasi.js";
import { useKategori } from "../composables/useKategori.js";

const { data: kategori } = useKategori();

const terbaru = ref([]);
const gratis = ref([]);
const platform = ref(null);
const slide = ref(0);
const tabAktif = ref("");
const contoh = ref({}); // kode kategori -> detail barang (kartu contoh)
const memuatContoh = ref(false);

onMounted(async () => {
  const [a, b, c] = await Promise.allSettled([
    ambil("/barang", { jenis: "jual", limit: 4, urut: "baru" }),
    ambil("/barang", { jenis: "gratis", limit: 3, urut: "baru" }),
    ambil("/dashboard/platform"),
  ]);
  terbaru.value = a.value || [];
  gratis.value = b.value || [];
  platform.value = c.value || null;
  // Kartu contoh pertama: dari barang terbaru bila ada.
  const awal = terbaru.value[0] || gratis.value[0];
  if (awal) await pilihTab(awal.kategori);
});

async function pilihTab(kode) {
  tabAktif.value = kode;
  if (contoh.value[kode]) return;
  memuatContoh.value = true;
  try {
    const daftar = await ambil("/barang", { kategori: kode, limit: 1, urut: "baru" });
    if (daftar[0]) contoh.value = { ...contoh.value, [kode]: await ambil(`/barang/${daftar[0].id}`) };
  } catch {
    /* kartu contoh bersifat tambahan */
  } finally {
    memuatContoh.value = false;
  }
}
const kartuContoh = computed(() => contoh.value[tabAktif.value] || null);

const ilu = (b) => svgIlustrasi({ id: b.id, jenis: b.jenis, kategori: b.kategori, label: b.jenisNama }, true);

// Tiga slide hero; slide ber-data hanya ditampilkan bila datanya ada.
const slides = computed(() => {
  const daftar = [];
  daftar.push({ judul: ["Barang Lama,", "Cerita Baru"], teks: "Temukan fashion, elektronik, dan barang rumah tangga preloved dengan kondisi yang ditulis apa adanya.", cta: { label: "Jelajahi Barang", to: "/jelajah", ikon: "tag" }, jenis: "produk", item: terbaru.value.slice(0, 3) });
  daftar.push({ judul: ["Kondisi Jelas,", "Tanpa Tebak"], teks: "Setiap barang punya Honest Condition Card: atribut kondisi, bagian yang bercacat, dan skor kesesuaian penjual.", cta: { label: "Lihat Contoh Kartu", to: terbaru.value[0] ? `/barang/${terbaru.value[0].id}` : "/jelajah", ikon: "shield" }, jenis: "kartu", item: kartuContoh.value ? [kartuContoh.value] : [] });
  daftar.push({ judul: ["Beri Lagi,", "Berbagi Lagi"], teks: "Punya barang yang masih layak? Berikan gratis lewat Give It Forward dan pilih sendiri penerimanya.", cta: { label: "Lihat Barang Gratis", to: "/gratis", ikon: "gift" }, jenis: "produk", item: gratis.value.slice(0, 3) });
  return daftar;
});
const s = computed(() => slides.value[slide.value]);
const JEDA_SLIDE = 4000;
const hero = ref(null);
const sedangBerputar = ref(false);
const siklusPutaran = ref(0);
let timer;
let preferensiGerak;

function aturPutaran() {
  clearTimeout(timer);
  sedangBerputar.value = !document.hidden &&
    !preferensiGerak?.matches &&
    !hero.value?.querySelector(":focus-visible");

  if (sedangBerputar.value) {
    siklusPutaran.value++;
    timer = setTimeout(() => geser(1), JEDA_SLIDE);
  }
}

function aturPutaranSetelahFokus(event) {
  if (!hero.value.contains(event.relatedTarget)) queueMicrotask(() => {
    if (hero.value) aturPutaran();
  });
}

function pilihSlide(indeks) {
  slide.value = indeks;
  aturPutaran();
}

function geser(arah) {
  pilihSlide((slide.value + arah + slides.value.length) % slides.value.length);
}

onMounted(() => {
  preferensiGerak = window.matchMedia("(prefers-reduced-motion: reduce)");
  preferensiGerak.addEventListener("change", aturPutaran);
  document.addEventListener("visibilitychange", aturPutaran);
  aturPutaran();
});

onUnmounted(() => {
  clearTimeout(timer);
  preferensiGerak?.removeEventListener("change", aturPutaran);
  document.removeEventListener("visibilitychange", aturPutaran);
});
</script>

<template>
  <section
    ref="hero"
    class="hero2"
    aria-roledescription="carousel"
    aria-label="Sorotan LAGI."
    @focusin="aturPutaran"
    @focusout="aturPutaranSetelahFokus"
  >
    <svg class="hero-leaf" viewBox="0 0 120 120" aria-hidden="true">
      <path d="M60 8c30 14 44 40 30 72-8 18-22 28-30 32-8-4-22-14-30-32C16 48 30 22 60 8Z" fill="#b8651f" />
      <path d="M60 22v88M60 48l-18-12M60 66l22-14M60 84l-20-12" stroke="#7d3f0f" stroke-width="2" fill="none" opacity=".7" />
    </svg>
    <button class="hero-arrow l" type="button" aria-label="Slide sebelumnya" @click="geser(-1)"><Ikon nama="back" /></button>
    <button class="hero-arrow r" type="button" aria-label="Slide berikutnya" @click="geser(1)"><Ikon nama="arrow" /></button>
    <div class="container">
      <div class="hero-stage" :aria-live="sedangBerputar ? 'off' : 'polite'">
        <div :key="`copy-${slide}`" class="hero-copy hero-slide-content">
          <h1>{{ s.judul[0] }}<br />{{ s.judul[1] }}</h1>
          <p>{{ s.teks }}</p>
          <RouterLink class="btn-lead" :to="s.cta.to"><span class="ic-c"><Ikon :nama="s.cta.ikon" /></span>{{ s.cta.label }}</RouterLink>
        </div>
        <div :key="`art-${slide}`" class="hero-art2 hero-slide-content">
          <div v-if="s.jenis === 'kartu' && s.item[0]" class="hero-tag2">
            <HonestCard :barang="s.item[0]" ringkas>
              <template #visual><VisualBarang :barang="s.item[0]" /></template>
            </HonestCard>
          </div>
          <template v-else>
            <div v-for="(b, n) in s.item" :key="b.id" class="art-item" :class="`a${n + 1}`" v-html="ilu(b)"></div>
          </template>
        </div>
        <div class="hero-count" role="group" aria-label="Pilih slide">
          <template v-for="(_, n) in slides" :key="n">
            <button
              type="button"
              :class="{ on: n === slide }"
              :aria-label="`Slide ${n + 1}`"
              :aria-current="n === slide ? 'true' : undefined"
              @click="pilihSlide(n)"
            >0{{ n + 1 }}</button>
            <i v-if="n < slides.length - 1" aria-hidden="true">/</i>
          </template>
          <div class="hero-progress" aria-hidden="true">
            <span
              v-if="sedangBerputar"
              :key="siklusPutaran"
              :style="{ animationDuration: JEDA_SLIDE + 'ms' }"
            ></span>
          </div>
        </div>
      </div>
    </div>
    <TepiSobek :seed="3" />
  </section>

  <div class="container" style="margin-top: -8px">
    <div class="value-bar">
      <div><Ikon nama="bag" /><span><b>Harga lebih terjangkau</b><small>Hemat dari harga barang baru.</small></span></div>
      <div><Ikon nama="store" /><span><b>Barang lama jadi pemasukan</b><small>Jual yang tidak terpakai.</small></span></div>
      <div><Ikon nama="loop" /><span><b>Dipakai lagi, bukan dibuang</b><small>Kurangi limbah dan emisi.</small></span></div>
    </div>
  </div>

  <section class="section container">
    <JudulBagian sub="Cara kerja" judul="Tiga langkah sampai " deskripsi="Dari mengisi kartu kondisi sampai dampaknya tercatat.">
      <template #hl><span class="hl">pindah tangan</span></template>
    </JudulBagian>
    <div class="steps">
      <div class="step"><h3>Penjual mengisi kartu kondisi</h3><p>Pilih kategori, lalu isi atribut yang relevan: ukuran dan noda untuk pakaian, kesehatan baterai untuk elektronik. Cacat wajib ditulis.</p></div>
      <div class="step"><h3>Pembeli membaca, lalu memesan</h3><p>Pembeli membandingkan kartu antar barang, memilih serah terima, dan memesan. Penjual menerima atau menolak.</p></div>
      <div class="step"><h3>Barang pindah, dampak tercatat</h3><p>Pembeli menyatakan apakah barang sesuai kartu. Jawabannya membentuk skor kesesuaian penjual dan masuk ke Impact Dashboard.</p></div>
    </div>
  </section>

  <section class="section container">
    <div class="split wm">
      <div>
        <p class="eyebrow">Honest Condition Card</p>
        <h2 style="margin-top: 6px">Kondisi ditulis sesuai <span class="hl">jenis barangnya</span></h2>
        <svg class="leafd left" viewBox="0 0 70 20" aria-hidden="true"><path d="M0 14h26M44 14h26" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="M35 15c-7-2-7-10 0-13 7 3 7 11 0 13Z" fill="currentColor" /></svg>
        <p class="muted" style="margin-top: 6px">Atribut berubah menurut kategori. Titik di sisi kanan menandai apakah bagian itu baik, ada catatan, atau cacat berarti.</p>
        <ul class="checks">
          <li><Ikon nama="check" /><span>Grade yang dipilih tidak boleh lebih tinggi dari hasil isian kondisi.</span></li>
          <li><Ikon nama="check" /><span>Bagian yang bercacat harus ditulis, dengan foto bila ada.</span></li>
          <li><Ikon nama="check" /><span>Skor kesesuaian penjual dihitung dari konfirmasi pembeli.</span></li>
        </ul>
      </div>
      <div>
        <div class="tabs" role="group" aria-label="Contoh kartu per kategori">
          <button v-for="k in kategori?.kategori || []" :key="k.kode" type="button" class="chip" :aria-pressed="tabAktif === k.kode" @click="pilihTab(k.kode)">{{ k.label }}</button>
        </div>
        <HonestCard v-if="kartuContoh" :barang="kartuContoh" />
        <p v-else-if="!memuatContoh" class="note-small">Belum ada barang di kategori ini untuk dijadikan contoh kartu.</p>
      </div>
    </div>
  </section>

  <section v-if="terbaru.length" class="section container">
    <JudulBagian sub="Baru masuk" judul="Barang " deskripsi="Preloved pilihan dari penjual terverifikasi.">
      <template #hl><span class="hl">terbaru</span></template>
    </JudulBagian>
    <div class="catalog"><KartuBarang v-for="b in terbaru" :key="b.id" :barang="b" /></div>
    <p style="text-align: center; margin-top: 28px"><RouterLink class="btn-lead out" to="/jelajah"><span class="ic-c"><Ikon nama="arrow" /></span>Lihat semua barang</RouterLink></p>
  </section>

  <section class="section container">
    <div class="band">
      <div>
        <p class="eyebrow">Give It Forward</p>
        <h2 style="margin-top: 6px">Tidak dipakai lagi? Beri ke yang butuh.</h2>
        <p>Berikan barang secara gratis. Calon penerima mengajukan permintaan dengan alasan singkat, lalu Anda memilih siapa yang menerima.</p>
        <RouterLink class="btn-lead" to="/gratis"><span class="ic-c"><Ikon nama="gift" /></span>Lihat barang gratis</RouterLink>
      </div>
      <div class="catalog"><KartuBarang v-for="b in gratis" :key="b.id" :barang="b" /></div>
    </div>
  </section>

  <section v-if="platform" class="section container">
    <JudulBagian sub="Impact Dashboard" judul="Yang sudah dipakai " deskripsi="Angka seluruh platform dari pesanan yang sudah selesai.">
      <template #hl><span class="hl">lagi</span> lewat LAGI.</template>
    </JudulBagian>
    <div class="impact-strip">
      <div><b>{{ num(platform.ringkas.barangBerpindah) }}</b><small>barang berpindah tangan</small></div>
      <div><b>{{ num(platform.ringkas.digratiskan) }}</b><small>diberikan gratis</small></div>
      <div><b>{{ num(platform.dampak.beratKg, 1) }} kg</b><small>berat barang dipakai ulang (estimasi)</small></div>
      <div><b>{{ num(platform.dampak.emisiKgCo2e / 1000, 1) }} ton</b><small>CO₂e (simulasi)</small></div>
    </div>
    <p style="text-align: center; margin-top: 28px"><RouterLink class="btn-lead out" to="/dampak"><span class="ic-c"><Ikon nama="chart" /></span>Buka dashboard</RouterLink></p>
  </section>
</template>
