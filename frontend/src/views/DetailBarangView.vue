<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import Ikon from "../components/Ikon.vue";
import BadgeGrade from "../components/BadgeGrade.vue";
import HonestCard from "../components/HonestCard.vue";
import StatusMuat from "../components/StatusMuat.vue";
import VisualBarang from "../components/VisualBarang.vue";
import { ambil, kirim } from "../lib/api.js";
import { inisial, num, persenHemat, rp } from "../lib/format.js";
import { adalahPembeli, sesi } from "../lib/session.js";
import { useMuat } from "../composables/useMuat.js";

const props = defineProps({ id: { type: String, required: true } });
const router = useRouter();

const b = ref(null);
const metode = ref("ketemuan");
const alasan = ref("");
const galatAksi = ref("");
const mengirim = ref(false);

const { memuat, galat, jalankan } = useMuat(async () => {
  b.value = await ambil(`/barang/${props.id}`);
});
watch(() => [props.id, sesi.pengguna?.id], jalankan, { immediate: true });

const gratis = computed(() => b.value?.jenisTransaksi === "gratis");
const labelStatus = computed(() => {
  const s = b.value?.status;
  if (s === "dipesan") return "Barang ini sedang dipesan. Jika pesanan dibatalkan, barang akan tersedia lagi.";
  if (s === "draf") return "Ini draf. Barang belum tampil di katalog.";
  if (s === "terjual" || s === "diberikan") return "Barang ini sudah berpindah tangan.";
  return "";
});

async function pesan() {
  mengirim.value = true;
  galatAksi.value = "";
  try {
    const p = await kirim("/pesanan", { barangId: b.value.id, metodeSerah: metode.value });
    router.push(`/pesanan/${p.id}`);
  } catch (e) {
    galatAksi.value = e.message;
  } finally {
    mengirim.value = false;
  }
}

async function ajukan() {
  mengirim.value = true;
  galatAksi.value = "";
  try {
    await kirim(`/barang/${b.value.id}/permintaan`, { alasan: alasan.value });
    alasan.value = "";
    b.value = await ambil(`/barang/${props.id}`);
  } catch (e) {
    galatAksi.value = e.message;
  } finally {
    mengirim.value = false;
  }
}
</script>

<template>
  <div class="container">
    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <template v-if="b">
        <nav class="crumbs" aria-label="Jejak halaman">
          <RouterLink to="/jelajah">Jelajah</RouterLink><span aria-hidden="true">/</span>
          <span>{{ b.jenisNama }}</span><span aria-hidden="true">/</span>
          <span aria-current="page">{{ b.nama }}</span>
        </nav>

        <div class="detail">
          <div style="display: grid; gap: 16px; min-width: 0">
            <div class="gallery"><VisualBarang :barang="b" /></div>
            <p v-if="!b.adaFoto" class="note-small">Gambar ini ilustrasi, bukan foto barang. Penjual dapat mengunggah foto saat menerbitkan.</p>
            <div v-if="b.deskripsi" class="panel"><h3>Tentang barang ini</h3><p>{{ b.deskripsi }}</p></div>
          </div>

          <div class="detail-side">
            <div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px">
                <BadgeGrade :grade="b.grade" />
                <span v-if="gratis" class="pill tag">Give It Forward</span>
                <span class="pill">{{ b.jenisNama }}</span>
              </div>
              <h1 style="font-size: clamp(1.8rem, 3.4vw, 2.5rem)">{{ b.nama }}</h1>
              <div class="price-big" style="margin-top: 14px">
                <b v-if="gratis" style="color: var(--brand)">Gratis</b>
                <b v-else>{{ rp(b.hargaJual) }}</b>
                <s class="muted">{{ rp(b.hargaBaru) }}<span class="sr-only"> harga barang baru</span></s>
                <span v-if="!gratis" class="pill good">Hemat {{ persenHemat(b.hargaJual, b.hargaBaru) }}%</span>
              </div>
            </div>

            <div class="panel">
              <div class="seller">
                <span class="av" aria-hidden="true">{{ inisial(b.toko.namaToko) }}</span>
                <div style="min-width: 0">
                  <b>{{ b.toko.namaToko }}</b>
                  <small><Ikon nama="pin" /> {{ b.toko.kota }} · {{ b.toko.skor ? `${b.toko.skor.persen}% sesuai kartu` : "belum ada konfirmasi" }}</small>
                </div>
                <span v-if="b.toko.statusVerifikasi === 'terverifikasi'" class="pill good" style="margin-left: auto"><Ikon nama="shield" />Terverifikasi</span>
              </div>
            </div>

            <HonestCard :barang="b" />

            <div class="panel">
              <h3>Dampak jika barang ini dipakai lagi</h3>
              <div class="impact-mini">
                <div><b>{{ num(b.dampak.beratKg, 1) }} kg</b><small>limbah dihindari</small></div>
                <div><b>{{ num(b.dampak.emisiKgCo2e, 1) }} kg</b><small>CO₂e dihindari</small></div>
                <div><b>{{ rp(b.dampak.hemat) }}</b><small>{{ gratis ? "nilai yang diselamatkan" : "hemat untuk pembeli" }}</small></div>
              </div>
              <p class="note-small">Estimasi dari faktor contoh per jenis barang. Lihat asumsinya di Impact Dashboard.</p>
            </div>

            <div class="panel">
              <h3>{{ gratis ? "Minta barang ini" : "Pesan barang ini" }}</h3>

              <div v-if="b.saya.milikSaya" style="display: grid; gap: 10px">
                <RouterLink class="btn btn-2 btn-wide" :to="`/toko/barang/${b.id}/ubah`"><Ikon nama="edit" />Ubah barang</RouterLink>
                <RouterLink class="btn btn-quiet btn-wide" to="/toko/barang">Kelola di Barang saya</RouterLink>
              </div>
              <div v-else-if="b.status !== 'aktif'" style="display: grid; gap: 10px">
                <div class="notice"><Ikon nama="info" /><span>{{ labelStatus }}</span></div>
                <RouterLink v-if="b.saya.pesananId" class="btn btn-2 btn-wide" :to="`/pesanan/${b.saya.pesananId}`">Lihat pesanan Anda</RouterLink>
              </div>
              <template v-else-if="!sesi.pengguna">
                <div class="notice"><Ikon nama="info" /><span>Masuk sebagai pembeli untuk {{ gratis ? "mengajukan permintaan" : "memesan" }}. Anda tetap bisa membaca kartu kondisinya.</span></div>
                <RouterLink class="btn btn-wide" :to="{ name: 'masuk', query: { next: `/barang/${b.id}` } }" style="margin-top: 12px">Masuk untuk melanjutkan<Ikon nama="arrow" /></RouterLink>
              </template>
              <div v-else-if="!adalahPembeli()" class="notice"><Ikon nama="info" /><span>Akun penjual tidak dapat memesan. Masuk dengan akun pembeli untuk membeli atau meminta barang.</span></div>

              <form v-else-if="!gratis" novalidate @submit.prevent="pesan">
                <fieldset>
                  <legend>Cara serah terima</legend>
                  <div style="display: grid; gap: 10px; margin-top: 10px">
                    <label class="opt"><input v-model="metode" type="radio" name="metode" value="ketemuan" /><span><b>Ketemuan (COD)</b><small>Bertemu di {{ b.toko.kota }}, bayar saat barang diterima.</small></span></label>
                    <label class="opt"><input v-model="metode" type="radio" name="metode" value="kurir" /><span><b>Kurir</b><small>Ongkir ditanggung pembeli dan dikonfirmasi lewat penjual.</small></span></label>
                  </div>
                </fieldset>
                <p class="note-small" style="margin: 12px 0">Pembayaran bersifat simulasi dan dicatat lunas saat Anda menyatakan barang diterima.</p>
                <p v-if="galatAksi" role="alert" style="color: var(--bad); font-weight: 600; margin-bottom: 10px">{{ galatAksi }}</p>
                <button class="btn btn-wide" type="submit" :disabled="mengirim">Buat pesanan <Ikon nama="arrow" /></button>
              </form>

              <div v-else-if="b.saya.pesananId" class="notice good"><Ikon nama="check" /><span>Anda terpilih sebagai penerima. <RouterLink :to="`/pesanan/${b.saya.pesananId}`">Buka pesanan</RouterLink>.</span></div>
              <div v-else-if="b.saya.permintaanId" class="notice good"><Ikon nama="check" /><span>Permintaan Anda sudah dikirim. Pemberi akan memilih penerima. Pantau di <RouterLink to="/permintaan-saya">Permintaan saya</RouterLink>.</span></div>
              <form v-else novalidate @submit.prevent="ajukan">
                <div class="field">
                  <label for="alasan">Mengapa Anda membutuhkannya?</label>
                  <textarea id="alasan" v-model="alasan" name="alasan" maxlength="300" placeholder="Ceritakan singkat kebutuhan Anda (minimal 10 karakter)" aria-describedby="alasan-h"></textarea>
                  <span id="alasan-h" class="hint">Pemberi membaca alasan ini sebelum memilih.</span>
                  <span v-if="galatAksi" class="err" role="alert">{{ galatAksi }}</span>
                </div>
                <button class="btn btn-tag btn-wide" type="submit" style="margin-top: 14px" :disabled="mengirim"><Ikon nama="gift" />Ajukan permintaan</button>
              </form>
            </div>
          </div>
        </div>
      </template>
    </StatusMuat>
  </div>
</template>
