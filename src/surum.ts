// ============================================================================
// Yayındaki sürüm bilgisi.
//
// Değerler DERLEME ANINDA okunuyor ve HTML'e gömülüyor; ziyaretçi tarafında
// hiçbir istek yapılmıyor. Bu dosya yalnızca layout'un frontmatter'ından
// import ediliyor, yani sunucu tarafında kalıyor — `node:child_process`
// tarayıcı paketine sızmıyor.
//
// Git yoksa (ör. arşivden açılmış bir kopya) sessizce boş dönüyor ve şerit
// o satırı hiç göstermiyor.
// ============================================================================

import { execSync } from "node:child_process";

function git(komut: string): string | null {
  try {
    return execSync(komut, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const kisa = git("git rev-parse --short HEAD");
const zamanIso = git("git log -1 --format=%cI");
const uzak = git("git config --get remote.origin.url");

/** Uzak adresten "kullanici/repo" çıkar; commit bağlantısı için. */
function repoYolu(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
  return m ? m[1] : null;
}

const yol = repoYolu(uzak);

export const SURUM = {
  /** Kısa commit özeti, ör. "a3f9c21". */
  commit: kisa,
  /** Commit tarihi (ISO). İstemci "2 sa önce" diye biçimlendiriyor. */
  zaman: zamanIso,
  /** GitHub'daki commit adresi; yoksa null. */
  adres: kisa && yol ? `https://github.com/${yol}/commit/${kisa}` : null,
};
