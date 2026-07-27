"use strict";
// 誕生日のパラドックスの品質ゲート:  node birthday.test.js
const B = require("./birthday.js");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name + (extra ? " — " + extra : "")); }
  else { fail++; console.log("  ✗ " + name + (extra ? " — " + extra : "")); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

console.log("\n[理論値：教科書の数字と合うか]");
{
  // 広く知られている値と突き合わせる
  ok("23人で50%を超える", B.probAtLeastOnePair(23) > 0.5, B.fmtPct(B.probAtLeastOnePair(23)));
  ok("22人ではまだ50%未満", B.probAtLeastOnePair(22) < 0.5, B.fmtPct(B.probAtLeastOnePair(22)));
  ok("50%を初めて超えるのは23人", B.peopleNeededFor(0.5) === 23, String(B.peopleNeededFor(0.5)));
  ok("23人はおよそ50.7%", near(B.probAtLeastOnePair(23), 0.5073, 0.0005), B.fmtPct(B.probAtLeastOnePair(23)));
  ok("30人はおよそ70.6%", near(B.probAtLeastOnePair(30), 0.7063, 0.0005), B.fmtPct(B.probAtLeastOnePair(30)));
  ok("50人はおよそ97.0%", near(B.probAtLeastOnePair(50), 0.9704, 0.0005), B.fmtPct(B.probAtLeastOnePair(50)));
  ok("70人はおよそ99.9%", near(B.probAtLeastOnePair(70), 0.9992, 0.0005), B.fmtPct(B.probAtLeastOnePair(70)));
  ok("99%を超えるのは57人", B.peopleNeededFor(0.99) === 57, String(B.peopleNeededFor(0.99)));
}

console.log("\n[端と極限]");
{
  ok("0人・1人は0%", B.probAtLeastOnePair(0) === 0 && B.probAtLeastOnePair(1) === 0);
  ok("2人は 1/365", near(B.probAtLeastOnePair(2), 1 / 365, 1e-12), B.probAtLeastOnePair(2).toFixed(6));
  ok("366人なら必ず被る（鳩の巣原理）", B.probAtLeastOnePair(366) === 1);
  // 365人でも数学的には1未満（全員バラバラの確率は 365!/365^365 ≒ 1.45e-157）。
  // ただし倍精度では 1 - 1.45e-157 が 1 に丸まるので、コード上は 1 になる。
  // これは実装の誤りではなく、浮動小数点の刻み（eps ≒ 2.2e-16）の限界。
  ok("365人は数学的には1未満だが倍精度では1に丸まる（承知のうえ）",
     B.probAtLeastOnePair(365) === 1 && Math.exp(
       Array.from({length:365},(_,i)=>Math.log((365-i)/365)).reduce((a,b)=>a+b,0)) > 0,
     "全員バラバラの確率 ≒ 1.45e-157");
  let mono = true, prev = -1;
  for (let n = 0; n <= 80; n++) { const p = B.probAtLeastOnePair(n); if (p < prev) mono = false; prev = p; }
  ok("人数が増えて確率が下がることはない", mono);
  ok("確率は必ず0〜1に収まる", (() => {
    for (let n = 0; n <= 400; n++) { const p = B.probAtLeastOnePair(n); if (p < 0 || p > 1 || !isFinite(p)) return false; }
    return true; })());
}

console.log("\n[「自分と同じ誕生日」との違い（ここが誤解の正体）]");
{
  const you23 = B.probSomeoneMatchesYou(23);
  ok("23人いても自分と同じ誕生日は約6.1%", near(you23, 0.0611, 0.0005), B.fmtPct(you23));
  ok("ペアの確率のほうがずっと大きい", B.probAtLeastOnePair(23) > you23 * 8,
     B.fmtPct(B.probAtLeastOnePair(23)) + " vs " + B.fmtPct(you23));
  ok("自分と同じが50%を超えるには253人必要",
     B.probSomeoneMatchesYou(252) < 0.5 && B.probSomeoneMatchesYou(253) >= 0.5,
     "253人で " + B.fmtPct(B.probSomeoneMatchesYou(253)));
  ok("0人なら0%", B.probSomeoneMatchesYou(0) === 0);
}

console.log("\n[シミュレーション：理論値に寄るか]");
{
  const rng = B.mulberry(20260727);
  for (const n of [10, 23, 30, 50]) {
    const s = B.simulate(n, 20000, rng);
    const th = B.probAtLeastOnePair(n);
    ok(`${n}人 × 2万部屋が理論値±1.5ポイント`, Math.abs(s.rate - th) < 0.015,
       `実測 ${B.fmtPct(s.rate)} / 理論 ${B.fmtPct(th)}`);
  }
  const r2 = B.mulberry(1);
  const a = B.simulate(23, 5000, B.mulberry(1));
  const b = B.simulate(23, 5000, B.mulberry(1));
  ok("同じ種なら同じ結果（決定論）", a.hit === b.hit, "hit=" + a.hit);
  const c = B.simulate(23, 5000, B.mulberry(2));
  ok("別の種なら別の結果", a.hit !== c.hit, a.hit + " vs " + c.hit);
  ok("部屋0なら0で割らない", B.simulate(23, 0, r2).rate === 0);
  ok("1人だけの部屋は絶対に被らない", B.simulate(1, 500, r2).hit === 0);
  ok("366人の部屋は必ず被る", B.simulate(366, 200, r2).hit === 200);
}

console.log("\n[画面で使う例]");
{
  ok("例に23人が含まれる", B.EXAMPLES.some(e => e.n === 23));
  ok("例は人数の昇順", B.EXAMPLES.every((e, i, a) => i === 0 || a[i - 1].n < e.n));
  ok("パーセント表記", B.fmtPct(0.5073) === "50.7%", B.fmtPct(0.5073));
}

console.log("\n" + (fail === 0 ? "✅ " : "❌ ") + pass + " PASS / " + fail + " FAIL\n");
process.exit(fail === 0 ? 0 : 1);
