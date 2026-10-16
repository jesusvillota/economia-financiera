/** Proyectos de ejemplo del capítulo 3 (VAN, TIR y otros criterios). Flujos en €, t = 0, 1, 2, ... */

/** Proyecto convencional: un desembolso y tres cobros. */
export const convencional = [-1000, 400, 500, 600];
/** Rápido (A) frente a lento (B): excluyentes, con la misma inversión. */
export const rapido = [-1000, 1300];
export const lento = [-1000, 0, 0, 1600];
/** Cobros y, al final, un coste de cierre: dos TIR (10 % y 20 %). */
export const dosTir = [-100, 230, -132];
