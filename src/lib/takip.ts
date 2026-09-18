// ============================================================================
// Instagram veri dışa aktarımını okuma ve karşılaştırma.
//
// NEDEN BU YOL: "kim beni takipten çıktı" sorusunu resmî API cevaplayamıyor —
// Instagram Graph API yalnızca takipçi SAYISINI veriyor, listeyi hiçbir
// koşulda vermiyor. Geriye iki yol kalıyor:
//   1) giriş yapmış oturumla kazımak → kullanım şartlarına aykırı, hesap banı
//   2) Instagram'ın kendi verdiği dışa aktarımı okumak → tamamen meşru
// Burası ikincisi. Şifre istenmiyor, hiçbir şey sunucuya gitmiyor.
//
// ÖNEMLİ AYRIM:
//   Tek bir export "kim beni geri takip etmiyor" der. "Kim beni takipten
//   ÇIKTI" için iki FARKLI zamandaki export'u karşılaştırmak gerekir — bu
//   dosyadaki `karsilastir` tam olarak onun için var.
// ============================================================================

/** Export'taki tek bir hesap kaydı. */
export interface Hesap {
  /** Küçük harfe indirgenmiş kullanıcı adı — karşılaştırmalar bunun üzerinden. */
  kullanici: string;
  /** Profil adresi (export veriyorsa). */
  adres: string | null;
  /** Takibin başladığı an (saniye). Export veriyor; "en yeni" sıralaması için. */
  zaman: number | null;
}

export type DosyaTuru = "takipci" | "takip-edilen";

/** Bir andaki takipçi/takip listesi. Tarayıcıda saklanan birim budur. */
export interface AnlikGoruntu {
  /** Kaydedildiği an (ms). */
  tarih: number;
  takipci: string[];
  takipEdilen: string[];
}

export interface Karsilastirma {
  /** Eskiden takip ediyordu, artık etmiyor. Aranan cevap bu. */
  cikanlar: string[];
  yeniTakipciler: string[];
  /** Senin bıraktıkların. */
  biraktiklarin: string[];
  yeniTakipEttiklerin: string[];
}

/**
 * Dosya adından hangi liste olduğunu anlar.
 *
 * Export'ta bu iki dosya `connections/followers_and_following/` altında durur,
 * ama kullanıcı ZIP yerine tek tek JSON da bırakabildiği için yalnızca dosya
 * ADINA bakıyoruz.
 *
 * Büyük hesaplarda takipçi listesi parçalanıyor: followers_1.json,
 * followers_2.json… Hepsi aynı listenin devamı.
 *
 * Aynı klasördeki `recently_unfollowed_profiles.json`, `close_friends.json`,
 * `pending_follow_requests.json` gibi dosyalar KASITLI olarak eşleşmiyor —
 * onları listeye karıştırmak sayıları sessizce bozardı.
 */
export function dosyaTuru(yol: string): DosyaTuru | null {
  const ad = yol.split("/").pop()?.toLowerCase() ?? "";
  if (/^followers(_\d+)?\.json$/.test(ad)) return "takipci";
  if (/^following(_\d+)?\.json$/.test(ad)) return "takip-edilen";
  return null;
}

/**
 * Export JSON'undan hesapları çıkarır.
 *
 * İki farklı şekil geliyor ve ikisini de karşılamak zorundayız:
 *   followers_1.json → doğrudan dizi
 *   following.json   → { "relationships_following": [ ... ] }
 * Bu yüzden nesne gelirse içindeki ilk diziyi alıyoruz; alan adına
 * bağlanmıyoruz, çünkü Instagram onu geçmişte değiştirdi.
 */
export function hesaplariCikar(ham: unknown): Hesap[] {
  const dizi = diziyiBul(ham);
  if (!dizi) return [];

  const hesaplar: Hesap[] = [];
  const gorulen = new Set<string>();

  for (const kayit of dizi) {
    if (!kayit || typeof kayit !== "object") continue;
    const k = kayit as Record<string, unknown>;
    const veri = Array.isArray(k.string_list_data)
      ? (k.string_list_data[0] as Record<string, unknown> | undefined)
      : undefined;

    // Kullanıcı adı normalde string_list_data[0].value'da; bazı kayıtlarda
    // boş gelip title'da duruyor.
    const ham1 = typeof veri?.value === "string" ? veri.value : "";
    const ham2 = typeof k.title === "string" ? k.title : "";
    const kullanici = (ham1 || ham2).trim().toLowerCase();
    if (!kullanici || gorulen.has(kullanici)) continue;
    gorulen.add(kullanici);

    hesaplar.push({
      kullanici,
      adres: typeof veri?.href === "string" ? veri.href : null,
      zaman: typeof veri?.timestamp === "number" ? veri.timestamp : null,
    });
  }

  return hesaplar;
}

function diziyiBul(ham: unknown): unknown[] | null {
  if (Array.isArray(ham)) return ham;
  if (ham && typeof ham === "object") {
    for (const deger of Object.values(ham as Record<string, unknown>)) {
      if (Array.isArray(deger)) return deger;
    }
  }
  return null;
}

/** Sen takip ediyorsun, o seni etmiyor. */
export function geriTakipEtmeyenler(g: AnlikGoruntu): string[] {
  return fark(g.takipEdilen, g.takipci);
}

/** O seni takip ediyor, sen onu etmiyorsun. */
export function takipEtmedigimTakipciler(g: AnlikGoruntu): string[] {
  return fark(g.takipci, g.takipEdilen);
}

/**
 * İki anlık görüntüyü karşılaştırır. Sıra önemli: `onceki` eski tarihli olan.
 */
export function karsilastir(
  onceki: AnlikGoruntu,
  simdiki: AnlikGoruntu
): Karsilastirma {
  return {
    cikanlar: fark(onceki.takipci, simdiki.takipci),
    yeniTakipciler: fark(simdiki.takipci, onceki.takipci),
    biraktiklarin: fark(onceki.takipEdilen, simdiki.takipEdilen),
    yeniTakipEttiklerin: fark(simdiki.takipEdilen, onceki.takipEdilen),
  };
}

/** a'da olup b'de olmayanlar, alfabetik. */
export function fark(a: readonly string[], b: readonly string[]): string[] {
  const bKume = new Set(b);
  return a.filter((x) => !bKume.has(x)).sort((x, y) => x.localeCompare(y, "tr"));
}
