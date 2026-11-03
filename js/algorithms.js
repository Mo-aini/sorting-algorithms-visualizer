/*
 * Sorting algorithms written as generator functions.
 * Each algorithm sorts the array IN PLACE and yields a "step" object every
 * time it compares, swaps or writes, so the visualizer can animate it.
 *
 * Step types:
 *   { type: "compare", i, j }       two indices are being compared
 *   { type: "swap", i, j }          a[i] and a[j] were swapped
 *   { type: "overwrite", i, value } a[i] was set to value (merge sort)
 *   { type: "pivot", i }            current pivot (quick sort)
 *   { type: "sorted", i }           index i is in its final position
 */

function* bubbleSort(a) {
  const n = a.length;
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - pass; j++) {
      yield { type: "compare", i: j, j: j + 1 };
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        yield { type: "swap", i: j, j: j + 1 };
      }
    }
    yield { type: "sorted", i: n - 1 - pass };
    if (!swapped) break; // already sorted -> best case O(n)
  }
  for (let k = 0; k < n; k++) yield { type: "sorted", i: k };
}

function* selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: "compare", i: min, j };
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      yield { type: "swap", i, j: min };
    }
    yield { type: "sorted", i };
  }
  if (n) yield { type: "sorted", i: n - 1 };
}

function* insertionSort(a) {
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      yield { type: "compare", i: j - 1, j };
      if (a[j - 1] <= a[j]) break;
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      yield { type: "swap", i: j - 1, j };
      j--;
    }
  }
  for (let k = 0; k < n; k++) yield { type: "sorted", i: k };
}

function* mergeSort(a) {
  const aux = new Array(a.length);
  function* sort(lo, hi) {
    if (hi - lo < 1) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* sort(lo, mid);
    yield* sort(mid + 1, hi);
    for (let k = lo; k <= hi; k++) aux[k] = a[k];
    let i = lo, j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      if (i > mid) a[k] = aux[j++];
      else if (j > hi) a[k] = aux[i++];
      else {
        yield { type: "compare", i, j };
        // on a tie we take from the LEFT half, which keeps the sort stable
        a[k] = aux[j] < aux[i] ? aux[j++] : aux[i++];
      }
      yield { type: "overwrite", i: k, value: a[k] };
    }
  }
  yield* sort(0, a.length - 1);
  for (let k = 0; k < a.length; k++) yield { type: "sorted", i: k };
}

function* quickSort(a) {
  // Lomuto partition with median-of-three pivot choice (avoids O(n^2) on sorted input).
  function* partition(lo, hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (a[mid] < a[lo]) { [a[mid], a[lo]] = [a[lo], a[mid]]; yield { type: "swap", i: lo, j: mid }; }
    if (a[hi] < a[lo]) { [a[hi], a[lo]] = [a[lo], a[hi]]; yield { type: "swap", i: lo, j: hi }; }
    if (a[mid] < a[hi]) { [a[mid], a[hi]] = [a[hi], a[mid]]; yield { type: "swap", i: mid, j: hi }; }
    const pivot = a[hi];
    yield { type: "pivot", i: hi };
    let i = lo;
    for (let j = lo; j < hi; j++) {
      yield { type: "compare", i: j, j: hi };
      if (a[j] < pivot) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          yield { type: "swap", i, j };
        }
        i++;
      }
    }
    if (i !== hi) {
      [a[i], a[hi]] = [a[hi], a[i]];
      yield { type: "swap", i, j: hi };
    }
    return i;
  }
  function* sort(lo, hi) {
    if (lo > hi) return;
    if (lo === hi) { yield { type: "sorted", i: lo }; return; }
    const p = yield* partition(lo, hi);
    yield { type: "sorted", i: p };
    yield* sort(lo, p - 1);
    yield* sort(p + 1, hi);
  }
  yield* sort(0, a.length - 1);
}

function* heapSort(a) {
  const n = a.length;
  function* siftDown(start, end) {
    let root = start;
    while (2 * root + 1 <= end) {
      let child = 2 * root + 1;
      if (child + 1 <= end) {
        yield { type: "compare", i: child, j: child + 1 };
        if (a[child] < a[child + 1]) child++;
      }
      yield { type: "compare", i: root, j: child };
      if (a[root] < a[child]) {
        [a[root], a[child]] = [a[child], a[root]];
        yield { type: "swap", i: root, j: child };
        root = child;
      } else return;
    }
  }
  for (let start = Math.floor(n / 2) - 1; start >= 0; start--) yield* siftDown(start, n - 1);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    yield { type: "swap", i: 0, j: end };
    yield { type: "sorted", i: end };
    yield* siftDown(0, end - 1);
  }
  if (n) yield { type: "sorted", i: 0 };
}

const ALGORITHMS = {
  bubble: { name: "Bubble Sort", fn: bubbleSort },
  selection: { name: "Selection Sort", fn: selectionSort },
  insertion: { name: "Insertion Sort", fn: insertionSort },
  merge: { name: "Merge Sort", fn: mergeSort },
  quick: { name: "Quick Sort", fn: quickSort },
  heap: { name: "Heap Sort", fn: heapSort },
};

/** Runs an algorithm to the end and counts its operations (no animation). */
function countOperations(key, input) {
  const a = input.slice();
  let comparisons = 0, swaps = 0, writes = 0;
  for (const step of ALGORITHMS[key].fn(a)) {
    if (step.type === "compare") comparisons++;
    else if (step.type === "swap") swaps++;
    else if (step.type === "overwrite") writes++;
  }
  return { sorted: a, comparisons, swaps, writes };
}

// Works in the browser (global) and in Node (module.exports) for the tests.
if (typeof module !== "undefined") module.exports = { ALGORITHMS, countOperations };
