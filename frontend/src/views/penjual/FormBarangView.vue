<script setup>
import { computed, reactive, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import Ikon from "../../components/Ikon.vue";
import HonestCard from "../../components/HonestCard.vue";
import StatusMuat from "../../components/StatusMuat.vue";
import VisualBarang from "../../components/VisualBarang.vue";
import { ambil, kirim, urlFoto, urlFotoCacat } from "../../lib/api.js";
import { bacaFoto } from "../../lib/foto.js";
import { cacatWajib, gradeDisarankan, gradeTerlaluTinggi, kondisiLengkap, tingkatIsian, tingkatMaks } from "../../lib/kondisi.js";
import { muatKategori, useKategori } from "../../composables/useKategori.js";
import { useMuat } from "../../composables/useMuat.js";

// Tambah barang (tanpa id) atau ubah barang (dengan id).
const props = defineProps({ id: { type: String, default: "" } });
const route = useRoute();
const router = useRouter();
const { data: skemaData, cari } = useKategori();
const MAKS_CACAT = 5;
const ubah = computed(() => !!props.id);

const f = reactive({
  kategori: "",
  jenis: "",
  jenisTransaksi: route.query.jenis === "gratis" ? "gratis" : "jual",
  nama: "",
  deskripsi: "",
  hargaJual: "",
  hargaBaru: "",
  kondisi: {},
  grade: "",
  catatan: "",
  cacat: [], // { kunci, id?, label, foto (data URL baru) , adaFoto }
});
// undefined = foto lama tetap, null = hapus, string = foto baru (data URL)
const fotoBaru = ref(undefined);
const adaFotoLama = ref(false);
const galatFoto = ref("");
const daftarGalat = ref([]);
const menyimpan = ref(false);
let kunciCacat = 0;
const baruCacat = (d = {}) => ({ kunci: ++kunciCacat, id: d.id || null, label: d.label || "", foto: "", adaFoto: !!d.adaFoto });

const { memuat, galat, jalankan } = useMuat(async () => {
  const skema = await muatKategori();
  if (ubah.value) {
    const b = await ambil(`/barang/milik-saya/${props.id}`);
    Object.assign(f, {
      kategori: b.kategori, jenis: b.jenis, jenisTransaksi: b.jenisTransaksi, nama: b.nama, deskripsi: b.deskripsi || "",
      hargaJual: b.jenisTransaksi === "jual" ? String(b.hargaJual) : "", hargaBaru: String(b.hargaBaru),
      kondisi: { ...b.kondisiMap }, grade: b.grade, catatan: b.catatan || "", cacat: b.cacat.map(baruCacat),
    });
    adaFotoLama.value = b.adaFoto;
  } else {
    f.kategori = skema.kategori[0].kode;
    f.jenis = skema.kategori[0].jenis[0]?.kode || "";
  }
});
watch(() => props.id, jalankan, { immediate: true });

const skema = computed(() => cari(f.kategori));
const kolom = computed(() => skema.value?.kolom || []);
const lengkap = computed(() => kondisiLengkap(kolom.value, f.kondisi));
const maks = computed(() => tingkatMaks(kolom.value, f.kondisi));
const saran = computed(() => gradeDisarankan(maks.value));
const perluCacat = computed(() => cacatWajib(f.grade || saran.value, maks.value));
const gratis = computed(() => f.jenisTransaksi === "gratis");

function gantiKategori() {
  const k = cari(f.kategori);
  f.jenis = k?.jenis[0]?.kode || "";
  f.kondisi = {};
  f.grade = "";
}
// Ganti kategori (bukan saat memuat awal): reset jenis, isian kondisi, dan grade.
watch(() => f.kategori, (baru, lama) => lama && baru !== lama && gantiKategori());
const tambahCacat = () => f.cacat.length < MAKS_CACAT && f.cacat.push(baruCacat());
const hapusCacat = (i) => f.cacat.splice(i, 1);

async function pilihFoto(e, sasaran) {
  galatFoto.value = "";
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  try {
    const url = await bacaFoto(file);
    if (sasaran === "utama") fotoBaru.value = url;
    else sasaran.foto = url;
  } catch (err) {
    galatFoto.value = err.message;
  }
}
const fotoUtamaSumber = computed(() => (fotoBaru.value ? fotoBaru.value : fotoBaru.value === undefined && adaFotoLama.value ? urlFoto(props.id) : ""));
const fotoCacatSumber = (c) => c.foto || (c.id && c.adaFoto ? urlFotoCacat(props.id, c.id) : "");

// Barang rekaan untuk pratinjau HonestCard.
const pratinjau = computed(() => ({
  id: props.id || "",
  nama: f.nama || "Nama barang",
  kategori: f.kategori,
  jenis: f.jenis,
  jenisNama: skema.value?.jenis.find((j) => j.kode === f.jenis)?.nama || "",
  grade: f.grade,
  catatan: f.catatan,
  adaFoto: !!fotoUtamaSumber.value,
  dibuatPada: null,
  toko: null,
  kondisi: kolom.value.map((k) => ({ kunci: k.kunci, label: k.label, nilai: f.kondisi[k.kunci] ?? "", tingkat: tingkatIsian(k, f.kondisi[k.kunci]) })),
  cacat: f.cacat.filter((c) => c.label.trim()).map((c) => ({ id: c.id, label: c.label, adaFoto: !!fotoCacatSumber(c), fotoLokal: c.foto })),
}));

function periksa() {
  const e = [];
  if (f.nama.trim().length < 3) e.push("Nama barang minimal 3 karakter.");
  if (!f.jenis) e.push("Pilih jenis barang.");
  const baru = Number(f.hargaBaru);
  if (!Number.isInteger(baru) || baru < 1) e.push("Isi perkiraan harga barang baru (rupiah, bilangan bulat).");
  if (!gratis.value) {
    const jual = Number(f.hargaJual);
    if (!Number.isInteger(jual) || jual < 1) e.push("Isi harga jual (rupiah, bilangan bulat).");
    else if (jual > baru) e.push("Harga jual tidak boleh melebihi harga barang baru.");
  }
  for (const k of kolom.value) {
    if (String(f.kondisi[k.kunci] ?? "").trim() === "") e.push(`${k.label} wajib diisi pada kartu kondisi.`);
  }
  if (!f.grade) e.push("Pilih grade kondisi.");
  else if (lengkap.value && gradeTerlaluTinggi(f.grade, saran.value)) e.push(`Berdasarkan isian, grade minimal "${saran.value}".`);
  if (lengkap.value && f.grade && cacatWajib(f.grade, maks.value) && !f.cacat.some((c) => c.label.trim())) e.push("Tulis minimal satu bagian yang bercacat.");
  return e;
}

async function simpan(status) {
  galatFoto.value = "";
  daftarGalat.value = periksa();
  if (daftarGalat.value.length) return;
  const body = {
    nama: f.nama.trim(),
    kategori: f.kategori,
    jenis: f.jenis,
    jenisTransaksi: f.jenisTransaksi,
    hargaBaru: Number(f.hargaBaru),
    deskripsi: f.deskripsi,
    grade: f.grade,
    kondisi: f.kondisi,
    catatan: f.catatan,
    cacat: f.cacat.filter((c) => c.label.trim()).map((c) => ({ ...(c.id ? { id: c.id } : {}), label: c.label.trim(), ...(c.foto ? { foto: c.foto } : {}) })),
    status,
  };
  if (!gratis.value) body.hargaJual = Number(f.hargaJual);
  if (fotoBaru.value !== undefined) body.foto = fotoBaru.value;
  menyimpan.value = true;
  try {
    if (ubah.value) await kirim(`/barang/${props.id}`, body, "PUT");
    else await kirim("/barang", body);
    router.push("/toko/barang");
  } catch (e) {
    daftarGalat.value = [e.message];
  } finally {
    menyimpan.value = false;
  }
}
</script>

<template>
  <div class="container">
    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <div class="page-head">
        <div>
          <p class="eyebrow">{{ ubah ? "Ubah barang" : gratis ? "Give It Forward" : "Jual barang" }}</p>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">{{ ubah ? "Ubah barang" : "Unggah barang" }}</h1>
          <p class="muted">Isi kartu kondisi selengkap mungkin. Kartu inilah yang dibaca pembeli sebelum memesan.</p>
        </div>
      </div>

      <div v-if="skemaData" class="form-layout">
        <form novalidate @submit.prevent>
          <div v-if="daftarGalat.length" class="err-sum" role="alert">
            Ada isian yang perlu diperbaiki.
            <ul><li v-for="g in daftarGalat.slice(0, 8)" :key="g">{{ g }}</li></ul>
          </div>

          <section class="form-sec">
            <h2><span class="n">1</span>Jenis</h2>
            <div class="seg" role="radiogroup" aria-label="Jenis transaksi">
              <label><input v-model="f.jenisTransaksi" type="radio" value="jual" /><span><Ikon nama="tag" />Dijual</span></label>
              <label><input v-model="f.jenisTransaksi" type="radio" value="gratis" /><span><Ikon nama="gift" />Give It Forward (gratis)</span></label>
            </div>
          </section>

          <section class="form-sec">
            <h2><span class="n">2</span>Info barang</h2>
            <div class="field"><label for="nama">Nama barang</label><input id="nama" v-model="f.nama" type="text" maxlength="120" /></div>
            <div class="grid-2">
              <div class="field">
                <label for="kategori">Kategori</label>
                <select id="kategori" v-model="f.kategori">
                  <option v-for="k in skemaData.kategori" :key="k.kode" :value="k.kode">{{ k.label }}</option>
                </select>
              </div>
              <div class="field">
                <label for="jenis">Jenis barang</label>
                <select id="jenis" v-model="f.jenis"><option v-for="j in skema?.jenis || []" :key="j.kode" :value="j.kode">{{ j.nama }}</option></select>
              </div>
            </div>
            <div class="field"><label for="deskripsi">Deskripsi</label><textarea id="deskripsi" v-model="f.deskripsi" maxlength="1000" placeholder="Cerita singkat soal barang, alasan dilepas, atau cara serah terima"></textarea></div>
            <div class="field">
              <span style="font-weight: 600; font-size: 0.88rem; margin-bottom: 6px">Foto utama (opsional)</span>
              <div class="upload">
                <div v-if="fotoUtamaSumber" class="thumb">
                  <img :src="fotoUtamaSumber" alt="Foto utama" />
                  <button type="button" aria-label="Hapus foto utama" @click="fotoBaru = null"><Ikon nama="x" /></button>
                </div>
                <label class="add"><Ikon nama="camera" /><span style="display: block">{{ fotoUtamaSumber ? "Ganti foto" : "Tambah foto" }}</span>
                  <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" @change="pilihFoto($event, 'utama')" /></label>
              </div>
              <span class="hint">JPEG, PNG, atau WebP, maksimal 2 MiB (foto lebih besar diperkecil otomatis). Tanpa foto, katalog menampilkan ilustrasi.</span>
              <span v-if="galatFoto" class="err" role="alert">{{ galatFoto }}</span>
            </div>
          </section>

          <section class="form-sec">
            <h2><span class="n">3</span>Harga</h2>
            <div class="grid-2">
              <div v-if="!gratis" class="field"><label for="hargaJual">Harga jual (Rp)</label><input id="hargaJual" v-model="f.hargaJual" type="number" min="1" step="1000" inputmode="numeric" /></div>
              <div class="field">
                <label for="hargaBaru">Perkiraan harga barang baru (Rp)</label>
                <input id="hargaBaru" v-model="f.hargaBaru" type="number" min="1" step="1000" inputmode="numeric" />
                <span class="hint">Dipakai menghitung penghematan dan nilai yang diselamatkan.</span>
              </div>
            </div>
          </section>

          <section class="form-sec">
            <h2><span class="n">4</span>Honest Condition Card</h2>
            <div class="grid-2">
              <div v-for="k in kolom" :key="k.kunci" class="field">
                <label :for="`k_${k.kunci}`">{{ k.label }}</label>
                <select v-if="k.tipe === 'pilihan'" :id="`k_${k.kunci}`" v-model="f.kondisi[k.kunci]">
                  <option value="">Pilih…</option>
                  <option v-for="o in k.pilihan" :key="o.nilai" :value="o.nilai">{{ o.nilai }}</option>
                </select>
                <input v-else-if="k.tipe === 'angka'" :id="`k_${k.kunci}`" v-model="f.kondisi[k.kunci]" type="number" :min="k.min" :max="k.max" inputmode="numeric" :placeholder="k.placeholder" />
                <input v-else :id="`k_${k.kunci}`" v-model="f.kondisi[k.kunci]" type="text" maxlength="60" :placeholder="k.placeholder" />
              </div>
            </div>

            <fieldset>
              <legend>Grade kondisi</legend>
              <div class="grade-pick" style="margin-top: 10px">
                <label v-for="g in skemaData.grade" :key="g.nilai" class="opt">
                  <input v-model="f.grade" type="radio" name="grade" :value="g.nilai" /><span><b>{{ g.nilai }}</b><small>{{ g.keterangan }}</small></span>
                </label>
              </div>
              <p v-if="lengkap" class="hint note-small" style="margin-top: 10px">Berdasarkan isian, grade minimal untuk kartu ini: <b>{{ saran }}</b>.</p>
              <p v-else class="hint note-small" style="margin-top: 10px">Lengkapi isian kondisi untuk melihat saran grade.</p>
            </fieldset>

            <div class="field"><label for="catatan">Catatan kondisi (opsional)</label><textarea id="catatan" v-model="f.catatan" maxlength="500" placeholder="Hal lain yang perlu diketahui pembeli"></textarea></div>

            <fieldset>
              <legend>Bagian yang bercacat</legend>
              <p class="note-small" style="margin: 6px 0 12px">{{ perluCacat ? "Wajib diisi: tulis tiap bagian yang bercacat. Foto sangat disarankan." : "Opsional untuk barang berkondisi seperti baru." }}</p>
              <div style="display: grid; gap: 10px">
                <div v-for="(c, i) in f.cacat" :key="c.kunci" class="cacat-row">
                  <div class="field">
                    <label class="sr-only" :for="`c-${c.kunci}`">Nama bagian cacat {{ i + 1 }}</label>
                    <input :id="`c-${c.kunci}`" v-model="c.label" type="text" maxlength="80" placeholder="Contoh: noda di lengan kiri" />
                  </div>
                  <span v-if="fotoCacatSumber(c)" class="thumb" style="position: relative; width: 44px; height: 44px; border-radius: 8px; overflow: hidden">
                    <img :src="fotoCacatSumber(c)" alt="" style="width: 100%; height: 100%; object-fit: cover" />
                  </span>
                  <label class="btn btn-2 btn-sm" style="margin: 0; cursor: pointer"><Ikon nama="camera" />{{ fotoCacatSumber(c) ? "Ganti" : "Foto" }}
                    <input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" @change="pilihFoto($event, c)" /></label>
                  <button class="btn btn-quiet btn-sm" type="button" :aria-label="`Hapus bagian cacat ${i + 1}`" @click="hapusCacat(i)"><Ikon nama="x" /></button>
                </div>
              </div>
              <button class="btn btn-2 btn-sm" type="button" style="margin-top: 12px" :disabled="f.cacat.length >= MAKS_CACAT" @click="tambahCacat"><Ikon nama="plus" />Tambah bagian cacat</button>
            </fieldset>
          </section>

          <div class="btn-row">
            <button class="btn" type="button" :disabled="menyimpan" @click="simpan('aktif')"><Ikon nama="check" />{{ ubah ? "Simpan dan tayangkan" : "Terbitkan" }}</button>
            <button class="btn btn-2" type="button" :disabled="menyimpan" @click="simpan('draf')">Simpan sebagai draf</button>
            <RouterLink class="btn btn-quiet" to="/toko/barang">Batal</RouterLink>
          </div>
        </form>

        <aside class="sticky-prev" aria-label="Pratinjau">
          <h2 style="font-size: 1.05rem">Pratinjau kartu</h2>
          <HonestCard :barang="pratinjau">
            <template #visual><VisualBarang :barang="pratinjau" :lokal="fotoUtamaSumber" /></template>
          </HonestCard>
        </aside>
      </div>
    </StatusMuat>
  </div>
</template>
