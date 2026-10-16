/** Small, dependency-free matrix helpers. Inputs are never mutated. */
export type Matrix = readonly (readonly number[])[];
const TOLERANCE = 1e-12;

function symmetricCopy(matrix: Matrix): number[][] {
  const n = matrix.length;
  if (!n || matrix.some(row => row.length !== n || row.some(x => !Number.isFinite(x)))) {
    throw new RangeError('Matrix must be nonempty, square and finite');
  }
  const scale = Math.max(...matrix.flatMap(row => row.map(Math.abs)));
  if (matrix.some((row, i) => row.some((x, j) => Math.abs(x - matrix[j][i]) > TOLERANCE * scale))) {
    throw new RangeError('Matrix must be symmetric');
  }
  return matrix.map((row, i) => row.map((x, j) => scale ? (x / scale + matrix[j][i] / scale) / 2 : 0));
}

/** PSD means every portfolio variance is nonnegative; singular matrices are allowed. */
export function isPositiveSemidefinite(matrix: Matrix): boolean {
  const a = symmetricCopy(matrix);
  // Symmetric pivoted elimination: a zero diagonal requires a zero remaining block.
  for (let k = 0; k < a.length; k++) {
    let pivot = k;
    for (let i = k + 1; i < a.length; i++) if (a[i][i] > a[pivot][pivot]) pivot = i;
    [a[k], a[pivot]] = [a[pivot], a[k]];
    for (const row of a) [row[k], row[pivot]] = [row[pivot], row[k]];
    if (a[k][k] < -TOLERANCE) return false;
    if (a[k][k] <= TOLERANCE) {
      return a.slice(k).every(row => row.slice(k).every(x => Math.abs(x) <= TOLERANCE));
    }
    for (let i = k + 1; i < a.length; i++) {
      for (let j = i; j < a.length; j++) {
        a[i][j] -= a[i][k] * a[k][j] / a[k][k];
        a[j][i] = a[i][j];
      }
    }
  }
  return true;
}

export function assertPositiveSemidefinite(matrix: Matrix): void {
  if (!isPositiveSemidefinite(matrix)) throw new RangeError('Matrix must be positive semidefinite (PSD)');
}

/** Solve by row reduction. Free variables are zero; requireUnique also rejects singular systems. */
export function solveLinear(matrix: Matrix, rhs: readonly number[], requireUnique = false): number[] | null {
  const n = matrix.length;
  if (!n || rhs.length !== n || rhs.some(x => !Number.isFinite(x)) ||
      matrix.some(row => row.length !== n || row.some(x => !Number.isFinite(x)))) {
    throw new RangeError('Invalid linear system');
  }
  const a = matrix.map((row, i) => {
    const scale = Math.max(...row.map(Math.abs)) || 1;
    return [...row.map(x => x / scale), rhs[i] / scale];
  });
  const pivots: number[] = [];
  for (let col = 0; col < n && pivots.length < n; col++) {
    const r = pivots.length;
    let p = r;
    for (let i = r + 1; i < n; i++) if (Math.abs(a[i][col]) > Math.abs(a[p][col])) p = i;
    if (Math.abs(a[p][col]) <= TOLERANCE) continue;
    [a[r], a[p]] = [a[p], a[r]];
    const divisor = a[r][col];
    for (let j = col; j <= n; j++) a[r][j] /= divisor;
    for (let i = 0; i < n; i++) {
      if (i === r) continue;
      const factor = a[i][col];
      for (let j = col; j <= n; j++) a[i][j] -= factor * a[r][j];
    }
    pivots.push(col);
  }
  if ((requireUnique && pivots.length < n) || a.slice(pivots.length).some(row => Math.abs(row[n]) > TOLERANCE)) return null;
  const solution = Array<number>(n).fill(0);
  pivots.forEach((col, row) => { solution[col] = a[row][n]; });
  return solution;
}
