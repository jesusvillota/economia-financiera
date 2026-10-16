/**
 * KaTeX macros shared by server-rendered MDX math and client-side <Tex>.
 * Colour macros wrap their argument in a CSS class so the colour follows the
 * active theme (see src/styles/theme.css).
 */
export const katexMacros: Record<string, string> = {
  '\\VA': '\\htmlClass{c-pv}{\\mathrm{VA}}',
  '\\VF': '\\htmlClass{c-fv}{\\mathrm{VF}}',
  '\\VAN': '\\htmlClass{c-pv}{\\mathrm{VAN}}',
  '\\TIR': '\\htmlClass{c-rate}{\\mathrm{TIR}}',
  '\\Rate': '\\htmlClass{c-rate}{#1}',
  '\\rf': '\\htmlClass{c-rate}{r_f}',
  '\\rM': '\\htmlClass{c-rate}{r_M}',
  '\\rstar': '\\htmlClass{c-rate}{r^*}',
  '\\ke': '\\htmlClass{c-rate}{k_e}',
  '\\kd': '\\htmlClass{c-rate}{k_d}',
  '\\E': '\\operatorname{E}',
  '\\Var': '\\operatorname{Var}',
  '\\Cov': '\\operatorname{Cov}',
};

export const katexOptions = {
  macros: katexMacros,
  trust: (ctx: { command: string }) => ctx.command === '\\htmlClass',
  strict: 'ignore' as const,
  throwOnError: false,
};
