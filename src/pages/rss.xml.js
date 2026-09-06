// ============================================================================
// /rss.xml - takip etmek isteyenler icin besleme. Taslaklar disarida kalir.
// ============================================================================
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const yazilar = (await getCollection("blog", ({ data }) => !data.taslak)).sort(
    (a, b) => b.data.tarih.getTime() - a.data.tarih.getTime()
  );

  return rss({
    title: "gokh4n.dev",
    description: "Ogrendiklerim, denediklerim, basima gelenler.",
    site: context.site,
    items: yazilar.map((y) => ({
      title: y.data.baslik,
      description: y.data.ozet,
      pubDate: y.data.tarih,
      link: `/blog/${y.id}/`,
    })),
    customData: "<language>tr</language>",
  });
}
