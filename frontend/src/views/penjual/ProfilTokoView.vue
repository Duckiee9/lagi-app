<script setup>
import { reactive, ref } from "vue";
import Ikon from "../../components/Ikon.vue";
import { kirim } from "../../lib/api.js";
import { sesi, setPengguna } from "../../lib/session.js";

const p = sesi.pengguna;
const f = reactive({ namaToko: p.namaToko || "", kota: p.kota || "", nomorTelepon: p.nomorTelepon || "", bio: p.bio || "" });
const galat = ref("");
const berhasil = ref(false);
const proses = ref(false);

const STATUS = {
  menunggu: { kelas: "notice", ikon: "clock", teks: "Toko Anda menunggu verifikasi admin. Anda bisa menerbitkan barang setelah disetujui." },
  terverifikasi: { kelas: "notice good", ikon: "shield", teks: "Toko Anda sudah terverifikasi. Anda dapat menerbitkan barang dan menerima pesanan." },
  ditolak: { kelas: "notice bad", ikon: "alert", teks: "Verifikasi toko Anda ditolak. Perbarui data di bawah atau hubungi admin." },
};

async function simpan() {
  galat.value = "";
  berhasil.value = false;
  proses.value = true;
  try {
    setPengguna(await kirim("/toko/saya", { ...f }, "PUT"));
    berhasil.value = true;
  } catch (e) {
    galat.value = e.message;
  } finally {
    proses.value = false;
  }
}
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow">Profil toko</p>
        <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">{{ sesi.pengguna.namaToko }}</h1>
        <p class="muted">Data ini tampil di halaman barang Anda.</p>
      </div>
    </div>
    <div :class="STATUS[sesi.pengguna.statusVerifikasi].kelas" style="margin-bottom: 20px">
      <Ikon :nama="STATUS[sesi.pengguna.statusVerifikasi].ikon" /><span>{{ STATUS[sesi.pengguna.statusVerifikasi].teks }}</span>
    </div>
    <form class="panel" novalidate style="display: grid; gap: 14px; max-width: 640px" @submit.prevent="simpan">
      <div class="field"><label for="t-nama">Nama toko</label><input id="t-nama" v-model="f.namaToko" type="text" required /></div>
      <div class="grid-2">
        <div class="field"><label for="t-kota">Kota</label><input id="t-kota" v-model="f.kota" type="text" required /></div>
        <div class="field"><label for="t-telp">Nomor telepon</label><input id="t-telp" v-model="f.nomorTelepon" type="tel" inputmode="tel" required /></div>
      </div>
      <div class="field"><label for="t-bio">Tentang toko</label><textarea id="t-bio" v-model="f.bio" maxlength="500"></textarea></div>
      <p v-if="galat" role="alert" style="color: var(--bad); font-weight: 600">{{ galat }}</p>
      <p v-if="berhasil" role="status" style="color: var(--good); font-weight: 600">Profil toko disimpan.</p>
      <div><button class="btn" type="submit" :disabled="proses">{{ proses ? "Menyimpan…" : "Simpan profil" }}</button></div>
    </form>
  </div>
</template>
