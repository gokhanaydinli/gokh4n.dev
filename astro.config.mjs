// @ts-check
import { defineConfig } from "astro/config";

// site: RSS ve kanonik adresler icin gerekli.
// build.format varsayilan ("directory"): /blog/ -> blog/index.html uretir.
// Caddy klasordeki index.html'i kendiliginden verdigi icin sunucuda ek
// ayar gerekmiyor.
export default defineConfig({
  site: "https://gokh4n.dev",

  build: {
    // CSS'i ayri dosya yerine HTML'in icine goc.
    //
    // Neden: tarayici once HTML'i aliyor, icinde CSS baglantisini gorup
    // ikinci bir istek atiyor ve o gelene kadar hicbir sey boyamiyor.
    // CSS sikistirilmis halde 2,8 KB; HTML'e gomunce o tur tamamen kalkiyor.
    //
    // Bedeli: her sayfa CSS'i kendi tasiyor, sayfalar arasi paylasilmiyor.
    // 2,8 KB icin bu takas mantikli.
    inlineStylesheets: "always",
  },
});
