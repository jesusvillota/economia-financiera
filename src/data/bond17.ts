/** Original chapter example; annual coupons, Actual/Actual coupon-period settlement. */
export const chapter17Bond = { face: 1000, couponRate: 0.04, maturity: 3, frequency: 1 };
export const chapter17Yield = 0.05;
export const previousCoupon17 = new Date('2026-01-01T00:00:00Z');
export const nextCoupon17 = new Date('2027-01-01T00:00:00Z');
export const settlementDate17 = (day: number) => new Date(Date.UTC(2026, 0, 1 + day));
