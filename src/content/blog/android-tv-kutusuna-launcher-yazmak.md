---
baslik: "Android TV kutusuna kendi ana ekranımı yazdım"
tarih: 2026-09-19
ozet: "Ucuz bir TV kutusu neden takılır, root'suz nasıl hızlandırılır ve neden sonunda 36 KB'lık bir launcher yazdım? Bir de kutuyu kullanılamaz hâle getirdiğim an."
etiketler: ["ANDROID", "ADB", "LAUNCHER"]
---

Evde 2 GB RAM'li, dört çekirdekli bir Android TV kutusu var. Android 11
çalışıyor ve üretici cihazı terk etmiş — son güvenlik yaması 2024 ortasından
kalma.

Takılıyordu. Ana ekranda sağa sola gezinirken görüntü tutukluyor, bir
uygulama açmak saniyeler alıyordu. "Ucuz kutu işte" deyip geçebilirdim ama
merak ettim: tam olarak *ne* yavaş?

Bu yazı o merakın nereye gittiğinin hikâyesi. Aynı şeyi kendi kutunda
denemek istersen adım adım takip edebilirsin — root gerekmiyor, geri
dönüşü de var.

## Önce suçluyu bulalım

Tahmin yürütmek yerine ölçtüm. Android'de hangi uygulamanın ne kadar bellek
tuttuğunu görebiliyorsun. Çıkan sonuç şuydu: **ana ekranın kendisi 131 MB
tutuyordu.**

Bu sayıyı bir yere oturtayım. Kutuda boşta kalan bellek 614 MB'tı. Yani
hiçbir şey yapmazken, sadece ana ekran, kalan belleğin beşte birini
yiyordu. Sen bir uygulama açtığında sistem yer açmak için başka bir şeyi
öldürmek zorunda kalıyordu. Geri döndüğünde o uygulama baştan açılıyordu.
"Takılma" dediğimiz şeyin büyük kısmı buydu.

Yanında da hiç kullanmadığım onlarca uygulama duruyordu: mağaza demoları,
üretici test araçları, iki ayrı tarayıcı, bir ekran koruyucu.

## ADB nedir, neden lazım?

Bu kutularda dosya yöneticisi yok, terminal yok. Cihazın içine girmenin yolu
**ADB** (Android Debug Bridge) — Google'ın kendi geliştirici aracı.
Bilgisayarından kutuya bağlanıp komut çalıştırmanı sağlıyor.

Açmak için kutuda **Geliştirici seçenekleri**ni etkinleştirmen, sonra
oradan **USB hata ayıklama**yı (ya da ağ üzerinden hata ayıklamayı) açman
gerekiyor. Aynı Wi-Fi'daysanız bilgisayardan kutunun yerel IP'sine
bağlanıyorsun.

Buradan sonrası komut satırı. Ama korkutucu değil; kullanacağımız komut
sayısı bir elin parmaklarını geçmiyor.

## Dokunmadan önce bak

İlk komut silmek değil, **listelemek** olmalı:

```bash
pm list packages
```

Bu, kutuda yüklü her şeyin listesini veriyor. Bende 116 satır çıktı.

Bir de ilk iş olarak mevcut durumun fotoğrafını çektim: yüklü paketler,
kapalı olanlar, değiştireceğim ayarların eski değerleri — hepsini birer
dosyaya yazdım.

Bunu atlamanı tavsiye etmiyorum. Bir hafta sonra bir şey bozulduğunda
"neyi değiştirmiştim" sorusunun cevabı lazım oluyor. Daha da iyisi: yaptığın
her değişikliğin **geri alma komutunu** ayrı bir dosyaya yaz. Ben öyle
yaptım ve iki kere işime yaradı.

## Silmeden kaldırmak

Uygulamayı gerçekten silmek yerine şunu kullandım:

```bash
pm uninstall -k --user 0 paket.adi
```

Komutun parçalarını açayım, çünkü olayın tamamı burada:

- `--user 0` → "birincil kullanıcı için kaldır" demek. Sistemin kendi
  kopyasına dokunmuyor.
- `-k` → **uygulamanın verisini ve APK'sını diskte bırak.** Yani uygulama
  ortadan kalkıyor ama dosyası duruyor.

İkisi birleşince şu oluyor: uygulama listeden kayboluyor, belleği ve
işlemciyi kullanmayı bırakıyor, ama pişman olursan tek komutla geri geliyor:

```bash
pm install-existing paket.adi
```

Root yok, sistem bölümüne yazma yok. En kötü ihtimalle fabrika ayarlarına
dönersin ve her şey geri gelir. Bu yöntemin güzelliği bu: cesur olmana izin
veriyor.

Ben 22 paket kaldırdım. Tarayıcılar, demo uygulamaları, kullanmadığım video
servisleri, ekran koruyucu.

## Adından hiçbir şey anlaşılmayan paket

Kendime bir kural koydum: **ne işe yaradığını bilmediğim pakete dokunma.**
Kulağa fazla temkinli geliyor olabilir. Bir kere hayatımı kurtardı.

Listede şu vardı:

```
com.google.android.tv.axel
```

Adı hiçbir şey anlatmıyor. Google'ın bir şeyi, tamam da hangi şeyi? Silmeden
önce içinde ne olduğuna baktım ve şu servisi gördüm:

```
.remote.IrService
```

`Ir` = **infrared**, yani kızılötesi. Bu paket kutunun kendi kumandasını
dinleyen servis.

Silseydim kumanda çalışmayı bırakacaktı. Üstelik bunu, elimdeki tek giriş
yöntemini kaybettikten *sonra* fark edecektim.

Buradan çıkan genel ders: Android'de paket adları sana yardım etmiyor.
Bir paketi kaldırmadan önce içindeki servislere ve izinlere bakmak sıkıcı
ama gerekli. Şüphedeysen o paketi listenin en sonuna bırak — hepsini bir
gecede halletmek zorunda değilsin.

Ben dokunmadıklarımın listesini de tuttum: kumanda servisleri, Bluetooth,
klavye, donanım katmanı, Play Store altyapısı. Bunlar "belki gereksizdir"
diye kurcalanacak şeyler değil.

## Launcher nedir, neden kendim yazdım?

**Launcher**, Android'in ana ekranı. Aslında o da bir uygulama — tuşa
bastığında sistemin açtığı, "ana ekran" rolünü üstlenmiş normal bir
uygulama. Yani değiştirilebilir.

Debloat'tan sonra ana ekran hâlâ 131 MB'tı, çünkü ona dokunmamıştım. Hazır
alternatiflere baktım. Denediğim en popüler seçenek 110 MB tutuyordu. 131'den
110'a inmek için uğraşmaya değmezdi.

Sonra durup şunu sordum: benim bu ekrandan beklentim ne?

- Sık kullandığım uygulamaların bir rafta durması
- Saat
- "Tüm uygulamalar" listesi

Hepsi bu. Bunun 131 MB tutması için hiçbir sebep yok. Kendim yazmaya karar
verdim.

Baştan birkaç kural koydum:

- **Kütüphane yok.** Düz Java ve Android'in kendi arayüz bileşenleri.
  AndroidX yok, Compose yok, Gradle bile yok.
- **Ağ izni yok.** Bir ana ekranın internete çıkması için hiçbir sebep
  yok. İzni istemezsen, bir hata yapsan bile dışarı veri gidemez.
- Arka planda çalışan servis yok, açılışta başlayan bir şey yok,
  veritabanı yok, telemetri yok.

Derleme zinciri de aynı ölçüde sade. Android SDK'nın kendi araçları sırayla
çalışıyor: kaynakları paketle, Java'yı derle, Android'in anladığı biçime
çevir, hizala, imzala. Hepsi tek bir kabuk betiğinde.

Sonuç: **36 KB'lık uygulama, 25 MB bellek, boştayken %0 işlemci.**

İki küçük numara: Saat için zamanlayıcı kurmadım — Android zaten dakikada
bir "dakika değişti" sinyali yayınlıyor, onu dinlemek yetiyor. Uygulama
ikonlarını da her açılışta yeniden çizmek yerine diske kaydettim; anahtar
olarak paket adı ve sürüm numarasını kullandım, böylece uygulama
güncellenince ikon kendiliğinden tazeleniyor.

## Kutuyu kullanılamaz hâle getirdiğim an

Burası dikkatli okunası kısım, çünkü aynısını yapmanı istemem.

Yeni launcher'ı kurdum, varsayılan yaptım, eski ana ekranı kapattım.

Kutu bir kurtarma ekranına düştü ve orada kaldı.

Sebebi şu: bu cihazlarda üretici kurulum sihirbazından kalan bir paket var
ve "ana ekran" yarışında üçüncü parti bir launcher'ı yeniyor. Eski ana
ekranı kapattığım anda sistem sıradaki adayı seçti — ve o, benimki değildi.

İşin kötüsü o ekran ağ ayarlarını da sıfırlıyor. Kutu Wi-Fi'dan düştü, ADB
bağlantım koptu, elimde sadece kumanda kaldı. Wi-Fi şifresini ekran
klavyesinden harf harf girdim.

Doğru sıra şu olmalıydı:

1. Yeni launcher'ı kur
2. Varsayılan yap
3. **Ana ekran tuşuna bas ve gerçekten açıldığını gör**
4. Ancak ondan sonra eskisine dokun

Üçüncü adımı atlamak, çalışıp çalışmadığını bilmeden geri dönüş yolunu
kapatmak demek.

Bir not daha: o kurulum paketini "devre dışı bırak" komutuyla kapatamıyorsun,
izin hatası veriyor. Yukarıdaki `uninstall -k` yöntemi gerekiyor — ki o da
geri alınabilir olduğu için sorun değil.

## ADB'nin yapamadığı bir şey

Yol boyunca bir sınıra çarptım: üçüncü parti bir uygulamanın kendi içindeki
bir bileşenini ADB'den kapatamıyorsun. Sistem uygulamalarında çalışan komut,
Play Store'dan kurduğun bir uygulamada izin hatası veriyor.

Çözüm ilkel ama sağlam:

```bash
input tap 960 540
```

Bu komut ekranda o koordinata dokunuyor. Uygulamanın ayar ekranını açıp
ilgili düğmeye "parmakla basmak" gibi.

Kumanda yön tuşlarıyla gezinmeyi denedim, daha kırılgan çıktı: odak metin
alanlarına takılıyor ve o an nerede olduğunu göremiyorsun. Koordinat daha
güvenilir.

## Asıl yavaşlık RAM değilmiş

Ortaya çıkan tablo:

| | Önce | Sonra |
|---|---|---|
| Paket sayısı | 116 | 95 |
| Boştaki bellek | 614 MB | 983 MB |
| Ana ekran belleği | 131 MB | 25 MB |

Bellek neredeyse ikiye katlandı, arayüz belirgin şekilde hızlandı.

Ama merak edip gezinirken işlemciye baktım ve şunu gördüm: dört çekirdeğin
toplam kapasitesinin yalnızca **%26-35'i** kullanılıyor. Kalan çekirdekler
boş duruyor.

Yani geri kalan yavaşlığın sebebi bellek değil, **tek çekirdeğin hızı.** Bu
kutulardaki işlemci çekirdekleri güç tasarrufu için tasarlanmış, tek tek
yavaşlar. Arayüz çizmek de paralelleşen bir iş değil — dört yavaş çekirdek,
bir hızlı çekirdeğin yerini tutmuyor.

Bu ayrımı anlamak önemli, çünkü beklentini doğru kuruyor:

- **RAM kazanmak**, uygulamaların arka planda öldürülmemesini sağlıyor.
  Geri döndüğünde kaldığın yerde buluyorsun. Gerçek ve kalıcı bir kazanç.
- **Tuşa bastığında oluşan gecikme** ise donanım tavanı. Oradan alacağın
  başka bir şey yok.

Ucuz bir kutuyu hızlandırmak, onu pahalı bir kutuya çevirmiyor. Ama üstündeki
gereksiz yükü kaldırmak, cihazın hakkını vermesini sağlıyor — ve bu fark
gündelik kullanımda hissediliyor.

## Kendin denemeden önce

- **İş bitince ADB'yi kapat.** Ben dışarıdan erişilebilir mi diye test
  ettim, kutum modem arkasında ve internetten görünmüyor. Ama aynı Wi-Fi'a
  giren herkes o kapıyı bulabilir. Açık bırakırsan ağına bağlanan biri
  kutuna uygulama kurabilir.
- **Kendi uygulamanı yazdıysan imzalama anahtarını sakla.** Android her
  uygulamayı bir anahtarla imzalatıyor ve güncellemenin aynı anahtarla
  imzalanmış olmasını şart koşuyor. Anahtarı kaybedersen o uygulamayı bir
  daha güncelleyemezsin; kaldırıp baştan kurman gerekir.
- **Paket isimleri modelden modele değişir.** Bu yazıdaki listeyi başka bir
  kutuda körlemesine uygulama. Önce kendi cihazının listesini çıkar, sonra
  tanımadıklarını tek tek araştır.
- **Acele etme.** Hepsini bir gecede yapmak zorunda değilsin. Bir grup
  paketi kaldır, birkaç gün kullan, bir şey bozulmadıysa devam et. Neyin
  neyi bozduğunu ancak böyle anlarsın.
