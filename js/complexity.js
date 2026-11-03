// Information panel content for each algorithm.
const COMPLEXITY = {
  bubble: {
    best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)", stable: true, inPlace: true,
    description:
      "Repeatedly steps through the list, compares neighbours and swaps them if they are in the wrong order. After each pass the largest remaining value has \"bubbled\" to the end. Stops early when a pass makes no swaps.",
    useWhen: "Teaching, or tiny / nearly-sorted arrays.",
  },
  selection: {
    best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)", stable: false, inPlace: true,
    description:
      "Finds the minimum of the unsorted part and swaps it into place. Always makes about n²/2 comparisons but at most n − 1 swaps.",
    useWhen: "When writes/swaps are expensive compared to reads.",
  },
  insertion: {
    best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)", stable: true, inPlace: true,
    description:
      "Builds the sorted part one element at a time by sliding each new element left until it fits — like sorting playing cards in your hand.",
    useWhen: "Small or nearly-sorted data; also used inside hybrid sorts (TimSort, introsort).",
  },
  merge: {
    best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", stable: true, inPlace: false,
    description:
      "Divide and conquer: split the array in half, sort each half recursively, then merge the two sorted halves using an auxiliary array.",
    useWhen: "Guaranteed n log n, stable sorting, linked lists and external sorting.",
  },
  quick: {
    best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)", stable: false, inPlace: true,
    description:
      "Picks a pivot (median of three here), partitions the array so smaller values go left and larger go right, then sorts both sides recursively.",
    useWhen: "General-purpose in-memory sorting; usually the fastest in practice.",
  },
  heap: {
    best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)", stable: false, inPlace: true,
    description:
      "Builds a max-heap from the array, then repeatedly moves the root (maximum) to the end and restores the heap with sift-down.",
    useWhen: "When you need n log n worst case with O(1) extra memory.",
  },
};
