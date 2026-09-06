---
baslik: "Mapillary API'den rastgele konum çekmek"
tarih: 2026-09-04
ozet: "Mapillary'de rastgele fotoğraf döndüren bir uç nokta yok. Ağırlıklı bölge seçimi, bbox alan sınırı ve önden doldurulan bir havuzla çözdüm."
etiketler: ["oyun", "harita", "API"]
---

GeoGuessr benzeri bir oyun yazıyorum: oyuncu rastgele bir yere bırakılıyor,
haritada konumu tahmin ediyor, mesafeye göre puan alıyor.

Google Street View'un Street View Static API'si faturalandırma hesabı
gerektiriyor. Küçük bir proje için bunu istemedim, Mapillary'ye baktım.
Mapillary kullanıcıların yüklediği sokak fotoğraflarından oluşan açık bir
arşiv, API'si anahtarla ücretsiz kullanılabiliyor.

## Rastgele fotoğraf döndüren uç nokta yok

Mapillary Graph API'de "rastgele bir görüntü ver" diye bir çağrı yok. Tek
yapabildiğin, bir koordinat kutusu (`bbox`) verip içindeki görüntüleri
listelemek.

Rastgeleliği kendin üretmen gerekiyor. İlk yaklaşımım dünya üzerinde düzgün
dağılımlı rastgele bir enlem-boylam seçip oradan sorgu yapmaktı.

Sonuçların büyük çoğunluğu boş döndü. Yeryüzünün yaklaşık %70'i okyanus,
kalanın da önemli bir kısmında sokak fotoğrafı yok.

## Ağırlıklı bölge seçimi

Fotoğraf yoğunluğunun yüksek olduğu bölgeleri elle tanımladım: şehir
merkezleri, ana yollar, turistik alanlar. Her bölgeye bir ağırlık verdim.
Seçim önce ağırlığa göre bölgeyi, sonra bölge içinde rastgele bir nokta
belirliyor.

Boş dönüş oranı kabul edilebilir seviyeye indi.

## bbox alan sınırı

Geniş kutularla sorgu yapınca API şu yanıtı vermeye başladı:

```
HTTP 500 - reduce the amount of data
```

500 durum kodu sunucu tarafı hata gibi göründüğü için bir süre yeniden deneme
mantığı yazdım. Yanlış teşhisti. Farklı boyutlarda kutularla sistematik deneme
yapınca sınırın **bbox alanının 0.010 dereceden küçük olması** gerektiği ortaya
çıktı. Belgelerde bu sınırı bulamadım.

Yarıçapları buna göre kademelendirdim:

```js
const YARICAPLAR = [0.045, 0.015, 0.003];
```

Önce en geniş kutuyla deneniyor, sonuç boşsa daraltılıyor. Yoğun bölgelerde
alan sınırına takılmıyor, seyrek bölgelerde de tek denemede vazgeçmiyor.

## Önden doldurulan havuz

Tur geçişlerinde API yanıtını beklemek oyunu kesiyordu. Arka planda çalışan
bir doldurucu yazdım: havuz belirli bir seviyenin altına düşünce yeni konumlar
çekiliyor, oyun sırasında hazır olandan alınıyor.

Havuzda ayrıca `imageId` bazlı tekrar kontrolü var, aynı fotoğraf iki kez
çıkmıyor.

## Not

Bu tür bir oyunda "rastgele" ile kastedilen şey düzgün dağılımlı rastgelelik
değil. İstenen şey tanınabilir, birbirinden farklı ve tekrar etmeyen konumlar.
Coğrafi olarak düzgün dağılım bunun tersini üretiyor.
