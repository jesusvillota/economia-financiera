import { bearSpread, bullSpread, collar, coveredCall, protectivePut, straddle, strangle,
  type StrategyLeg } from '../lib/finance/derivatives';

export const optionStrategies = [
  { value: 'call', label: 'Comprar call' },
  { value: 'short-call', label: 'Vender call' },
  { value: 'put', label: 'Comprar put' },
  { value: 'short-put', label: 'Vender put' },
  { value: 'covered', label: 'Call cubierta' },
  { value: 'protective', label: 'Put protectora' },
  { value: 'bull', label: 'Spread alcista de calls' },
  { value: 'bear', label: 'Spread bajista de puts' },
  { value: 'straddle', label: 'Straddle comprado' },
  { value: 'strangle', label: 'Strangle comprado' },
  { value: 'collar', label: 'Collar' },
] as const;
export type OptionStrategy = typeof optionStrategies[number]['value'];
export const optionDefaults = { strike: 100, width: 20, call: 6, put: 5, outer: 2, spot: 120 };
export type OptionInputs = typeof optionDefaults;

/** Assemble signed legs; all financial calculations stay in derivatives.ts. */
export function optionStrategyLegs(strategy: OptionStrategy, p: OptionInputs): StrategyLeg[] {
  switch (strategy) {
    case 'call': return [{ type: 'call', quantity: 1, strike: p.strike, premium: p.call }];
    case 'short-call': return [{ type: 'call', quantity: -1, strike: p.strike, premium: p.call }];
    case 'put': return [{ type: 'put', quantity: 1, strike: p.strike, premium: p.put }];
    case 'short-put': return [{ type: 'put', quantity: -1, strike: p.strike, premium: p.put }];
    case 'covered': return coveredCall(100, p.strike, p.call);
    case 'protective': return protectivePut(100, p.strike, p.put);
    case 'bull': return bullSpread(p.strike, p.strike + p.width, p.call, p.outer);
    case 'bear': return bearSpread(p.strike - p.width, p.strike, p.outer, p.put);
    case 'straddle': return straddle(p.strike, p.call, p.put);
    case 'strangle': return strangle(p.strike - p.width, p.strike + p.width, p.outer, p.outer);
    case 'collar': return collar(100, p.strike - p.width, p.strike + p.width, p.outer, p.outer);
  }
}
