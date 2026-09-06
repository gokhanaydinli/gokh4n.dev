# gokh4n.dev

Kişisel açılış sayfası. Tek dosya, statik HTML — build yok, bağımlılık yok.

## Yayına alma

Sunucuda `/srv/site` klasörüne klonlu. Caddy dosyaları doğrudan diskten
sunuyor, o yüzden güncellemek için tek komut yeterli:

```bash
cd /srv/site && git pull
```

Yeniden başlatma ya da build gerekmez; değişiklik anında yayında.

## Yerelde bakmak

`index.html` dosyasını tarayıcıda aç. Sunucu çalıştırmaya gerek yok.
