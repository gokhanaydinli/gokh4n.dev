---
baslik: "Cloudflare arkasında origin IP'yi kapatmak"
tarih: 2026-09-06
ozet: "Cloudflare proxy'si açık olsa bile sunucunun IP'sine doğrudan istek atılabiliyor. ufw ile 80/443'ü sadece Cloudflare aralıklarına açtım."
etiketler: ["sunucu", "güvenlik", "cloudflare"]
---

Sunucuya Cloudflare bağladım. DNS kayıtları proxy'li, bot engelleme ve DDoS
koruması açık, ufw'de 22, 80 ve 443 dışındaki portlar kapalı.

Bir test sırasında şu komutu çalıştırdım:

```bash
curl --resolve games.gokh4n.dev:443:194.146.36.33 https://games.gokh4n.dev
```

Site açıldı, 200 döndü.

Bu komut alan adı çözümlemesini atlayıp doğrudan verilen IP'ye bağlanıyor.
Yani istek Cloudflare'e hiç uğramadı. Bot engelleme, DDoS koruması, WAF
kuralları, hiçbiri devreye girmedi.

## Neden böyle

Cloudflare proxy'si alan adına gelen trafiği süzüyor. Sunucunun IP'sine gelen
trafikle ilgisi yok. Origin sunucu 80 ve 443'ü herkese açık dinlediği sürece,
IP'yi bilen istemci doğrudan bağlanabiliyor.

IP'yi bulmak da zor değil:

- Alan adının Cloudflare'e geçmeden önceki DNS kayıtları arşiv servislerinde
  duruyor
- Sertifika şeffaflık logları alan adı ile sertifika eşleşmelerini açık tutuyor
- Sunucudan giden e-postaların `Received` başlıkları origin IP'yi içerebiliyor
- Alt alan adlarından biri proxy'siz bırakılmışsa IP oradan sızıyor

"IP'yi kimse bilmiyor" bir önlem değil.

## Çözüm

80 ve 443'ü yalnızca Cloudflare'in yayınladığı IP aralıklarına açtım:

```bash
for ip in $(curl -s https://www.cloudflare.com/ips-v4)           $(curl -s https://www.cloudflare.com/ips-v6); do
  ufw allow from "$ip" to any port 80,443 proto tcp comment 'Cloudflare'
done
```

Aynı `curl` komutu artık şunu veriyor:

```
curl: (28) Connection timed out
```

Cloudflare üzerinden gelen istekler etkilenmiyor.

## Dikkat edilecek iki nokta

**SSH kurallarına dokunma.** Sadece 80 ve 443 kısıtlanmalı. 22 numaralı port
da kapatılırsa sunucuya erişim tamamen kesilir ve sağlayıcının konsolundan
kurtarmak gerekir.

**Geri alma yolu bırak.** Bu kısıttan sonra Cloudflare proxy'sini kapatırsan
site erişilemez olur, çünkü doğrudan trafik de reddediliyor. Kuralları
kaldıran komutu aynı betiğe bir parametre olarak ekledim.

## Sertifika yenilemesi

Caddy sertifikaları Let's Encrypt'ten HTTP-01 doğrulamasıyla alıyor. Doğrulama
isteği alan adına gidiyor, yani Cloudflare üzerinden geçiyor ve bu kısıttan
etkilenmiyor. Ama origin'i doğrudan doğrulamaya çalışan bir yapılandırma
kullanıyorsan bunu kontrol et.
