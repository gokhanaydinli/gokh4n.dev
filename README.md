# gokh4n.dev

Kişisel site ve blog. [gokh4n.dev](https://gokh4n.dev)

Astro ile derlenen statik bir site: çalışma anında sunucuda bir şey koşmuyor,
Caddy hazır HTML dosyalarını diskten veriyor. Tarayıcıya framework JavaScript'i
inmiyor; sayfadaki tek betik tema seçici, saat ve ölçüm şeridi için.

## Yazı yazmak

`src/content/blog/` içine bir Markdown dosyası. Dosya adı adresi belirler:
`ilk-yazi.md` → `/blog/ilk-yazi/`

```markdown
---
baslik: "Yazının başlığı"
tarih: 2026-09-08
ozet: "Listede ve yazının üstünde görünen bir-iki cümle."
etiketler: ["sunucu", "API"]
taslak: true
---

Buradan sonrası düz yazı.
```

`taslak: true` olan yazı hiçbir yerde görünmez. Başlık, tarih veya özet
eksikse derleme hata verir — bozuk bir yazı yayına çıkamaz.

Etiketleri İngilizceyse büyük harfle yaz (`API`, `SQLITE`). Ekranda büyük
harfe çevriliyor ve sayfa dili Türkçe olduğu için "api" → "APİ" oluyor.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ üretir
```

## Yayına alma

`main` dalına push → GitHub Actions sunucuda derleyip yayına alır. Yaklaşık
30 saniye. Elle bir şey yapmak gerekmiyor.

Günlük iş `development` dalında yürür, hazır olunca `main`'e alınır.

Derleme sunucuda ayrı bir klasöre yapılıp başarılıysa yayındakiyle
değiştiriliyor — derleme patlarsa site eski hâliyle ayakta kalır.

## Sunucu düzeni

```
/srv/site-kaynak          kaynak (git klonu) + node_modules
/srv/site-kaynak/dist     Caddy'nin sunduğu derleme çıktısı
/srv/site-kaynak/deploy.sh  git pull + npm ci + build + yayına alma
```

Alan adı Cloudflare arkasında; HTML kenarda önbellekleniyor, statik dosyalar
bir yıl. Sertifikayı Caddy kendi alıp yeniliyor.

## Yapı

```
astro.config.mjs          site adresi, CSS'i HTML'e gömme ayarı
src/layouts/Temel.astro   ortak kabuk: head, künye, menü, şeritler
src/styles/global.css     tek stil dosyası (tasarım belirteçleri + bileşenler)
src/pages/
  index.astro             çalışmalar dizini
  blog/index.astro        yazı listesi
  blog/[slug].astro       yazı sayfası
  rss.xml.js              besleme
src/content/blog/         yazılar (Markdown)
src/content.config.ts     yazı şeması — eksik alan derlemeyi durdurur
```

Menüye bağlantı eklemek, tema rengini değiştirmek ya da bir şerit kaldırmak
tek dosyada değişiklik demek: `Temel.astro`.
