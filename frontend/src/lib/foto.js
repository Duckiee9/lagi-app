const JENIS = ["image/jpeg", "image/png", "image/webp"];
export const MAKS_BYTE = 2 * 1024 * 1024;

const bacaDataUrl = (blob) =>
  new Promise((ok, gagal) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => gagal(new Error("Gagal membaca file."));
    r.readAsDataURL(blob);
  });

// Perkecil gambar bila perlu supaya muat batas 2 MiB. Mengembalikan data URL.
async function perkecil(file) {
  const bmp = await createImageBitmap(file);
  let sisi = 1600;
  for (let i = 0; i < 4; i++) {
    const skala = Math.min(1, sisi / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * skala);
    c.height = Math.round(bmp.height * skala);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
    if (blob && blob.size <= MAKS_BYTE) return bacaDataUrl(blob);
    sisi = Math.round(sisi * 0.7);
  }
  throw new Error("Foto terlalu besar. Pilih foto yang lebih kecil.");
}

// File -> data URL (JPEG/PNG/WebP, maksimal 2 MiB; foto lebih besar diperkecil otomatis).
export async function bacaFoto(file) {
  if (!file) throw new Error("Tidak ada file.");
  if (!JENIS.includes(file.type)) throw new Error("Foto harus berformat JPEG, PNG, atau WebP.");
  if (file.size <= MAKS_BYTE) return bacaDataUrl(file);
  try {
    return await perkecil(file);
  } catch (e) {
    throw new Error(e.message || "Foto terlalu besar. Maksimal 2 MiB.");
  }
}
