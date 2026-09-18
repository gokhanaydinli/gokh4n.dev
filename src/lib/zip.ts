// ============================================================================
// Küçük ZIP okuyucu — bağımlılık yok.
//
// NEDEN KENDİ YAZDIK: tek ihtiyacımız Instagram export'undaki iki JSON dosyası.
// Bunun için bir ZIP kütüphanesi indirmek, sayfaya bu işin tamamından daha
// fazla JavaScript sokmak demekti. Tarayıcıda `DecompressionStream` zaten var;
// geriye ZIP'in kendi dizinini okumak kalıyor, o da aşağıdaki ~120 satır.
//
// NEDEN DİLİMLEYEREK OKUYORUZ: Instagram export'u fotoğraf/video da
// içerebiliyor ve gigabaytları bulabiliyor. Dosyanın tamamını belleğe almak
// sekmeyi düşürürdü. Bunun yerine `Blob.slice` ile yalnızca gereken parçalar
// okunuyor: kuyruktaki dizin kaydı, sonra da sadece istediğimiz iki dosya.
//
// ZIP yapısı (kabaca): dosyalar baştan sona sıralı durur, en sonda da hepsinin
// listesini tutan "merkezi dizin" vardır. Biz sondan başlıyoruz.
// ============================================================================

/** Merkezi dizinde görünen tek bir dosya kaydı. */
export interface ZipGirdi {
  /** Arşiv içindeki tam yol. */
  ad: string;
  /** 0 = sıkıştırılmamış, 8 = deflate. Başkasını desteklemiyoruz. */
  yontem: number;
  /** Sıkıştırılmış boyut (bayt). */
  boyut: number;
  /** Açılmış boyut (bayt). */
  acikBoyut: number;
  /** Dosyanın kendi başlığının arşivdeki konumu. */
  yerelOfset: number;
}

const IMZA_EOCD = 0x06054b50; // merkezi dizinin sonu
const IMZA_ZIP64_KONUM = 0x07064b50;
const IMZA_ZIP64_EOCD = 0x06064b50;
const IMZA_DIZIN = 0x02014b50; // merkezi dizin girdisi
const IMZA_YEREL = 0x04034b50; // dosyanın kendi başlığı

/** Arşivin bir aralığını okuyup DataView olarak verir. */
async function gorunum(kaynak: Blob, bas: number, son: number): Promise<DataView> {
  const parca = await kaynak.slice(bas, Math.min(son, kaynak.size)).arrayBuffer();
  return new DataView(parca);
}

/**
 * Arşivdeki dosyaların listesi. İçerikleri OKUNMAZ — sadece nerede
 * durduklarının kaydı. İçerik için `zipMetin`.
 */
export async function zipGirdileri(kaynak: Blob): Promise<ZipGirdi[]> {
  const boyut = kaynak.size;
  if (boyut < 22) throw new Error("Dosya bir ZIP arşivi değil.");

  // EOCD kaydı sonda durur ama arkasında 64 KB'a kadar yorum olabilir;
  // o yüzden kuyruğu tarayıp imzayı sondan başa doğru arıyoruz.
  const kuyrukUzunluk = Math.min(boyut, 66_000);
  const kuyrukBas = boyut - kuyrukUzunluk;
  const kuyruk = await gorunum(kaynak, kuyrukBas, boyut);

  let eocd = -1;
  for (let i = kuyruk.byteLength - 22; i >= 0; i--) {
    if (kuyruk.getUint32(i, true) === IMZA_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP arşivi tanınmadı (dizin kaydı bulunamadı).");

  let girdiSayisi = kuyruk.getUint16(eocd + 10, true);
  let dizinBoyut = kuyruk.getUint32(eocd + 12, true);
  let dizinOfset = kuyruk.getUint32(eocd + 16, true);

  // Zip64: 4 GB'ı ya da 65535 dosyayı aşan arşivlerde bu alanlar "taştı"
  // işaretiyle (hepsi 1) doldurulur, gerçek değerler ayrı bir kayıtta tutulur.
  // Instagram'ın tam export'u bu boyuta rahat ulaşıyor.
  const tasti =
    dizinOfset === 0xffffffff ||
    dizinBoyut === 0xffffffff ||
    girdiSayisi === 0xffff;

  if (tasti) {
    let konum = -1;
    for (let i = eocd - 20; i >= 0; i--) {
      if (kuyruk.getUint32(i, true) === IMZA_ZIP64_KONUM) {
        konum = i;
        break;
      }
    }
    if (konum < 0) throw new Error("Zip64 arşivi ama konum kaydı yok.");

    const z64Ofset = Number(kuyruk.getBigUint64(konum + 8, true));
    const z64 = await gorunum(kaynak, z64Ofset, z64Ofset + 56);
    if (z64.getUint32(0, true) !== IMZA_ZIP64_EOCD) {
      throw new Error("Zip64 dizin kaydı bozuk.");
    }
    girdiSayisi = Number(z64.getBigUint64(32, true));
    dizinBoyut = Number(z64.getBigUint64(40, true));
    dizinOfset = Number(z64.getBigUint64(48, true));
  }

  const dizin = await gorunum(kaynak, dizinOfset, dizinOfset + dizinBoyut);
  const adCozucu = new TextDecoder("utf-8");
  const girdiler: ZipGirdi[] = [];

  let p = 0;
  for (let i = 0; i < girdiSayisi && p + 46 <= dizin.byteLength; i++) {
    if (dizin.getUint32(p, true) !== IMZA_DIZIN) break;

    const yontem = dizin.getUint16(p + 10, true);
    let boyutS = dizin.getUint32(p + 20, true);
    let boyutA = dizin.getUint32(p + 24, true);
    const adUzunluk = dizin.getUint16(p + 28, true);
    const ekUzunluk = dizin.getUint16(p + 30, true);
    const yorumUzunluk = dizin.getUint16(p + 32, true);
    let yerel = dizin.getUint32(p + 42, true);

    const ad = adCozucu.decode(
      new Uint8Array(dizin.buffer, dizin.byteOffset + p + 46, adUzunluk)
    );

    // Taşan alanların gerçek değerleri "ek alanlar" bölgesindeki 0x0001
    // kaydında, SADECE taşanlar, bu sırada: açık boyut, sıkışık boyut, konum.
    if (boyutA === 0xffffffff || boyutS === 0xffffffff || yerel === 0xffffffff) {
      let e = p + 46 + adUzunluk;
      const ekSon = e + ekUzunluk;
      while (e + 4 <= ekSon) {
        const kimlik = dizin.getUint16(e, true);
        const uzunluk = dizin.getUint16(e + 2, true);
        if (kimlik === 0x0001) {
          let q = e + 4;
          if (boyutA === 0xffffffff) {
            boyutA = Number(dizin.getBigUint64(q, true));
            q += 8;
          }
          if (boyutS === 0xffffffff) {
            boyutS = Number(dizin.getBigUint64(q, true));
            q += 8;
          }
          if (yerel === 0xffffffff) {
            yerel = Number(dizin.getBigUint64(q, true));
          }
          break;
        }
        e += 4 + uzunluk;
      }
    }

    girdiler.push({ ad, yontem, boyut: boyutS, acikBoyut: boyutA, yerelOfset: yerel });
    p += 46 + adUzunluk + ekUzunluk + yorumUzunluk;
  }

  return girdiler;
}

/**
 * Tek bir dosyanın içeriğini metin olarak açar.
 *
 * Dosyanın kendi başlığındaki ad/ek uzunlukları merkezi dizindekinden FARKLI
 * olabiliyor (yazan program ek alanları başka türlü doldurmuş olabilir), bu
 * yüzden veri başlangıcı dizinden değil, yerel başlıktan hesaplanıyor.
 */
export async function zipMetin(kaynak: Blob, girdi: ZipGirdi): Promise<string> {
  const baslik = await gorunum(kaynak, girdi.yerelOfset, girdi.yerelOfset + 30);
  if (baslik.getUint32(0, true) !== IMZA_YEREL) {
    throw new Error(`Bozuk kayıt: ${girdi.ad}`);
  }
  const adUzunluk = baslik.getUint16(26, true);
  const ekUzunluk = baslik.getUint16(28, true);
  const veriBas = girdi.yerelOfset + 30 + adUzunluk + ekUzunluk;
  const veri = kaynak.slice(veriBas, veriBas + girdi.boyut);

  if (girdi.yontem === 0) return veri.text();
  if (girdi.yontem !== 8) {
    throw new Error(`Desteklenmeyen sıkıştırma (${girdi.yontem}): ${girdi.ad}`);
  }

  const akis = veri.stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(akis).text();
}
