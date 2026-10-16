/** Valor futuro con capitalización compuesta anual: VF = VA (1 + r)^t. */
export const compound = (va: number, r: number, t: number): number => va * (1 + r) ** t;
