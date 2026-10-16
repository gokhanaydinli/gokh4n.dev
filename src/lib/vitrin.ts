// ============================================================================
// Vitrin ve kart verisi — ana ekrandaki büyük alanın neyi göstereceği.
//
// Kartlar bu nesneyi data-vitrin olarak taşıyor; kartın üstüne gelince ya
// da klavyeyle seçince betik vitrini bununla dolduruyor. JS yoksa vitrin
// sunucuda ilk öğeyle basılmış halde kalıyor, kartlar düz bağlantı.
// ============================================================================
import type { CollectionEntry } from "astro:content";
import type { Proje } from "../data/projeler";
import { okumaSuresi } from "./okuma";

export interface VitrinOgesi {
  ad: string;
  dil?: string;
  etiket: string;
  canli?: boolean;
  aciklama: string;
  buyuk: string;
  renk: string;
  adres: string;
  dugme: string;
  disari: boolean;
}

export function projeVitrini(p: Proje): VitrinOgesi {
  return {
    ad: p.ad,
    dil: p.dil,
    etiket: p.etiket,
    canli: p.canli,
    aciklama: p.aciklama,
    buyuk: p.buyuk,
    renk: p.renk,
    adres: p.adres,
    dugme: p.dugme,
    disari: p.adres.startsWith("http"),
  };
}

// Yazilarin rengi adlarindan: ayni yazi her zaman ayni renkte. Hepsi acik
// tonlar, ustlerinde koyu yazi okunuyor.
const YAZI_RENKLERI = ["#f2f3f5", "#ffd84d", "#c9b8ff", "#7fd6ff", "#ffb4a2"];

export function yaziRengi(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return YAZI_RENKLERI[h % YAZI_RENKLERI.length];
}

export function yaziVitrini(y: CollectionEntry<"blog">): VitrinOgesi {
  const dk = okumaSuresi(y.body);
  return {
    ad: y.data.baslik,
    etiket: `Yazı · ${dk} dk`,
    aciklama: y.data.ozet,
    buyuk: `${dk} dk`,
    renk: yaziRengi(y.id),
    adres: `/blog/${y.id}/`,
    dugme: "Oku",
    disari: false,
  };
}

export function kisaTarih(t: Date): string {
  return t.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}
