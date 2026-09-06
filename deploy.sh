#!/usr/bin/env bash
# ============================================================================
# Siteyi sunucuda derleyip yayına alır.
#
# GitHub Actions bu betiği SSH üzerinden çalıştırıyor. Sunucudaki anahtar
# yalnızca bu komuta kilitli (authorized_keys içinde command="..."), yani
# Actions başka hiçbir şey çalıştıramıyor.
#
# Elle çalıştırmak gerekirse:  /srv/site-kaynak/deploy.sh
#
# Kritik nokta: build önce geçici bir klasöre yapılıyor. Derleme hata verirse
# yayındaki dist klasörüne hiç dokunulmuyor, site eski hâliyle ayakta kalıyor.
# ============================================================================
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Kod çekiliyor"
git pull --ff-only

echo "==> Bağımlılıklar"
npm ci --no-audit --no-fund

echo "==> Derleniyor"
# Ayrı klasöre derle; ancak başarılı olursa yayındakini değiştir.
rm -rf dist-yeni
npm run build -- --outDir dist-yeni

# Beklenen çıktı gerçekten oluştu mu? Boş bir klasörü yayına almayalım.
if [[ ! -f dist-yeni/index.html ]]; then
  echo "!! dist-yeni/index.html yok, yayına alınmadı." >&2
  rm -rf dist-yeni
  exit 1
fi

echo "==> Yayına alınıyor"
rm -rf dist
mv dist-yeni dist

echo "==> Bitti: $(find dist -name '*.html' | wc -l) sayfa"
