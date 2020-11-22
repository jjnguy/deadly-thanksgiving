function nCr(n: number, r: number): number {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

let memory = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000];
function factorial(n: number): number {
  if (n < 0) return 0;
  if (n < memory.length) return memory[n];
  let result = factorial(n - 1) * n;
  memory[n] = result;
  return result;
}

function nWiseArray<T>(n, array: Array<T>): Array<Array<T>> {
  if (array.length < n) throw 'array not long enough';
  if (n == array.length) return [array];
  if (n == 1) return array.map(it => [it]);

  let all = [];

  for (let i = 0; i <= array.length - n; i++) {
    all = all.concat(nWiseArray(n - 1, array.slice(i + 1)).map(item => [array[i], ...item]));
  }

  return all;
}

export { nCr, factorial, nWiseArray }