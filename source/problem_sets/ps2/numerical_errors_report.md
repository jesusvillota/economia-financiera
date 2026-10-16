# Numerical Errors Report - ps2_solutions.tex

## Summary
This report documents all numerical errors found in the solutions document after thorough verification of all computations.

## Errors Found

### Exercise 3, Part (b) - CRITICAL ERROR
**Location:** Lines 119-122

**Error Description:** 
The final price calculation P₀ is incorrect. The document shows P₀ = €31.00, but the correct value is approximately €30.00.

**Details:**
- Document shows: P₀ = 1.150 + 1.202 + 27.644 = 31.00
- Correct calculation:
  - PV_D₁ = 1.265 / 1.10 = 1.150000 ✓
  - PV_D₂ = 1.4548 / 1.21 = 1.202314 ✓
  - PV_D₃+P₃ = (1.6730 + 35.13) / 1.331 = 27.650639
  - Correct P₀ = 1.150000 + 1.202314 + 27.650639 = **30.002953 ≈ €30.00**

**Impact:** 
This is a cascading error that affects:
- The stated price of €31.00 (should be €30.00)
- The sensitivity analysis comment stating the price increases from €25.40 to €31.00 (should be €30.00)
- The stated increase of €5.60 (should be approximately €4.60)
- The stated percentage increase of 22.0% (should be approximately 18.1%)

**Correct Values:**
- P₀ = €30.00 (not €31.00)
- Increase from part (a): €30.00 - €25.40 = €4.60
- Percentage increase: (€4.60 / €25.40) × 100% = 18.1%

---

### Exercise 3, Part (c) - Minor Rounding Difference
**Location:** Lines 134-136

**Error Description:**
Small rounding difference in the capital gains calculation. The document shows 4.96%, but the correct value is 5.01%.

**Details:**
- Document shows: Capital gains = 4.96%
- Correct calculation:
  - P₁ = 26.672132 (document shows 26.66, which is acceptable rounding)
  - Capital gains = (26.672132 - 25.40) / 25.40 = 0.050084 = **5.01%**
- Total return = 4.98% + 5.01% = 9.99% (document shows 9.94%)

**Impact:** 
Minor rounding error. The document's value of 9.94% is close to the correct 9.99%, and both are close to the required 10% return, so this is acceptable for verification purposes.

**Note:** This difference likely arises from rounding intermediate values (P₁ shown as 26.66 instead of 26.672132).

---

## Exercises Verified Without Errors

### Exercise 1
All present value calculations, discount factors, and percentage contributions are correct.

### Exercise 2
Gordon model calculations (g = r - D₁/P₀), new price calculation, and percentage change are all correct.

### Exercise 4
FCFF and FCFE calculations are correct.

### Exercise 5
- CAPM calculation (R_e = 10.2%) ✓
- WACC calculation (7.52%) ✓
- All FCFF present values ✓
- Terminal value calculation ✓
- FCFE present values ✓
- Terminal value for FCFE ✓
- Price per share (€19.06) ✓

### Exercise 7
- CAPM (R_e = 10.0%) ✓
- WACC (4.912%) ✓
- All FCFF present values ✓
- Terminal value ✓
- NPV (€1,446.29) ✓
- Sensitivity analysis calculations for both ±1pp WACC scenarios ✓
  (Minor rounding differences exist but are within acceptable tolerance)

### Exercise 8
- Expected values for A and B ✓
- Variance calculations (both methods) ✓
- Standard deviations ✓
- Covariance (both methods) ✓
- Correlation ✓
- Market moments ✓
- Covariances with market ✓
- Beta calculations ✓

### Exercise 9
- All six monthly return calculations ✓
- Sample mean (2.97%) ✓
- All squared deviations ✓
- Sample variance ✓
- Standard deviation (3.39% monthly) ✓
- Annualized volatility (11.74%) ✓

---

## Recommendations

1. **Exercise 3, Part (b):** Correct the final price P₀ from €31.00 to €30.00 and update all related calculations and comments.

2. **Exercise 3, Part (c):** Consider using more precise intermediate values to reduce rounding errors, though the current level of precision is generally acceptable.

3. **General:** Consider carrying more decimal places in intermediate calculations to minimize rounding error accumulation, especially in multi-step calculations.

---

## Verification Methodology

All calculations were verified using Python with high-precision arithmetic. Each computation was:
1. Extracted from the problem statement
2. Recalculated independently
3. Compared with the document's values
4. Cross-checked for consistency across related calculations

Rounding conventions were noted, and differences were classified as:
- **Critical errors:** Values that are clearly wrong and affect conclusions
- **Minor rounding differences:** Values that differ slightly due to rounding but don't significantly impact the solution

