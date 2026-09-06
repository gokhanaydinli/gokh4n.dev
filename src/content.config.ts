// ============================================================================
// Blog koleksiyonu.
//
// Yazilar src/content/blog/ altinda Markdown dosyalari. Her dosyanin
// basindaki "frontmatter" blogu asagidaki semaya uymak zorunda; uymazsa
// derleme hata verir. Yani eksik baslikla ya da bozuk tarihle yayina
// cikamiyorsun.
//
// Dosya adi adresi belirler:  ilk-yazi.md  ->  /blog/ilk-yazi
// ============================================================================
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    baslik: z.string(),
    tarih: z.coerce.date(),
    ozet: z.string(),
    /**
     * Konu etiketleri; listede ve yazinin basinda gorunur.
     *
     * DIKKAT: Etiketler ekranda CSS ile buyuk harfe cevriliyor ve sayfa dili
     * Turkce oldugu icin "i" harfi "İ" oluyor. Turkce kelimelerde dogru
     * ("harita" -> "HARITA" degil, "HARİTA"), ama Ingilizce kelimelerde
     * bozuk: "api" -> "APİ", "sqlite" -> "SQLİTE".
     *
     * Bu yuzden Ingilizce etiketleri BUYUK HARFLE yaz: "API", "SQLITE",
     * "CSS". Boyle yazilinca donusum onlari degistiremiyor.
     * Turkce etiketler kucuk kalabilir: "sunucu", "guvenlik".
     */
    etiketler: z.array(z.string()).default([]),
    /** true ise listelerde ve RSS'te gorunmez. Yarim kalanlar icin. */
    taslak: z.boolean().default(false),
  }),
});

export const collections = { blog };
