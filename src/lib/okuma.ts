// ============================================================================
// Okuma süresi — yazı listesinde ve yazının üstünde görünen "N dk".
//
// Ham Markdown'daki kelimeler sayılıyor. Kod blokları da sayıya giriyor:
// rehber tipi yazılarda komutlar okunuyor, atlanmıyor.
//
// Dakikada 180 kelime: Türkçe eklemeli bir dil, kelimeler İngilizceden uzun;
// İngilizce için kullanılan 200–230 Türkçede süreyi az gösteriyordu.
// ============================================================================

const DAKIKADA_KELIME = 180;

export function okumaSuresi(metin: string | undefined): number {
  if (!metin) return 1;
  const kelime = metin.split(/\s+/).filter((k) => /[\p{L}\p{N}]/u.test(k)).length;
  return Math.max(1, Math.round(kelime / DAKIKADA_KELIME));
}
