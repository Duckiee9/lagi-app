<script setup>
import { computed, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "../components/Ikon.vue";
import HonestCard from "../components/HonestCard.vue";
import StatusMuat from "../components/StatusMuat.vue";
import VisualBarang from "../components/VisualBarang.vue";
import { ambil, kirim } from "../lib/api.js";
import { KELAS_STATUS, STATUS_PESANAN, rp, waktu } from "../lib/format.js";
import { sesi } from "../lib/session.js";
import { useMuat } from "../composables/useMuat.js";

const props = defineProps({ id: { type: String, required: true } });
const o = ref(null);
const galatAksi = ref("");
const proses = ref(false);
const bukaAlasan = ref(""); // "tolak" | "batal" bila form alasan terbuka
const alasan = ref("");
const selesai = reactive({ kesesuaian: "", catatan: "" });

const { memuat, galat, jalankan } = useMuat(async () => {
  o.value = await ambil(`/pesanan/${props.id}`);
});
watch(() => props.id, jalankan, { immediate: true });

const penjual = computed(() => sesi.pengguna?.peran === "penjual");
const gratis = computed(() => o.value?.harga === 0);
const boleh = (a) => o.value?.bolehAksi.includes(a);
const pad = (n) => String(n).padStart(4, "0");

const URUT = ["menunggu-konfirmasi", "dikonfirmasi", "siap", "selesai"];
const langkah = computed(() => [
  ["menunggu-konfirmasi", gratis.value ? "Penerima dipilih" : "Pesanan dibuat"],
  ["dikonfirmasi", "Diterima penjual"],
  ["siap", "Siap diambil atau dikirim"],
  ["selesai", "Selesai"],
]);
const berhenti = computed(() => ["dibatalkan", "ditolak"].includes(o.value?.status));
const linimasa = computed(() => {
  const riw = o.value.riwayat;
  const capai = Math.max(...riw.map((r) => URUT.indexOf(r.status)));
  const waktuDari = (s) => riw.find((r) => r.status === s)?.waktu;
  const hasil = langkah.value.map(([s, label], i) => {
    const kelas = i < capai || (i === capai && o.value.status === "selesai") ? "done" : i === capai && !berhenti.value ? "now" : i <= capai ? "done" : "";
    const t = waktuDari(s) || (i === 0 && gratis.value ? waktuDari("dikonfirmasi") : "");
    return { label, kelas, waktu: t ? waktu(t) : "Belum" };
  });
  if (berhenti.value) {
    const akhir = riw[riw.length - 1];
    hasil.push({ label: STATUS_PESANAN[o.value.status], kelas: "stop", waktu: waktu(akhir.waktu) });
  }
  return hasil;
});

async function aksi(nama, ekstra = {}) {
  proses.value = true;
  galatAksi.value = "";
  try {
    o.value = await kirim(`/pesanan/${props.id}/aksi`, { aksi: nama, ...ekstra });
    bukaAlasan.value = "";
    alasan.value = "";
  } catch (e) {
    galatAksi.value = e.message;
  } finally {
    proses.value = false;
  }
}
const kirimAlasan = () => aksi(bukaAlasan.value, { alasan: alasan.value });
const kirimSelesai = () => {
  if (!selesai.kesesuaian) {
    galatAksi.value = "Pilih apakah kondisi sesuai kartu.";
    return;
  }
  aksi("selesai", { kesesuaian: selesai.kesesuaian, catatan: selesai.catatan });
};
const bukaForm = (nama) => {
  bukaAlasan.value = bukaAlasan.value === nama ? "" : nama;
  galatAksi.value = "";
};
</script>

<template>
  <div class="container">
    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <template v-if="o">
        <nav class="crumbs" aria-label="Jejak halaman">
          <RouterLink to="/pesanan">Pesanan</RouterLink><span aria-hidden="true">/</span><span aria-current="page">#{{ pad(o.id) }}</span>
        </nav>
        <div class="detail">
          <div style="display: grid; gap: 20px; min-width: 0">
            <div class="panel">
              <div style="display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 16px; align-items: center">
                <div class="thumb-s" style="border-radius: 12px; overflow: hidden; aspect-ratio: 1"><VisualBarang :barang="o.barang" /></div>
                <div style="min-width: 0">
                  <h1 style="font-size: 1.5rem"><RouterLink :to="`/barang/${o.barangId}`" style="color: inherit">{{ o.namaBarang }}</RouterLink></h1>
                  <p class="note-small">{{ o.barang.jenisNama }} · {{ o.barang.grade }}</p>
                  <p class="price-big"><b style="font-size: 1.6rem">{{ rp(o.harga) }}</b></p>
                </div>
              </div>
            </div>
            <HonestCard :barang="o.barang" />
          </div>

          <div class="detail-side">
            <div class="panel">
              <h2 style="font-size: 1.2rem">Status pesanan</h2>
              <span :class="KELAS_STATUS[o.status]" style="margin: 6px 0">{{ STATUS_PESANAN[o.status] }}</span>
              <ol class="timeline" style="margin-top: 6px">
                <li v-for="l in linimasa" :key="l.label" :class="l.kelas">
                  <span class="pt"><Ikon v-if="l.kelas === 'done'" nama="check" /><Ikon v-else-if="l.kelas === 'stop'" nama="x" /></span>
                  <b>{{ l.label }}</b><small>{{ l.waktu }}</small>
                </li>
              </ol>
            </div>

            <div v-if="o.status === 'selesai' && o.kesesuaian" class="notice" :class="o.kesesuaian === 'sesuai' ? 'good' : 'bad'">
              <Ikon :nama="o.kesesuaian === 'sesuai' ? 'check' : 'alert'" />
              <span>{{ o.kesesuaian === "sesuai" ? "Pembeli menyatakan kondisi sesuai kartu." : `Pembeli melaporkan perbedaan: ${o.catatanKesesuaian}` }}</span>
            </div>
            <div v-if="berhenti" class="notice bad">
              <Ikon nama="alert" />
              <span>{{ o.dibatalkanOleh === "penjual" ? "Dibatalkan atau ditolak oleh penjual" : "Dibatalkan oleh pembeli" }}<template v-if="o.alasanPembatalan">: {{ o.alasanPembatalan }}</template></span>
            </div>

            <div v-if="o.bolehAksi.length || o.status === 'menunggu-konfirmasi' || o.status === 'dikonfirmasi' || o.status === 'siap'" class="panel">
              <h3>{{ penjual ? "Tindakan penjual" : "Tindakan Anda" }}</h3>
              <div style="display: grid; gap: 10px">
                <button v-if="boleh('konfirmasi')" class="btn btn-wide" type="button" :disabled="proses" @click="aksi('konfirmasi')">Terima pesanan</button>
                <button v-if="boleh('siap')" class="btn btn-wide" type="button" :disabled="proses" @click="aksi('siap')">{{ o.metodeSerah === "kurir" ? "Tandai sudah dikirim" : "Tandai siap diambil" }}</button>

                <form v-if="boleh('selesai')" novalidate style="display: grid; gap: 12px" @submit.prevent="kirimSelesai">
                  <fieldset>
                    <legend>Sudah diterima. Apakah kondisi sesuai kartu?</legend>
                    <div style="display: grid; gap: 10px; margin-top: 10px">
                      <label class="opt"><input v-model="selesai.kesesuaian" type="radio" name="sesuai" value="sesuai" /><span><b>Sesuai kartu</b><small>Kondisi sama dengan yang ditulis penjual.</small></span></label>
                      <label class="opt"><input v-model="selesai.kesesuaian" type="radio" name="sesuai" value="berbeda" /><span><b>Ada yang berbeda</b><small>Jelaskan bagian yang tidak sesuai.</small></span></label>
                    </div>
                  </fieldset>
                  <div class="field"><label for="cat-sesuai">Catatan (wajib jika ada yang berbeda)</label><textarea id="cat-sesuai" v-model="selesai.catatan" maxlength="500"></textarea></div>
                  <button class="btn btn-wide" type="submit" :disabled="proses">Konfirmasi barang diterima</button>
                </form>

                <button v-if="boleh('tolak')" class="btn btn-danger btn-wide" type="button" @click="bukaForm('tolak')">Tolak pesanan</button>
                <button v-if="boleh('batal')" class="btn btn-danger btn-wide" type="button" @click="bukaForm('batal')">Batalkan pesanan</button>

                <form v-if="bukaAlasan" novalidate class="inline-confirm" style="display: grid; gap: 10px" @submit.prevent="kirimAlasan">
                  <div class="field"><label for="alasan">Alasan {{ bukaAlasan === "tolak" ? "menolak" : "membatalkan" }} (minimal 5 karakter)</label><textarea id="alasan" v-model="alasan" maxlength="300"></textarea></div>
                  <div class="btn-row">
                    <button class="btn btn-danger btn-sm" type="submit" :disabled="proses">Ya, {{ bukaAlasan === "tolak" ? "tolak" : "batalkan" }}</button>
                    <button class="btn btn-quiet btn-sm" type="button" @click="bukaAlasan = ''">Tidak</button>
                  </div>
                </form>

                <p v-if="galatAksi" role="alert" style="color: var(--bad); font-weight: 600">{{ galatAksi }}</p>
                <p v-if="!penjual && o.status === 'menunggu-konfirmasi'" class="note-small">Menunggu penjual menerima pesanan.</p>
                <p v-if="!penjual && o.status === 'dikonfirmasi'" class="note-small">Penjual sedang menyiapkan barang.</p>
                <p v-if="penjual && o.status === 'siap'" class="note-small">Pembeli yang menyatakan barang diterima akan menyelesaikan pesanan.</p>
              </div>
            </div>

            <div class="panel">
              <h3>Rincian</h3>
              <dl class="stat-list" style="margin: 0">
                <div><dt>{{ penjual ? "Pembeli" : "Penjual" }}</dt><dd>{{ penjual ? o.pembeli.namaLengkap : o.toko.namaToko }}</dd></div>
                <div><dt>Serah terima</dt><dd>{{ o.metodeSerah === "kurir" ? "Kurir" : "Ketemuan" }}</dd></div>
                <div><dt>Pembayaran</dt><dd>{{ gratis ? "Gratis" : o.statusPembayaran === "dibayar" ? "Lunas" : "Belum dibayar (di tempat)" }}</dd></div>
                <div><dt>Dibuat</dt><dd>{{ waktu(o.dibuatPada) }}</dd></div>
              </dl>
              <p class="note-small">{{ gratis ? "Give It Forward: tanpa pembayaran. Ongkir, bila memakai kurir, ditanggung penerima." : "Pembayaran bersifat simulasi dan baru tercatat saat pesanan selesai." }}</p>
            </div>
          </div>
        </div>
      </template>
    </StatusMuat>
  </div>
</template>
