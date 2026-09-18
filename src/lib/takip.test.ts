// ============================================================================
// Ayrıştırma ve karşılaştırma testleri.
//
// Bu iki fonksiyon aracın tamamı: biri Instagram'ın JSON şeklini okuyor,
// diğeri iki anlık görüntüyü karşılaştırıyor. İkisi de saf — ne ağ, ne DOM,
// ne depolama. Yanlış çalıştıklarında ekranda "kimse çıkmamış" yazar ve bunu
// gözle fark etmek imkânsızdır; test edilecek yer tam olarak burası.
// ============================================================================

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  dosyaTuru,
  fark,
  geriTakipEtmeyenler,
  hesaplariCikar,
  karsilastir,
  takipEtmedigimTakipciler,
  type AnlikGoruntu,
} from "./takip";

/** Export'taki tek kaydın gerçek şekli. */
function kayit(kullanici: string, zaman = 1_700_000_000) {
  return {
    title: "",
    media_list_data: [],
    string_list_data: [
      {
        href: `https://www.instagram.com/${kullanici}`,
        value: kullanici,
        timestamp: zaman,
      },
    ],
  };
}

function goruntu(
  takipci: string[],
  takipEdilen: string[],
  tarih = 0
): AnlikGoruntu {
  return { tarih, takipci, takipEdilen };
}

describe("dosyaTuru", () => {
  it("takipçi ve takip edilen dosyalarını tanır", () => {
    assert.equal(dosyaTuru("connections/followers_and_following/followers_1.json"), "takipci");
    assert.equal(dosyaTuru("followers.json"), "takipci");
    assert.equal(dosyaTuru("connections/followers_and_following/following.json"), "takip-edilen");
  });

  it("büyük hesaplarda parçalanmış takipçi dosyalarını da tanır", () => {
    for (const n of [1, 2, 7, 12]) {
      assert.equal(dosyaTuru(`followers_${n}.json`), "takipci", `followers_${n}`);
    }
  });

  it("aynı klasördeki DİĞER dosyalara bulaşmaz", () => {
    // Bunlar listeye karışsa sayılar sessizce bozulurdu.
    const karismamali = [
      "connections/followers_and_following/recently_unfollowed_profiles.json",
      "connections/followers_and_following/pending_follow_requests.json",
      "connections/followers_and_following/close_friends.json",
      "connections/followers_and_following/blocked_profiles.json",
      "connections/followers_and_following/follow_requests_you've_received.json",
      "media/posts_1.json",
    ];
    for (const yol of karismamali) {
      assert.equal(dosyaTuru(yol), null, yol);
    }
  });

  it("büyük/küçük harf ve yol farkı takılmıyor", () => {
    assert.equal(dosyaTuru("SOME/PATH/Followers_1.JSON"), "takipci");
  });
});

describe("hesaplariCikar", () => {
  it("dizi biçimini okur (followers_1.json)", () => {
    const hesaplar = hesaplariCikar([kayit("ayse"), kayit("mehmet")]);

    assert.deepEqual(
      hesaplar.map((h) => h.kullanici),
      ["ayse", "mehmet"]
    );
    assert.equal(hesaplar[0].adres, "https://www.instagram.com/ayse");
    assert.equal(hesaplar[0].zaman, 1_700_000_000);
  });

  it("nesne biçimini okur (following.json)", () => {
    const hesaplar = hesaplariCikar({
      relationships_following: [kayit("zeynep")],
    });

    assert.deepEqual(hesaplar.map((h) => h.kullanici), ["zeynep"]);
  });

  it("alan adı değişse bile içindeki diziyi bulur", () => {
    // Instagram bu alanın adını geçmişte değiştirdi; ada bağlanmıyoruz.
    const hesaplar = hesaplariCikar({ bambaska_bir_ad: [kayit("kerem")] });
    assert.deepEqual(hesaplar.map((h) => h.kullanici), ["kerem"]);
  });

  it("kullanıcı adını küçük harfe indirger", () => {
    const hesaplar = hesaplariCikar([kayit("AyseYilmaz")]);
    assert.equal(hesaplar[0].kullanici, "ayseyilmaz");
  });

  it("value boşsa title'a düşer", () => {
    const bozuk = {
      title: "yedekhesap",
      media_list_data: [],
      string_list_data: [{ href: "", value: "", timestamp: 0 }],
    };
    assert.deepEqual(hesaplariCikar([bozuk]).map((h) => h.kullanici), ["yedekhesap"]);
  });

  it("tekrarlayan kayıtları bir kez sayar", () => {
    const hesaplar = hesaplariCikar([kayit("ayse"), kayit("AYSE"), kayit("ayse")]);
    assert.equal(hesaplar.length, 1);
  });

  it("boş ve bozuk girdilerde çökmez", () => {
    assert.deepEqual(hesaplariCikar([]), []);
    assert.deepEqual(hesaplariCikar(null), []);
    assert.deepEqual(hesaplariCikar("metin"), []);
    assert.deepEqual(hesaplariCikar({}), []);
    assert.deepEqual(hesaplariCikar([null, 42, {}, { string_list_data: [] }]), []);
  });
});

describe("tek export analizleri", () => {
  const g = goruntu(["ayse", "mehmet"], ["mehmet", "zeynep"]);

  it("geri takip etmeyenleri bulur", () => {
    // zeynep'i takip ediyorum, o beni etmiyor.
    assert.deepEqual(geriTakipEtmeyenler(g), ["zeynep"]);
  });

  it("takip etmediğim takipçileri bulur", () => {
    assert.deepEqual(takipEtmedigimTakipciler(g), ["ayse"]);
  });
});

describe("karsilastir", () => {
  const onceki = goruntu(["ayse", "mehmet", "kerem"], ["ayse", "zeynep"], 1);
  const simdiki = goruntu(["mehmet", "kerem", "burak"], ["ayse", "deniz"], 2);

  it("takipten çıkanları bulur — aracın asıl sorusu", () => {
    assert.deepEqual(karsilastir(onceki, simdiki).cikanlar, ["ayse"]);
  });

  it("yeni takipçileri bulur", () => {
    assert.deepEqual(karsilastir(onceki, simdiki).yeniTakipciler, ["burak"]);
  });

  it("senin bıraktıklarını ve yeni takip ettiklerini ayırır", () => {
    const k = karsilastir(onceki, simdiki);
    assert.deepEqual(k.biraktiklarin, ["zeynep"]);
    assert.deepEqual(k.yeniTakipEttiklerin, ["deniz"]);
  });

  it("değişiklik yoksa hepsi boş", () => {
    const k = karsilastir(onceki, onceki);
    assert.deepEqual(k.cikanlar, []);
    assert.deepEqual(k.yeniTakipciler, []);
    assert.deepEqual(k.biraktiklarin, []);
    assert.deepEqual(k.yeniTakipEttiklerin, []);
  });

  it("sıra ters verilirse sonuç da ters olur (çağıran dikkat etmeli)", () => {
    const ters = karsilastir(simdiki, onceki);
    assert.deepEqual(ters.cikanlar, ["burak"]);
  });
});

describe("fark", () => {
  it("alfabetik sıralar", () => {
    assert.deepEqual(fark(["zeynep", "ayse", "mehmet"], []), ["ayse", "mehmet", "zeynep"]);
  });

  it("boş listelerle çalışır", () => {
    assert.deepEqual(fark([], ["ayse"]), []);
    assert.deepEqual(fark(["ayse"], []), ["ayse"]);
  });
});
