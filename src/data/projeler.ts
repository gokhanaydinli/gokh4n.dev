// ============================================================================
// Çalışmalar — ana sayfadaki raf, vitrin ve proje sayfaları buradan okuyor.
// Yeni proje eklemek tek yerde değişiklik demek.
//
// renk: vitrinin zemini. Üstündeki yazı her zaman koyu (#0e1015): üç renkte
//   de okunur kalıyor. Beyaz yazı maviyle 3.3:1'de kalıyordu, yetmiyor.
// buyuk: vitrinin köşesindeki dev rakam. UYDURMA OLMAZ — projenin gerçekten
//   söylediği bir sayı (oyun sayısı, sunucuya giden bayt, ana ekran boyutu).
// dil: "en" Ingilizce adlar icin; buyuk harf donusumu olursa "İ" cikmasin.
// ============================================================================

export interface Proje {
  ad: string;
  dil?: "en";
  etiket: string;
  canli?: boolean;
  adres: string;
  yil: string;
  aciklama: string;
  yigin: string;
  renk: string;
  buyuk: string;
  dugme: string;
}

/** Proje sayfalari kendi kaydini adla buluyor; liste sirasi degisse de dogru kalsin. */
export function proje(ad: string): Proje {
  const p = projeler.find((x) => x.ad === ad);
  if (!p) throw new Error(`projeler.ts icinde "${ad}" yok`);
  return p;
}

export const projeler: Proje[] = [
  {
    ad: "Oyun Gecesi",
    etiket: "Canlı",
    canli: true,
    // Once proje sayfasina gidiyor: ziyaretci ne oldugunu anlamadan
    // uygulamanin icine dusmesin.
    adres: "/oyun-gecesi/",
    yil: "2026",
    aciklama:
      "Arkadaşlarla telefondan oynanan çok oyunculu parti oyunları. " +
      "Vampir Köylü, Casus Kim, Tabu, Yer Bilme. Oda kur, kodu paylaş.",
    yigin: "Next · Socket.IO · TypeScript",
    renk: "#ff5a1f",
    buyuk: "4 oyun",
    dugme: "İncele",
  },
  {
    ad: "Takip Defteri",
    etiket: "Canlı",
    canli: true,
    adres: "/takip/",
    yil: "2026",
    aciklama:
      "Instagram'da kimin takipten çıktığını gösterir. Şifre istemez, " +
      "hiçbir şey sunucuya gitmez.",
    yigin: "Next · TypeScript · Tailwind",
    renk: "#3ddc97",
    buyuk: "0 B",
    dugme: "İncele",
  },
  {
    ad: "Android TV Toolkit",
    dil: "en",
    etiket: "Açık kaynak",
    adres: "https://github.com/gokhanaydinli/android-tv-toolkit",
    yil: "2026",
    aciklama:
      "Android TV kutusunu root'suz temizleyen betik ve 36 KB'lık bir ana " +
      "ekran. Her değişikliğin geri alma komutu üretiliyor.",
    yigin: "Java · ADB",
    renk: "#5b8cff",
    buyuk: "36 KB",
    dugme: "GitHub'da aç",
  },
];
