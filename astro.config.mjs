// @ts-check
import { defineConfig } from "astro/config";

// site: RSS ve kanonik adresler icin gerekli.
// build.format varsayilan ("directory"): /blog/ -> blog/index.html uretir.
// Caddy klasordeki index.html'i kendiliginden verdigi icin sunucuda ek
// ayar gerekmiyor.
export default defineConfig({
  site: "https://gokh4n.dev",
});
