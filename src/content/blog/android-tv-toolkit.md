---
baslik: "Android TV Toolkit"
tarih: 2026-09-19
ozet: "Ucuz bir Android TV kutusunu root'suz temizlemek, hızlandırmak ve ana ekranını değiştirmek için adım adım rehber. Her adımın geri dönüşü var."
etiketler: ["ANDROID", "ADB", "LAUNCHER"]
---

Ucuz Android TV kutuları genelde iki sebepten takılır: üstlerinde hiç
kullanmayacağın onlarca uygulama vardır ve hazır ana ekran tek başına
yüzlerce megabayt bellek tutar.

Bu rehber ikisini de root'suz çözüyor. Yapılan her değişikliğin geri alma
komutu var; en kötü ihtimalle fabrika ayarlarına dönüp her şeyi geri
alırsın.

Referans olarak 2 GB RAM'li, Android 11 çalışan bir kutu kullandım.
Sonuçlar: boştaki bellek 614 MB'tan 983 MB'a çıktı, ana ekranın belleği
131 MB'tan 25 MB'a indi.

## Gereken tek araç: ADB

**ADB** (Android Debug Bridge), Google'ın kendi geliştirici aracı.
Bilgisayarından kutuya bağlanıp komut çalıştırmanı sağlıyor. Bu kutularda
terminal olmadığı için içeri girmenin yolu bu.

Kutuda açman gerekenler:

1. **Ayarlar → Sistem → Hakkında** ekranında "Yapı numarası" satırına
   yedi kez bas. Geliştirici seçenekleri açılır.
2. **Ayarlar → Sistem → Geliştirici seçenekleri** → **USB hata ayıklama**
   (kutuya göre "Ağ üzerinden hata ayıklama" da olabilir).

Sonra bilgisayarından, aynı Wi-Fi ağındayken kutunun yerel IP'sine
bağlanıyorsun. IP'yi kutunun ağ ayarlarında görebilirsin.

```bash
adb connect <kutunun-yerel-ip>:5555
adb devices          # baglandiysa listede gorunur
```

## Adım 1 — Mevcut durumun fotoğrafını çek

Hiçbir şeye dokunmadan önce, sonradan karşılaştırabileceğin bir kayıt al:

```bash
adb shell pm list packages > paketler.txt
adb shell pm list packages -d > devre_disi.txt
```

Bir şey bozulduğunda "neyi değiştirmiştim" sorusunun cevabı bu dosyalarda
olacak. Ayrıca kaldırdığın her paketi ayrı bir dosyaya yazmanı öneririm —
yaptıklarının listesi değil, **geri alma komutlarının listesi** işe yarıyor.

## Adım 2 — Paketleri tanı

```bash
adb shell pm list packages
```

Bende 116 satır çıktı. Bu listedeki her satır bir uygulama.

Adından ne olduğunu çıkaramadığın bir paket görürsen, kaldırmadan önce
içine bak:

```bash
adb shell dumpsys package <paket.adi> | head -60
```

Çıktıda uygulamanın servisleri ve izinleri görünüyor. Örnek olarak şu paket
her Android TV kutusunda var ve adından hiçbir şey anlaşılmıyor:

```
com.google.android.tv.axel
```

İçine baktığında şunu görüyorsun:

```
.remote.IrService
```

`Ir` = infrared, yani kızılötesi. Bu paket kutunun kendi kumandasını dinleyen
servis. Kaldırsan kumanda çalışmaz.

Kural basit: **ne işe yaradığını bilmediğin pakete dokunma.** Şüphedeysen o
paketi listenin sonuna bırak; hepsini bir gecede halletmek zorunda değilsin.

## Adım 3 — Geri alınabilir şekilde kaldır

Silmek yerine bunu kullan:

```bash
adb shell pm uninstall -k --user 0 <paket.adi>
```

Komutun parçaları:

- `--user 0` → yalnızca birincil kullanıcı için kaldırır, sistemin kendi
  kopyasına dokunmaz
- `-k` → **APK'yı ve verisini diskte bırakır**

Sonuç: uygulama listeden kaybolur, bellek ve işlemci kullanmayı bırakır,
ama dosyası durur. Geri getirmek tek komut:

```bash
adb shell pm install-existing <paket.adi>
```

Root gerekmiyor, sistem bölümüne yazılmıyor.

Kaldırmaya değer tipik adaylar: mağaza demoları, üretici test araçları,
kullanmadığın video servisleri, ikinci bir tarayıcı, ekran koruyucu,
erişilebilirlik araçları (kullanmıyorsan), oyun servisleri.

Ben 22 paket kaldırdım ve paket sayısı 116'dan 95'e indi.

## Dokunulmayacaklar

Bu gruplar kutuyu kullanılamaz hâle getirebilir:

- **Kumanda servisleri** — kızılötesi servis, uzaktan kumanda eşleştirme
- **Bluetooth** — kumanda çoğu kutuda Bluetooth üzerinden çalışır
- **Klavye / giriş yöntemi** — metin girecek bir şey kalmaz
- **Donanım katmanı** — üreticinin sürücü paketleri
- **Play Store altyapısı** — Play Store, Play Services, WebView, indirme
  yöneticisi
- **Sistem çekirdeği** — `android`, `systemui`, ayarlar uygulaması, paket
  yükleyici, izin denetleyici, ağ yığını

Bunlar "belki gereksizdir" diye kurcalanacak şeyler değil.

## Adım 4 — Ana ekranı değiştirmek

**Launcher**, Android'in ana ekranı. Aslında o da normal bir uygulama — tuşa
bastığında sistemin açtığı, "ana ekran" rolünü üstlenmiş bir uygulama. Yani
değiştirilebilir.

Kazanç burada büyük olabiliyor: hazır ana ekranlar 110-130 MB civarı bellek
tutuyor.

**Sıralama önemli.** Şu adımları bu sırayla uygula:

1. Yeni launcher'ı kur
2. Varsayılan yap (kutu sorduğunda "her zaman" de)
3. **Ana ekran tuşuna bas ve gerçekten açıldığını gör**
4. Ancak ondan sonra eski launcher'ı devre dışı bırak

Üçüncü adımı atlarsan, çalışıp çalışmadığını bilmeden geri dönüş yolunu
kapatmış olursun. Bu kutularda kurulum sihirbazından kalan paketler "ana
ekran" yarışında üçüncü parti launcher'ı yenebiliyor; o durumda kutu bir
kurtarma ekranında kalır ve ağ ayarları sıfırlanır.

Eski launcher'ı kapatmak için:

```bash
adb shell pm disable-user --user 0 <eski.launcher.paketi>
```

Bazı sistem paketleri bu komutu reddeder (`SecurityException`). Onlarda
Adım 3'teki `uninstall -k` yöntemini kullan — o da geri alınabilir.

## Kendi launcher'ını yazmak

Hazır alternatifler de yüzlerce megabayt tutuyorsa, ihtiyacın olan şey
muhtemelen çok küçüktür: bir raf dolusu kısayol, saat, bir de tüm uygulamalar
listesi.

Ben kendim yazdım ve şu kısıtları koydum:

- **Kütüphane yok.** Düz Java ve Android'in kendi arayüz bileşenleri.
- **Ağ izni yok.** Bir ana ekranın internete çıkması için sebep yok; izni
  hiç istemezsen dışarı veri gidemez.
- Arka plan servisi yok, açılışta başlayan bir şey yok, veritabanı yok.

Sonuç: 36 KB'lık uygulama, 25 MB bellek, boştayken %0 işlemci.

İki faydalı detay: Saat için zamanlayıcı kurmaya gerek yok — Android zaten
dakikada bir "dakika değişti" sinyali yayınlıyor. Uygulama ikonlarını da her
açılışta yeniden çizmek yerine diske kaydet; anahtar olarak paket adı ve
sürüm numarasını kullanırsan uygulama güncellenince ikon kendiliğinden
tazelenir.

Kendi yazdığın uygulamayı imzaladığın **anahtarı sakla**. Android,
güncellemenin aynı anahtarla imzalanmasını şart koşuyor; anahtar kaybolursa
o uygulamayı bir daha güncelleyemezsin.

## ADB'nin bir sınırı

Üçüncü parti bir uygulamanın kendi içindeki bileşenlerini ADB'den devre dışı
bırakamazsın — sistem uygulamalarında çalışan komut, Play Store'dan
kurduğun uygulamalarda izin hatası verir.

Bir ayarı arayüzden değiştirmen gerekiyorsa koordinata dokunabilirsin:

```bash
adb shell input tap 960 540
```

Yön tuşlarıyla gezinmeye çalışmak daha kırılgan: odak metin alanlarına
takılıyor ve o an nerede olduğunu göremiyorsun.

## Ne kadar kazanç beklemeli?

| | Önce | Sonra |
|---|---|---|
| Paket sayısı | 116 | 95 |
| Boştaki bellek | 614 MB | 983 MB |
| Ana ekran belleği | 131 MB | 25 MB |

Bellek neredeyse ikiye katlandı. Ama beklentiyi doğru kurmak lazım:
gezinme sırasında işlemciye baktığımda dört çekirdeğin toplam kapasitesinin
yalnızca **%26-35'i** kullanılıyordu. Kalan çekirdekler boştaydı.

Yani kalan yavaşlığın sebebi bellek değil, **tek çekirdeğin hızı.** Bu
kutulardaki çekirdekler güç tasarrufu için tasarlanmış ve arayüz çizmek
paralelleşen bir iş değil — dört yavaş çekirdek, bir hızlı çekirdeğin yerini
tutmuyor.

Bu ayrım pratikte şu demek:

- **RAM kazancı** uygulamaların arka planda öldürülmemesini sağlıyor. Geri
  döndüğünde kaldığın yerde buluyorsun. Kalıcı ve gerçek bir kazanç.
- **Tuşa bastığındaki gecikme** donanım tavanı. Oradan alacağın başka bir
  şey yok.

## İş bitince

- **ADB'yi kapat.** Geliştirici seçeneklerinden hata ayıklamayı kapat. Açık
  bırakırsan ağına bağlanan herkes kutuna uygulama kurabilir.
- **Paket isimleri modelden modele değişir.** Başka bir kutuda bu listeyi
  körlemesine uygulama; önce kendi cihazının listesini çıkar.
- **Acele etme.** Bir grup paketi kaldır, birkaç gün kullan, bir şey
  bozulmadıysa devam et. Neyin neyi bozduğunu ancak böyle anlarsın.
