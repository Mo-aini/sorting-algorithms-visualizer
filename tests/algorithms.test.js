// Run with: npm test   (or: node --test)   — Node 18+, no dependencies
const test = require("node:test");
const assert = require("node:assert/strict");
const { ALGORITHMS, countOperations } = require("../js/algorithms.js");

function randomArray(n, seed) {
  let x = seed;
  return Array.from({ length: n }, () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return 5 + (x % 96);
  });
}

const cases = {
  empty: [],
  single: [42],
  two: [9, 3],
  sorted: [1, 2, 3, 4, 5, 6, 7, 8],
  reversed: [8, 7, 6, 5, 4, 3, 2, 1],
  duplicates: [5, 1, 5, 3, 1, 5, 3, 3],
  random50: randomArray(50, 7),
  random150: randomArray(150, 99),
};

for (const key of Object.keys(ALGORITHMS)) {
  test(`${ALGORITHMS[key].name} sorts every test case`, () => {
    for (const [name, input] of Object.entries(cases)) {
      const expected = input.slice().sort((a, b) => a - b);
      assert.deepEqual(countOperations(key, input).sorted, expected, `${key} failed on ${name}`);
    }
  });

  test(`${ALGORITHMS[key].name} only reports valid indices`, () => {
    const a = randomArray(30, 3);
    for (const s of ALGORITHMS[key].fn(a)) {
      for (const idx of [s.i, s.j].filter((v) => v !== undefined)) {
        assert.ok(Number.isInteger(idx) && idx >= 0 && idx < 30, `${key} step ${JSON.stringify(s)}`);
      }
    }
  });
}

test("bubble and insertion sort are O(n) on already sorted input", () => {
  const sorted = Array.from({ length: 100 }, (_, i) => i);
  assert.equal(countOperations("bubble", sorted).comparisons, 99);
  assert.equal(countOperations("insertion", sorted).comparisons, 99);
});

test("selection sort always makes n(n-1)/2 comparisons", () => {
  assert.equal(countOperations("selection", randomArray(40, 1)).comparisons, (40 * 39) / 2);
});

test("n log n algorithms beat n^2 algorithms on random data", () => {
  const a = randomArray(150, 5);
  const merge = countOperations("merge", a).comparisons;
  const insertion = countOperations("insertion", a).comparisons;
  assert.ok(merge < insertion / 3, `merge ${merge} vs insertion ${insertion}`);
});

test("merge sort is stable", () => {
  // Sort objects by key using the same comparison logic through valueOf.
  const items = [3, 1, 3, 2, 1].map((k, idx) => ({ k, idx, valueOf() { return this.k; } }));
  const out = countOperations("merge", items).sorted;
  const ones = out.filter((o) => o.k === 1).map((o) => o.idx);
  const threes = out.filter((o) => o.k === 3).map((o) => o.idx);
  assert.deepEqual(ones, [1, 4]);
  assert.deepEqual(threes, [0, 2]);
});
