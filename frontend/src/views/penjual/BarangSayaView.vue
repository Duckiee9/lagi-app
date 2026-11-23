<script setup>
import { ref, watch } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "../../components/Ikon.vue";
import StatusKosong from "../../components/StatusKosong.vue";
import StatusMuat from "../../components/StatusMuat.vue";
import VisualBarang from "../../components/VisualBarang.vue";
import { ambil, hapus, kirim } from "../../lib/api.js";
import { STATUS_BARANG, rp } from "../../lib/format.js";
import { sesi } from "../../lib/session.js";
import { useMuat } from "../../composables/useMuat.js";

const status = ref("");
const daftar = ref([]);
const konfirmasi = ref("");
const galatAksi = ref("");
const FILTER = [["", "Semua"], ["aktif", "Tayang"], ["draf", "Draf"], ["dipesan", "Dipesan"], ["terjual", "Terjual"], ["diberikan", "Diberikan"]];

const { memuat, galat, jalankan } = useMuat(async () => {
  daftar.value = await ambil("/barang/milik-saya", { status: status.value });
});
watch(status, jalankan, { immediate: true });

async function aksi(fn) {
  galatAksi.value = "";
  try {
    await fn();
    konfirmasi.value = "";
    await jalankan();
  } catch (e) {
    galatAksi.value = e.message;
  }
}
const tayang = (b) => aksi(() => kirim(`/barang/${b.id}/tayang`, { tayang: b.status === "draf" }));
const hapusBarang = (b) => aksi(() => hapus(`/barang/${b.id}`));
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow">Barang saya</p>
        <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">{{ sesi.pengguna.namaToko }}</h1>
        <p class="muted">{{ daftar.length }} barang{{ status ? " dengan status ini" : "" }}</p>
      </div>
      <div class="btn-row">
        <RouterLink class="btn" to="/toko/barang/baru"><Ikon nama="plus" />Jual barang</RouterLink>
        <RouterLink class="btn btn-tag" :to="{ path: '/toko/barang/baru', query: { jenis: 'gratis' } }"><Ikon nama="gift" />Beri gratis</RouterLink>
      </div>
    </div>

    <div class="tabbar" role="group" aria-label="Filter status">
      <button v-for="f in FILTER" :key="f[0]" type="button" class="chip" :aria-pressed="status === f[0]" @click="status = f[0]">{{ f[1] }}</button>
    </div>
    <p v-if="galatAksi" role="alert" style="color: var(--bad); font-weight: 600; margin-bottom: 12px">{{ galatAksi }}</p>

    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <StatusKosong v-if="!daftar.length" ikon="box" judul="Belum ada barang" pesan="Terbitkan barang pertama Anda lengkap dengan kartu kondisinya.">
        <RouterLink class="btn" to="/toko/barang/baru">Jual barang</RouterLink>
      </StatusKosong>
      <template v-else>
      <div v-for="b in daftar" :key="b.id" class="listing" style="flex-wrap: wrap">
        <div class="thumb-s"><VisualBarang :barang="b" /></div>
        <div style="min-width: 0">
          <h3><RouterLink :to="`/barang/${b.id}`" style="color: inherit">{{ b.nama }}</RouterLink></h3>
          <p class="note-small">{{ b.jenisNama }} · {{ b.grade }} · {{ b.jenisTransaksi === "gratis" ? "Gratis" : rp(b.hargaJual) }}</p>
          <span :class="STATUS_BARANG[b.status][1]" style="margin-top: 6px">{{ STATUS_BARANG[b.status][0] }}</span>
          <RouterLink v-if="b.jumlahPermintaan" class="pill tag" to="/toko/permintaan" style="margin: 6px 0 0 6px">{{ b.jumlahPermintaan }} permintaan</RouterLink>
        </div>
        <div class="acts">
          <template v-if="b.status === 'aktif' || b.status === 'draf'">
            <RouterLink class="btn btn-2 btn-sm" :to="`/toko/barang/${b.id}/ubah`"><Ikon nama="edit" />Ubah</RouterLink>
            <button class="btn btn-quiet btn-sm" type="button" @click="tayang(b)">{{ b.status === "aktif" ? "Sembunyikan" : "Tayangkan" }}</button>
          </template>
          <template v-if="b.status !== 'dipesan'">
            <span v-if="konfirmasi === b.id" class="inline-confirm">
              <span class="note-small">Hapus permanen?</span>
              <button class="btn btn-danger btn-sm" type="button" @click="hapusBarang(b)">Ya, hapus</button>
              <button class="btn btn-quiet btn-sm" type="button" @click="konfirmasi = ''">Tidak</button>
            </span>
            <button v-else class="btn btn-quiet btn-sm" type="button" :aria-label="`Hapus ${b.nama}`" @click="konfirmasi = b.id"><Ikon nama="trash" /></button>
          </template>
        </div>
      </div>
      </template>
    </StatusMuat>
  </div>
</template>
