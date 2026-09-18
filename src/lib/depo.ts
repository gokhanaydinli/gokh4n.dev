// ============================================================================
// Anlık görüntü deposu — tarayıcının kendi belleğinde.
//
// Aracın tek değerli verisi bu: geçmiş. Tek bir export "kim beni geri takip
// etmiyor" der; "kim çıktı" ancak iki farklı tarihteki export karşılaştırılınca
// çıkar. O yüzden her export'tan sonra listeyi burada saklıyoruz.
//
// NEDEN localStorage: veri kullanıcının kendi takipçi listesi. Sunucuya
// göndermek onu saklamak, korumak ve bir gün sızdırmak demek. Burada hiç
// çıkmıyor — sayfa tamamen statik, arkasında hiçbir şey yok.
//
// Kullanıcı adları saklanıyor, profil verisi değil: 5.000 takipçi ~70 KB,
// yani onlarca anlık görüntü rahat sığıyor.
// ============================================================================

import type { AnlikGoruntu } from "./takip";

const ANAHTAR = "takip:anlik-goruntuler";
/** Kota dolmasın diye üst sınır; aşılınca en eskiler düşer. */
const EN_FAZLA = 24;

/** Kayıtlı anlık görüntüler, eskiden yeniye. */
export function goruntuleriOku(): AnlikGoruntu[] {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return [];
    const veri = JSON.parse(ham);
    if (!Array.isArray(veri)) return [];
    return veri
      .filter(
        (g): g is AnlikGoruntu =>
          !!g &&
          typeof g.tarih === "number" &&
          Array.isArray(g.takipci) &&
          Array.isArray(g.takipEdilen)
      )
      .sort((a, b) => a.tarih - b.tarih);
  } catch {
    // Gizli sekmede ya da bozuk kayıtta: geçmiş yok say, araç çalışmaya devam
    // etsin. Karşılaştırma yapılamaz ama tek export analizi yine çalışır.
    return [];
  }
}

/** En son kaydedilen (karşılaştırmanın tabanı). */
export function sonGoruntu(): AnlikGoruntu | null {
  const hepsi = goruntuleriOku();
  return hepsi.length ? hepsi[hepsi.length - 1] : null;
}

/** Kaydeder ve güncel listeyi döner. Kota dolarsa en eskileri atar. */
export function goruntuKaydet(yeni: AnlikGoruntu): AnlikGoruntu[] {
  let liste = [...goruntuleriOku(), yeni].sort((a, b) => a.tarih - b.tarih);
  if (liste.length > EN_FAZLA) liste = liste.slice(liste.length - EN_FAZLA);

  while (liste.length > 0) {
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(liste));
      return liste;
    } catch {
      // Kota doldu: en eskiyi at, tekrar dene. Tek kayıt bile sığmıyorsa
      // sessizce vazgeçiyoruz — ekrandaki analiz zaten duruyor.
      if (liste.length === 1) return [];
      liste = liste.slice(1);
    }
  }
  return [];
}

export function goruntuSil(tarih: number): AnlikGoruntu[] {
  const liste = goruntuleriOku().filter((g) => g.tarih !== tarih);
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(liste));
  } catch {
    /* yazılamadıysa ekranda gösterilen liste yine güncel */
  }
  return liste;
}

export function hepsiniSil(): void {
  try {
    localStorage.removeItem(ANAHTAR);
  } catch {
    /* gizli sekme */
  }
}
