"use strict";
// ============================================================================
// 誕生日のパラドックス : 純ロジック層（DOM を使わない。node からも読める）
// ----------------------------------------------------------------------------
// 「何人集まれば、同じ誕生日のペアが50%の確率でいるか」
// 答えは23人。ここでは理論値と、実際に人を集めてみた結果の両方を出す。
// ============================================================================
(function (root) {

  const DAYS = 365;   // うるう年は扱わない（2月29日は除外）。画面にも明記する。

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- 理論値 ----
  // 「全員バラバラ」の確率 = 365/365 × 364/365 × … を掛けていき、1から引く。
  // 掛け算をそのまま回すと桁が飛ぶので、対数で足す。
  function probAtLeastOnePair(n, days) {
    const D = days || DAYS;
    if (n <= 1) return 0;
    if (n > D) return 1;            // 鳩の巣原理。人数が日数を超えたら必ず被る
    let logAllDifferent = 0;
    for (let i = 0; i < n; i++) logAllDifferent += Math.log((D - i) / D);
    return 1 - Math.exp(logAllDifferent);
  }

  // 確率が target を初めて超える人数
  function peopleNeededFor(target, days) {
    const D = days || DAYS;
    for (let n = 1; n <= D + 1; n++) if (probAtLeastOnePair(n, D) >= target) return n;
    return D + 1;
  }

  // ---- 「自分と同じ誕生日の人がいる確率」（よく混同されるほう） ----
  // こちらは n 人いても 1-(364/365)^n で、ぜんぜん増えない。
  function probSomeoneMatchesYou(n, days) {
    const D = days || DAYS;
    if (n <= 0) return 0;
    return 1 - Math.pow((D - 1) / D, n);
  }

  // ---- 実際に部屋を作ってみる ----
  // 1部屋 = n人。誕生日を引いて、同じ日が2人以上いたら「あり」。
  function runOneRoom(n, rng, days) {
    const D = days || DAYS;
    const seen = new Uint8Array(D);
    for (let i = 0; i < n; i++) {
      const d = Math.floor(rng() * D);
      if (seen[d]) return true;
      seen[d] = 1;
    }
    return false;
  }
  // rooms 部屋ぶん試して、被った部屋の割合を返す
  function simulate(n, rooms, rng, days) {
    let hit = 0;
    for (let r = 0; r < rooms; r++) if (runOneRoom(n, rng, days)) hit++;
    return { rooms, hit, rate: rooms > 0 ? hit / rooms : 0 };
  }

  // ---- 身近な人数の例（画面で使う） ----
  const EXAMPLES = [
    { n: 4,  label: "家族4人" },
    { n: 11, label: "サッカーの先発11人" },
    { n: 23, label: "この問題の答え・23人" },
    { n: 30, label: "学校のクラス30人" },
    { n: 40, label: "少し多いクラス40人" },
    { n: 57, label: "57人" },
    { n: 70, label: "70人" }
  ];

  function fmtPct(p) { return (p * 100).toFixed(1) + "%"; }

  const api = { DAYS, mulberry, probAtLeastOnePair, peopleNeededFor, probSomeoneMatchesYou,
                runOneRoom, simulate, EXAMPLES, fmtPct };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BD = api;
})(typeof window !== "undefined" ? window : globalThis);
