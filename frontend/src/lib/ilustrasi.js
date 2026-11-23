// Ilustrasi SVG untuk barang tanpa foto. Bentuk statis, aman dipakai lewat v-html.
const NADA = [
  { bg: "#d9ead9", a: "#1d6b50", b: "#9ccfb3" },
  { bg: "#fbe6c0", a: "#c98312", b: "#f4c26a" },
  { bg: "#dbe5f5", a: "#3a5ca8", b: "#9db5e3" },
  { bg: "#f6dbd4", a: "#c2503a", b: "#eba89b" },
  { bg: "#e6dff2", a: "#6b4fa3", b: "#b9a7dc" },
  { bg: "#e4e5dc", a: "#4d5650", b: "#a9b0a8" },
];
const INK = "#12241d";
const BENTUK = {
  atasan: (a, b) => `<path d="M130 95 165 80Q200 104 235 80L270 95 294 142 258 154 250 140V226H150V140L142 154 106 142Z" fill="${a}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M165 80Q200 108 235 80" fill="none" stroke="${b}" stroke-width="8" stroke-linecap="round"/>`,
  jaket: (a, b) => `<path d="M125 92 170 76 200 92 230 76 275 92 302 208 270 214 258 152V234H142V152L130 214 98 208Z" fill="${a}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M200 92V234" stroke="${INK}" stroke-width="4"/><rect x="152" y="172" width="34" height="30" rx="4" fill="${b}" stroke="${INK}" stroke-width="3"/><rect x="214" y="172" width="34" height="30" rx="4" fill="${b}" stroke="${INK}" stroke-width="3"/>`,
  celana: (a, b) => `<path d="M150 70H250L264 236H212L200 124 188 236H136Z" fill="${a}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="150" y="70" width="100" height="16" fill="${b}" stroke="${INK}" stroke-width="3"/>`,
  sepatu: (a, b) => `<path d="M90 190V160Q90 140 110 138L170 134Q190 152 215 154L275 162Q312 170 314 194V206H90Z" fill="${a}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M84 206H320V224H84Z" fill="${b}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M150 148l18 14M168 142l18 14M186 148l18 14" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  tas: (a, b) => `<path d="M160 124Q160 76 200 76Q240 76 240 124" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><rect x="116" y="120" width="168" height="112" rx="16" fill="${a}" stroke="${INK}" stroke-width="4"/><path d="M116 156H284" stroke="${INK}" stroke-width="4"/><rect x="184" y="146" width="32" height="22" rx="5" fill="${b}" stroke="${INK}" stroke-width="3"/>`,
  hp: (a, b) => `<rect x="156" y="58" width="88" height="184" rx="16" fill="${a}" stroke="${INK}" stroke-width="4"/><rect x="165" y="76" width="70" height="146" rx="6" fill="${b}"/><circle cx="200" cy="67" r="3" fill="${INK}"/><rect x="190" y="228" width="20" height="4" rx="2" fill="${INK}"/>`,
  laptop: (a, b) => `<rect x="108" y="78" width="184" height="118" rx="8" fill="${a}" stroke="${INK}" stroke-width="4"/><rect x="120" y="90" width="160" height="94" rx="3" fill="${b}"/><path d="M82 206H318L302 228H98Z" fill="#c8cdc6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
  kamera: (a, b) => `<rect x="106" y="112" width="188" height="108" rx="14" fill="${a}" stroke="${INK}" stroke-width="4"/><path d="M156 112V98h56v14" fill="${a}" stroke="${INK}" stroke-width="4"/><circle cx="200" cy="166" r="38" fill="${b}" stroke="${INK}" stroke-width="4"/><circle cx="200" cy="166" r="22" fill="${INK}"/><circle cx="193" cy="159" r="6" fill="#fff" opacity=".7"/><circle cx="270" cy="130" r="6" fill="${b}"/>`,
  audio: (a, b) => `<path d="M118 176Q118 84 200 84Q282 84 282 176" fill="none" stroke="${a}" stroke-width="16" stroke-linecap="round"/><rect x="102" y="164" width="40" height="70" rx="16" fill="${b}" stroke="${INK}" stroke-width="4"/><rect x="258" y="164" width="40" height="70" rx="16" fill="${b}" stroke="${INK}" stroke-width="4"/>`,
  rumah: (a, b) => `<path d="M148 92H252L278 164H122Z" fill="${a}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="195" y="164" width="10" height="58" fill="${b}" stroke="${INK}" stroke-width="3"/><ellipse cx="200" cy="228" rx="46" ry="9" fill="${INK}"/>`,
  hobi: (a, b) => `<circle cx="200" cy="150" r="72" fill="${a}" stroke="${INK}" stroke-width="4"/><path d="M128 150H272M200 78V222M148 98Q184 150 148 202M252 98Q216 150 252 202" fill="none" stroke="${INK}" stroke-width="4"/><circle cx="200" cy="150" r="72" fill="none" stroke="${b}" stroke-width="2" opacity=".6"/>`,
  buku: (a, b) => `<rect x="104" y="182" width="196" height="38" rx="4" fill="${a}" stroke="${INK}" stroke-width="4"/><rect x="118" y="142" width="170" height="38" rx="4" fill="${b}" stroke="${INK}" stroke-width="4"/><rect x="108" y="102" width="176" height="38" rx="4" fill="#f4b63f" stroke="${INK}" stroke-width="4"/><path d="M130 182V220M130 142V180M122 102V140" stroke="${INK}" stroke-width="3"/>`,
};

// Nada dipilih dari id barang dan kategori supaya konsisten antar render.
export function nada(id, kategori = "") {
  const n = Number(id) || 0;
  return NADA[(n * 7 + kategori.length) % NADA.length];
}

export function svgIlustrasi({ id, jenis, kategori, label }, polos = false) {
  const t = nada(id, kategori);
  const bentuk = (BENTUK[jenis] || BENTUK.atasan)(t.a, t.b);
  const latar = polos ? "" : `<rect width="400" height="300" fill="${t.bg}"/><circle cx="200" cy="150" r="118" fill="#fff" opacity=".5"/>`;
  const aria = String(label || "barang").replace(/[<>&"]/g, "");
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid ${polos ? "meet" : "slice"}" role="img" aria-label="Ilustrasi ${aria}">${latar}<ellipse cx="200" cy="246" rx="96" ry="9" fill="${INK}" opacity=".14"/>${bentuk}</svg>`;
}

// Tepi sobekan bergaya kuas, bentuk deterministik dari seed.
export function jalurSobek(seed) {
  let s = seed;
  const acak = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let d = "M0 100 L0 70 ";
  let x = 0;
  while (x < 1200) {
    x += 4 + acak() * 14;
    const y = 36 + acak() * 46 + (acak() > 0.86 ? -22 : 0);
    d += `L${Math.min(x, 1200).toFixed(1)} ${y.toFixed(1)} `;
  }
  return d + "L1200 100Z";
}
