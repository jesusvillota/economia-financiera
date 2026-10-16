/**
 * Chapter 12 data: venue types, sorter examples and participants (note 05 §2, §4, §5).
 * Original teaching examples; no third-party cases. The sorter widget and
 * tests/capitulo12.test.ts import from here, so the text and the widget agree.
 */
import { rng } from '../lib/problems/variant';

export type VenueId = 'regulado' | 'smn' | 'soc' | 'si' | 'oscuro' | 'otc';

export interface Venue {
  id: VenueId;
  label: string;
  /** One-line description shown in the sorter tile. */
  hint: string;
  /** A MiFID II trading venue (regulated market, MTF or OTF). SIs and OTC deals are not. */
  tradingVenue: boolean;
  /** Many third-party buyers and sellers meet in one system (otherwise: one counterparty). */
  multilateral: boolean;
  /** The operator may decide how and when to match orders. */
  discretionary: boolean;
  /** Orders or firm quotes are visible before the trade. */
  preTradeVisible: boolean;
}

export const venues: Venue[] = [
  { id: 'regulado', label: 'Mercado regulado', hint: 'Bolsa: libro visible y reglas fijas', tradingVenue: true, multilateral: true, discretionary: false, preTradeVisible: true },
  { id: 'smn', label: 'SMN (MTF)', hint: 'Sistema multilateral con reglas fijas', tradingVenue: true, multilateral: true, discretionary: false, preTradeVisible: true },
  { id: 'soc', label: 'SOC (OTF)', hint: 'Multilateral con discrecionalidad; sin acciones', tradingVenue: true, multilateral: true, discretionary: true, preTradeVisible: true },
  // ponytail: in the EU a dark pool is usually an MTF with pre-trade waivers; the sorter keeps it as its own tile.
  { id: 'oscuro', label: 'Dark pool', hint: 'Órdenes ocultas hasta la ejecución', tradingVenue: true, multilateral: true, discretionary: false, preTradeVisible: false },
  { id: 'si', label: 'Internalizador sistemático', hint: 'Banco que opera contra su balance, de forma sistemática', tradingVenue: false, multilateral: false, discretionary: true, preTradeVisible: true },
  { id: 'otc', label: 'OTC bilateral', hint: 'Acuerdo directo entre dos partes', tradingVenue: false, multilateral: false, discretionary: true, preTradeVisible: false },
];

export interface SorterExample {
  id: string;
  text: string;
  answer: VenueId;
  /** Shown after the reader picks a tile. */
  why: string;
}

export const examples: SorterExample[] = [
  { id: 'continuo', answer: 'regulado',
    text: 'Una gestora compra acciones de una gran empresa cotizada durante la sesión continua de la bolsa principal.',
    why: 'Libro de órdenes visible, reglas no discrecionales y requisitos estrictos de admisión: mercado regulado.' },
  { id: 'cierre', answer: 'regulado',
    text: 'Las órdenes de una acción se acumulan en la subasta de cierre de la bolsa y se casan a un único precio.',
    why: 'Las subastas de apertura y cierre son fases del propio mercado regulado.' },
  { id: 'crecimiento', answer: 'smn',
    text: 'Una empresa pequeña cotiza en un segmento de crecimiento con requisitos de admisión más ligeros y reglas fijas de casación.',
    why: 'Multilateral, sin discrecionalidad y con requisitos más flexibles que una bolsa: un SMN.' },
  { id: 'bonos-voz', answer: 'soc',
    text: 'En una plataforma de bonos, el operador decide con cierto margen cuándo y cómo casar las órdenes de sus clientes.',
    why: 'La discrecionalidad del operador y el instrumento de renta fija apuntan a un SOC.' },
  { id: 'bloque', answer: 'oscuro',
    text: 'Un fondo de pensiones vende un bloque grande de acciones sin mostrar su orden; se cruza al punto medio y se publica después.',
    why: 'Sin transparencia previa pero con publicación posterior: un dark pool. En la UE suele funcionar como un SMN con exenciones.' },
  { id: 'banco-minorista', answer: 'si',
    text: 'Un banco ejecuta cada día, de forma organizada, las órdenes de sus clientes contra su propia cartera y publica cotizaciones firmes.',
    why: 'Contraparte única, frecuente y sistemática: internalizador sistemático. No es un centro de negociación multilateral.' },
  { id: 'swap', answer: 'otc',
    text: 'Dos entidades firman un swap de tipos de interés a medida, con fechas de pago que eligen ellas mismas.',
    why: 'Contrato a medida negociado entre dos partes: OTC bilateral.' },
  { id: 'bono-puntual', answer: 'otc',
    text: 'Una aseguradora compra un bono corporativo poco líquido a un intermediario con el que negocia de forma puntual.',
    why: 'Una contraparte, pero sin actividad sistemática: operación OTC, no internalizador.' },
];

/** Number of sorter answers that match the key. Unanswered items count as wrong. */
export function score(answers: Partial<Record<string, VenueId>>): number {
  return examples.filter((e) => answers[e.id] === e.answer).length;
}

/** Example order for a seed: seed 0 is the order above; other seeds shuffle (Fisher-Yates). */
export function shuffledExamples(seed: number): SorterExample[] {
  const out = [...examples];
  if (seed === 0) return out;
  const rand = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Note 05 §2: who acts on their own account (takes price risk) and who acts for clients. */
export interface Participant {
  id: string;
  label: string;
  /** 'intermediario' transforms assets; 'mediador' only helps funds circulate; 'estrategia' is a motive any trader can have. */
  kind: 'intermediario' | 'mediador' | 'estrategia';
  /** Buys or sells for their own account and so bears price risk. */
  ownAccount: boolean;
}

export const participants: Participant[] = [
  { id: 'banco', label: 'Banco', kind: 'intermediario', ownAccount: true },
  { id: 'fondo', label: 'Fondo de inversión', kind: 'intermediario', ownAccount: true },
  { id: 'broker', label: 'Broker (comisionista)', kind: 'mediador', ownAccount: false },
  { id: 'dealer', label: 'Dealer (operador por cuenta propia)', kind: 'mediador', ownAccount: true },
  { id: 'creador', label: 'Creador de mercado', kind: 'mediador', ownAccount: true },
  { id: 'especulador', label: 'Especulador', kind: 'estrategia', ownAccount: true },
  { id: 'cobertura', label: 'Cobertura (hedger)', kind: 'estrategia', ownAccount: true },
  { id: 'arbitrajista', label: 'Arbitrajista', kind: 'estrategia', ownAccount: true },
];

/** Phases of a trading day on the Spanish main market (BME), local time. */
export const bmeSession = [
  { phase: 'Subasta de apertura', from: '8:30', to: '9:00' },
  { phase: 'Mercado continuo', from: '9:00', to: '17:30' },
  { phase: 'Subasta de cierre', from: '17:30', to: '17:35' },
];

/** Usual settlement lag for EU shares, in business days after the trade (T+2). */
export const settlementDays = 2;
/** Moves to T+1: United States (May 2024) and the planned EU date (11 October 2027). */
export const usT1Year = 2024;
export const euT1 = { month: 'octubre', year: 2027 };
/** Year MiFID II and MiFIR started to apply. */
export const mifid2Year = 2018;
/** Money market: original maturity up to this many years; capital market: longer. */
export const moneyMarketMaxYears = 1;
