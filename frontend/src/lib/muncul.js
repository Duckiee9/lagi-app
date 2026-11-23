// Direktif v-muncul: elemen memudar dan naik sedikit sekali saja saat pertama terlihat.
// Kartu yang muncul bersamaan otomatis berjenjang (jeda 0,05 dtk, maksimal 8 langkah).
import { animate, inView } from "motion";

const kurangiGerak = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let antrean = 0;
let terjadwal = false;
function jeda() {
  if (!terjadwal) {
    terjadwal = true;
    requestAnimationFrame(() => {
      antrean = 0;
      terjadwal = false;
    });
  }
  return Math.min(antrean++, 8) * 0.05;
}

export const vMuncul = {
  mounted(el) {
    if (kurangiGerak()) return;
    el.style.opacity = "0";
    el._henti = inView(
      el,
      () => {
        animate(el, { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] }, { duration: 0.4, delay: jeda(), ease: "easeOut" });
      },
      { amount: 0.15 },
    );
  },
  unmounted(el) {
    el._henti?.();
  },
};
