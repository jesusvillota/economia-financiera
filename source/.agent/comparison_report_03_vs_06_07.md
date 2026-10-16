# Comparison Report: 03_teoria_carteras.tex vs 06+07 Files

## Executive Summary

This report compares the content of `03_teoria_carteras/03_teoria_carteras.tex` (the main file) with `06_decisiones_cartera_markowitz/06_decisiones_cartera_markowitz.tex` and `07_modelos_valoracion_activos_riesgo/07_modelos_valoracion_activos_riesgo.tex` (the split files).

**Key Findings:**
- File 03 contains 1255 lines covering both Markowitz model and CAPM
- File 06 contains 630 lines focusing on Markowitz model
- File 07 contains 699 lines focusing on CAPM and extensions
- There are significant notation differences (r vs R)
- Some content appears in file 03 that is not in files 06+07
- Some content appears in files 06+07 that is not in file 03

---

## 1. Section Structure Comparison

### File 03 Structure:
1. Introducción
2. Análisis del Efecto Diversificación
   - Fundamentos de Carteras de Dos Activos
   - Efecto del Coeficiente de Correlación
     - Caso 1: Correlación Perfecta Positiva
     - Caso 2: Correlación Perfecta Negativa
     - Caso 3: Correlación entre -1 y +1
3. El Modelo de Markowitz
   - Fundamentos del Modelo Media-Varianza
   - Supuestos del Modelo
   - Rentabilidad y Riesgo de Carteras de Múltiples Activos
   - Conjunto de Oportunidades de Inversión
   - Cartera de Varianza Mínima
   - Carteras Eficientes y Frontera Eficiente
   - Optimización de Carteras
4. El Activo Libre de Riesgo y la Línea de Asignación de Capital
   - Introducción del Activo Libre de Riesgo
   - Línea de Asignación de Capital (CAL)
   - Cartera Tangente
5. Teorema de Separación de Fondos
   - Enunciado del Teorema
   - Interpretación Económica
   - Demostración del Teorema
6. Modelo de Valoración de Activos de Capital (CAPM)
   - Supuestos y Origen del CAPM
   - La Línea del Mercado de Capitales (CML)
   - Riesgo Sistemático vs. Riesgo Específico
   - El Coeficiente Beta
     - Cálculo de Beta mediante Regresión
   - La Beta de una Cartera
   - La Línea del Mercado de Valores (SML)
7. Ejercicios
   - Ejercicio: Optimización de Cartera con DELL y YELP
   - Ejercicio: Cartera con AIR FRANCE y DANONE
8. Extensiones y Otros Modelos de Valoración
   - Estudios de Eventos
   - Modelo de Tres Factores de Fama-French
   - Modelo de Cuatro Factores de Carhart
   - Teoría de Valoración por Arbitraje (APT)
9. Síntesis y Conclusiones

### File 06 Structure:
1. Introducción
2. Análisis del Efecto Diversificación
   - Fundamentos de Carteras de Dos Activos
   - Caso 1: Coeficiente de Correlación Igual a +1
   - Caso 2: Coeficiente de Correlación Igual a -1
   - Caso 3: Coeficiente de Correlación entre -1 y +1
3. El Modelo de Markowitz
   - Introducción a la Teoría de Carteras
   - Características del Modelo Media-Varianza
   - Formación de Carteras con Dos Activos
   - Formación de Carteras con Tres o Más Activos
   - Problema de Optimización de Markowitz
   - Carteras con Activos con Riesgo y Activo Libre de Riesgo
   - Selección de la Cartera Óptima con Riesgo
   - La Cartera Tangente y el Teorema de Separación
4. Ejercicios y Ejemplos
   - Ejercicio: Cartera con Tres Activos
   - Ejercicio: El Efecto Diversificación
   - Ejemplo: Cartera con ACCIONA y BBVA
5. Resumen

### File 07 Structure:
1. Introducción
2. Repaso: Modelo de Markowitz y Teorema de Separación de Fondos
   - El Modelo Media-Varianza
   - La Línea de Asignación de Capital (CAL)
   - La Cartera Tangente
   - Teorema de Separación de Fondos
3. Ejercicio: Análisis de Cartera con AIR FRANCE y DANONE
4. El Modelo de Valoración de Activos de Capital (CAPM)
   - Supuestos y Origen del CAPM
5. La Línea del Mercado de Capitales (CML)
   - Definición y Características
   - La Cartera de Mercado
6. La Línea del Mercado de Títulos (SML)
   - Definición y Fundamentos
   - La Ecuación del CAPM
7. La Beta
   - Definición y Significado
   - Cálculo de Beta mediante Regresión
   - Clasificación de Acciones según su Beta
8. La Beta de una Cartera
   - Cálculo de la Beta de una Cartera
9. Extensiones y Otros Modelos de Valoración
   - Estudios de Eventos (Event Studies)
   - Modelo de Tres Factores de Fama-French
   - Modelo de Cuatro Factores de Carhart
   - Teoría de Valoración por Arbitraje (APT)
10. Conclusiones

---

## 2. Notation Differences

### Critical Notation Difference: `r` vs `R`

**File 03 uses:**
- `\E[r_1]`, `\E[r_2]`, `\E[r_p]` (lowercase `r` for returns)
- `r_f` for risk-free rate
- `r_M` for market return
- `r_i` for asset return

**File 06 uses:**
- `\E[R_1]`, `\E[R_2]`, `\E[R_p]` (uppercase `R` for returns)
- `r_f` for risk-free rate (consistent)
- `R_c` for risky portfolio return

**File 07 uses:**
- Mixed notation: `E[r_i]` in some places, `R_i` for risk premiums
- Explicitly defines: `R_M = r_M - r_f` (risk premium)
- `R_i = r_i - r_f` (risk premium)

**Impact:** This is a significant inconsistency that could cause confusion. File 03 consistently uses lowercase `r` for returns, while file 06 uses uppercase `R`. File 07 uses both, with `R` specifically for risk premiums.

---

## 3. Content Unique to File 03 (NOT in Files 06+07)

### 3.1 Sections/Subsections Unique to File 03

1. **"En la sección anterior se establecieron los fundamentos..."** (line 29)
   - File 03 references previous sections, suggesting it's part of a larger document
   - Files 06+07 are standalone documents

2. **"Síntesis y Conclusiones"** (Section 9, line 1229)
   - Comprehensive synthesis section
   - Not present in files 06+07

### 3.2 Definitions Unique to File 03

1. **"Riesgo Sistemático" and "Riesgo Específico"** (lines 692-698)
   - File 03 has explicit definitions for systematic vs. specific risk
   - File 07 mentions these concepts but doesn't have the formal definitions in the same section

2. **"Descomposición del Riesgo Total"** (Theorem, lines 700-705)
   - Theorem stating: $\sigma_i^2 = \sigma_{\text{sistemático},i}^2 + \sigma_{\text{específico},i}^2$
   - Not present in file 07

### 3.3 Examples/Exercises Unique to File 03

1. **"Cálculo de Rentabilidad y Riesgo de Activos y Cartera"** (lines 188-244)
   - Detailed example with Alcatel, Corning, and IBM
   - Includes methodology notes
   - Not present in files 06+07

2. **"Cálculo de Rentabilidad y Riesgo de una Cartera"** (lines 408-443)
   - Example with ACCIONA and BBVA (equally weighted portfolio)
   - Different from the example in file 06

3. **"Cálculo de la Cartera de Varianza Mínima"** (lines 445-477)
   - Detailed calculation of minimum variance portfolio for ACCIONA and BBVA
   - Not present in files 06+07

4. **"Cálculo del Coeficiente Beta"** (lines 855-874)
   - Example calculating beta from covariance and variance
   - Not present in file 07

5. **"Comparación de Activos según el CAPM"** (lines 903-930)
   - Example comparing three assets (A, B, C) to determine if they're over/under-valued
   - Not present in file 07

### 3.4 Theorems/Propositions Unique to File 03

1. **"Pesos de la Cartera de Varianza Mínima para Dos Activos"** (lines 339-362)
   - Theorem with explicit formula: $w_1^* = \frac{\sigma_2^2 - \sigma_{1,2}}{\sigma_1^2 + \sigma_2^2 - 2\sigma_{1,2}}$
   - File 06 has this in an exercise but not as a formal theorem

2. **"Optimalidad de la Cartera Tangente"** (lines 566-568)
   - Theorem stating investors choose CAL with maximum slope
   - File 06 has similar content but not as a formal theorem

3. **"Propiedades de la CAL"** (lines 549-556)
   - Proposition listing 4 properties of CAL
   - Not present in file 06

4. **"Propiedades de la SML"** (lines 845-853)
   - Proposition listing 5 properties of SML
   - Not present in file 07

### 3.5 Additional Content Unique to File 03

1. **More detailed proof of variance formula** (lines 63-74)
   - File 03 shows: $\V(aw) = a^2\V(w)$ and $\Cov(aw_1, bw_2) = ab\Cov(w_1, w_2)$
   - File 06 has a shorter proof

2. **Interpretation text after correlation cases** (lines 107, 132, 140)
   - File 03 includes interpretation paragraphs after each correlation case
   - File 06 has similar but slightly different interpretations

3. **"Aplicación del Teorema de Separación"** example (lines 605-633)
   - Example with Antonio and Manuel showing different risk preferences
   - Not present in files 06+07

4. **More detailed explanation of market portfolio** (lines 674-678)
   - Formula for market portfolio weights: $w_j^M = \frac{n_j P_j^*}{\sum_{i=1}^{N} n_i P_i^*}$
   - File 07 has this but in a different location

---

## 4. Content Unique to Files 06+07 (NOT in File 03)

### 4.1 Sections/Subsections Unique to Files 06+07

1. **"Introducción a la Teoría de Carteras"** (File 06, line 190)
   - Separate subsection introducing portfolio theory
   - File 03 goes directly to "Fundamentos del Modelo Media-Varianza"

2. **"Características del Modelo Media-Varianza"** (File 06, line 202)
   - Separate subsection for model characteristics
   - File 03 combines this with "Fundamentos"

3. **"Formación de Carteras con Dos Activos"** (File 06, line 236)
   - Separate subsection
   - File 03 doesn't have this explicit subsection

4. **"Formación de Carteras con Tres o Más Activos"** (File 06, line 264)
   - Separate subsection
   - File 03 covers this within "Rentabilidad y Riesgo de Carteras de Múltiples Activos"

5. **"Selección de la Cartera Óptima con Riesgo"** (File 06, line 365)
   - Separate subsection
   - File 03 covers this within "Cartera Tangente"

6. **"Repaso: Modelo de Markowitz y Teorema de Separación de Fondos"** (File 07, line 23)
   - Entire section as review
   - File 03 doesn't have this review section

7. **"Clasificación de Acciones según su Beta"** (File 07, line 404)
   - Separate subsection with definitions for defensive, neutral, and aggressive stocks
   - File 03 doesn't have this explicit classification

8. **"Resumen"** (File 06, line 610)
   - Summary section at the end
   - File 03 has "Síntesis y Conclusiones" instead

9. **"Conclusiones"** (File 07, line 683)
   - Conclusions section
   - File 03 has "Síntesis y Conclusiones" instead

### 4.2 Definitions Unique to Files 06+07

1. **"Teoría de Carteras"** (File 06, line 192)
   - Definition: "La Teoría de Carteras estudia cómo construir carteras..."
   - File 03 doesn't have this explicit definition

2. **"Cartera"** (File 06, line 196)
   - More general definition: "Una cartera es un conjunto de activos..."
   - File 03 defines "Cartera de Dos Activos" and "Cartera de N Activos" separately

3. **"Aversión al Riesgo"** (File 06, line 222)
   - Explicit definition of risk aversion
   - File 03 mentions this but doesn't have a formal definition

4. **"Acciones Defensivas"** (File 07, line 408)
   - Definition: stocks with $\beta < 1$
   - Not in file 03

5. **"Acciones Neutras"** (File 07, line 412)
   - Definition: stocks with $\beta = 1$
   - Not in file 03

6. **"Acciones Agresivas"** (File 07, line 416)
   - Definition: stocks with $\beta > 1$
   - Not in file 03

7. **"Beta del Mercado y del Activo Libre de Riesgo"** (File 07, line 420)
   - Proposition with proof that $\beta_M = 1$ and $\beta_{rf} = 0$
   - Not in file 03

### 4.3 Theorems/Propositions Unique to Files 06+07

1. **"Volatilidad de Cartera con Correlación Perfecta Positiva"** (File 06, line 81)
   - Stated as a theorem (not just a proposition)
   - File 03 has this as a proposition

2. **"Volatilidad de Cartera con Correlación Perfecta Negativa"** (File 06, line 124)
   - Stated as a theorem
   - File 03 has this as a proposition

3. **"Cartera de Varianza Nula con Correlación -1"** (File 06, line 142)
   - Proposition with explicit formula for zero-variance portfolio
   - File 03 mentions this but doesn't have the explicit formula

4. **"Formulación Dual del Problema de Markowitz"** (File 06, line 290)
   - Separate theorem for dual formulation
   - File 03 includes both formulations in one theorem

5. **"Criterio de Selección de la CAL"** (File 06, line 369)
   - Theorem stating investors choose CAL with maximum slope
   - File 03 has "Optimalidad de la Cartera Tangente" which is similar but different

6. **"Supuestos del CAPM"** (File 07, line 177)
   - Stated as a theorem (not just a definition)
   - File 03 has this as a definition

7. **"Ecuación Fundamental del CAPM"** (File 07, line 255)
   - Theorem title (File 03 uses "Ecuación del CAPM")

8. **"Cálculo de la Beta"** (File 07, line 330)
   - Theorem (File 03 has this as part of the definition)

### 4.4 Examples/Exercises Unique to Files 06+07

1. **"Cartera con Correlación Perfecta Positiva"** (File 06, line 103)
   - Example with specific numbers (15%, 10%, 20%, 15%)
   - File 03 has a different example with different numbers

2. **"Cálculo de Rentabilidad y Riesgo para Tres Activos"** (File 06, line 408)
   - Example with Alcatel, Corning, IBM
   - Similar to file 03 but with different presentation and more detailed solution steps

3. **"Cartera de Mínima Varianza con Diferentes Correlaciones"** (File 06, line 496)
   - Exercise with DELL and YELP
   - More detailed than file 03's version, includes parts (a) through (e)

4. **"Análisis de Cartera Equiponderada"** (File 06, line 543)
   - Example with ACCIONA and BBVA
   - Includes a table showing results for different weights
   - File 03 has a similar example but without the table

5. **"Análisis Completo de Cartera: AIR FRANCE y DANONE"** (File 07, line 78)
   - Complete exercise with parts (a) through (f)
   - File 03 has this exercise but it's structured differently

6. **"Aplicación del CAPM"** (File 07, line 286)
   - Example with AMADEUS
   - Includes two questions
   - File 03 has a similar example but with different numbers

7. **"Cálculo de Beta"** (File 07, line 373)
   - Example with TELEFON
   - Different from file 03's example

8. **"Cálculo de la Beta de una Cartera"** (File 07, line 488)
   - Example with three assets, one requiring beta calculation from covariance
   - File 03 has a similar example but with different numbers

### 4.5 Additional Content Unique to Files 06+07

1. **Explicit notation for risk premiums** (File 07, lines 272-276)
   - Defines: $R_M = r_M - r_f$ and $R_i = r_i - r_f$
   - Shows alternative CAPM equation: $E[R_i] = \beta_i E[R_M]$
   - File 03 doesn't have this explicit notation

2. **Question about assets outside SML** (File 07, line 314)
   - "¿Puede algún activo situarse fuera de la SML?"
   - Detailed explanation of equilibrium
   - File 03 doesn't have this question

3. **More detailed methodology in event studies** (File 07, lines 572-577)
   - Additional questions about abnormal returns
   - File 03 has similar content but less detailed

4. **Reference to Kenneth French data library** (File 07, line 581)
   - URL: http://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html
   - File 03 mentions this but doesn't include the URL

5. **More detailed explanation of Fama-French factors** (File 07, lines 642-648)
   - Lists the four factors explicitly
   - File 03 has similar content but less structured

---

## 5. Detailed Comparison by Topic

### 5.1 Diversification Analysis

**File 03:**
- Uses lowercase `r` notation
- Has three subsubsections for correlation cases
- Includes interpretation paragraphs
- Example with 10% and 8% returns, 20% and 15% volatilities

**File 06:**
- Uses uppercase `R` notation
- Has three subsections (not subsubsections)
- Theorem format for correlation cases (not just propositions)
- Example with 15% and 10% returns, 20% and 15% volatilities
- Includes proposition for zero-variance portfolio with explicit formula

**Differences:**
- Notation (r vs R)
- Structural organization (subsubsections vs subsections)
- File 06 has more formal theorem statements
- File 06 has explicit formula for zero-variance portfolio

### 5.2 Markowitz Model

**File 03:**
- "Fundamentos del Modelo Media-Varianza" subsection
- "Supuestos del Modelo" subsection
- Combined approach

**File 06:**
- "Introducción a la Teoría de Carteras" subsection
- "Características del Modelo Media-Varianza" subsection
- "Formación de Carteras con Dos Activos" subsection
- "Formación de Carteras con Tres o Más Activos" subsection
- More granular structure

**Differences:**
- File 06 has more detailed subsection structure
- File 06 separates portfolio formation for 2 vs. 3+ assets
- File 06 has explicit definition of "Teoría de Carteras"

### 5.3 Risk-Free Asset and CAL

**File 03:**
- Single section: "El Activo Libre de Riesgo y la Línea de Asignación de Capital"
- Theorem: "Optimalidad de la Cartera Tangente"
- Proposition: "Propiedades de la CAL" (4 properties)

**File 06:**
- Subsection: "Carteras con Activos con Riesgo y Activo Libre de Riesgo"
- Subsection: "Selección de la Cartera Óptima con Riesgo"
- Subsection: "La Cartera Tangente y el Teorema de Separación"
- Theorem: "Criterio de Selección de la CAL"
- Proposition: "Pendiente de la CAL"

**Differences:**
- File 06 has more granular structure
- File 06 separates CAL selection from tangent portfolio
- File 03 has "Propiedades de la CAL" which file 06 doesn't have
- File 06 has "Pendiente de la CAL" which file 03 doesn't have explicitly

### 5.4 Separation Theorem

**File 03:**
- Separate section: "Teorema de Separación de Fondos"
- Three subsections: Enunciado, Interpretación Económica, Demostración
- Example: "Aplicación del Teorema de Separación" (Antonio and Manuel)

**File 06:**
- Combined with tangent portfolio in subsection
- Shorter treatment

**File 07:**
- Review section includes separation theorem
- Similar to file 03 but as review material

**Differences:**
- File 03 has most detailed treatment
- File 07 treats it as review material
- File 06 has briefest treatment

### 5.5 CAPM

**File 03:**
- Section: "Modelo de Valoración de Activos de Capital (CAPM)"
- Subsection: "Supuestos y Origen del CAPM" (definition format)
- Subsection: "La Línea del Mercado de Capitales (CML)"
- Subsection: "Riesgo Sistemático vs. Riesgo Específico" (with definitions and theorem)
- Subsection: "El Coeficiente Beta"
- Subsection: "La Línea del Mercado de Valores (SML)"
- Proposition: "Propiedades de la SML" (5 properties)

**File 07:**
- Section: "El Modelo de Valoración de Activos de Capital (CAPM)"
- Subsection: "Supuestos y Origen del CAPM" (theorem format)
- Separate section: "La Línea del Mercado de Capitales (CML)"
- Separate section: "La Línea del Mercado de Títulos (SML)"
- Separate section: "La Beta"
- Subsection: "Clasificación de Acciones según su Beta"
- No "Propiedades de la SML" proposition
- Question: "¿Puede algún activo situarse fuera de la SML?"

**Differences:**
- File 07 has more granular structure (separate sections)
- File 07 has stock classification by beta (not in file 03)
- File 03 has "Propiedades de la SML" (not in file 07)
- File 07 has explicit risk premium notation
- File 07 has question about assets outside SML

### 5.6 Beta Calculation

**File 03:**
- Definition: "Coeficiente Beta"
- Proposition: "Interpretación del Beta"
- Proposition: "Regresión de Mercado"
- Example: "Cálculo del Coeficiente Beta"

**File 07:**
- Definition: "Beta"
- Theorem: "Cálculo de la Beta"
- Proposition: "Regresión de Mercado"
- Example: "Cálculo de Beta" (different example)
- Proposition: "Beta del Mercado y del Activo Libre de Riesgo" (with proof)

**Differences:**
- File 07 has theorem format for beta calculation
- File 07 has explicit proof that $\beta_M = 1$ and $\beta_{rf} = 0$
- Different examples

### 5.7 Exercises

**File 03:**
- Section: "Ejercicios"
- "Cartera de Mínima Varianza: DELL y YELP" (parts a-e)
- "Análisis Completo de Cartera: AIR FRANCE y DANONE" (parts a-f)

**File 06:**
- Section: "Ejercicios y Ejemplos"
- "Cartera con Tres Activos" (Alcatel, Corning, IBM)
- "El Efecto Diversificación" (DELL and YELP, parts a-e)
- "Cartera con ACCIONA y BBVA" (with table)

**File 07:**
- Section: "Ejercicio: Análisis de Cartera con AIR FRANCE y DANONE"
- Same exercise as file 03 but structured as a section

**Differences:**
- File 06 has more exercises
- File 06 has table for ACCIONA/BBVA example
- File 07 has AIR FRANCE/DANONE as a section (not subsection)

### 5.8 Extensions

**File 03:**
- Section: "Extensiones y Otros Modelos de Valoración"
- Subsection: "Estudios de Eventos"
- Subsection: "Modelo de Tres Factores de Fama-French"
- Subsection: "Modelo de Cuatro Factores de Carhart"
- Subsection: "Teoría de Valoración por Arbitraje (APT)"

**File 07:**
- Same structure
- More detailed methodology section for event studies
- Reference to Kenneth French data library with URL
- More structured explanation of Carhart model factors

**Differences:**
- File 07 has more detail in event studies methodology
- File 07 includes URL for data library
- File 07 has more structured factor explanations

---

## 6. Recommendations

### 6.1 Notation Standardization

**Critical Issue:** The notation inconsistency between files must be resolved.

**Recommendation:**
- Standardize on lowercase `r` for returns: `r_i`, `r_p`, `r_M`, `r_f`
- Use uppercase `R` only for risk premiums: `R_i = r_i - r_f`, `R_M = r_M - r_f`
- This matches file 07's explicit notation but should be applied consistently

### 6.2 Content Alignment

1. **Add to File 03:**
   - Stock classification by beta (from file 07)
   - Explicit risk premium notation (from file 07)
   - Question about assets outside SML (from file 07)
   - URL for Kenneth French data library (from file 07)
   - Proposition "Beta del Mercado y del Activo Libre de Riesgo" (from file 07)

2. **Add to Files 06+07:**
   - "Propiedades de la CAL" proposition (from file 03)
   - "Propiedades de la SML" proposition (from file 03)
   - "Descomposición del Riesgo Total" theorem (from file 03)
   - "Aplicación del Teorema de Separación" example (from file 03)
   - "Comparación de Activos según el CAPM" example (from file 03)
   - "Síntesis y Conclusiones" section (from file 03)

3. **Structural Improvements:**
   - File 03 could benefit from file 06's more granular subsection structure for Markowitz model
   - File 06 could benefit from file 03's separate section for Separation Theorem
   - File 07 could benefit from file 03's "Propiedades de la SML" proposition

### 6.3 Exercise Consolidation

- File 03's exercises section should include all exercises from files 06+07
- Consider adding the table from file 06's ACCIONA/BBVA example to file 03
- Ensure all exercise parts are included

### 6.4 Proof and Theorem Consistency

- File 06 uses theorem format for correlation cases; consider if file 03 should match
- File 07 uses theorem format for CAPM assumptions; file 03 uses definition format
- Consider standardizing the format based on content type

---

## 7. Summary Statistics

### File 03:
- **Total Lines:** 1255
- **Sections:** 9 major sections
- **Definitions:** ~25
- **Theorems:** ~15
- **Propositions:** ~8
- **Examples:** ~10
- **Exercises:** 2 major exercises

### File 06:
- **Total Lines:** 630
- **Sections:** 5 major sections
- **Definitions:** ~12
- **Theorems:** ~8
- **Propositions:** ~5
- **Examples:** 3 major examples
- **Exercises:** 3 exercises

### File 07:
- **Total Lines:** 699
- **Sections:** 10 major sections
- **Definitions:** ~12
- **Theorems:** ~6
- **Propositions:** ~4
- **Examples:** 4 major examples
- **Exercises:** 1 major exercise

---

## 8. Conclusion

The three files cover similar material but with important differences:

1. **File 03** is the most comprehensive, serving as a complete reference
2. **File 06** focuses on Markowitz model with more granular structure
3. **File 07** focuses on CAPM with additional details on beta classification

**Key Issues:**
- Notation inconsistency (r vs R) is the most critical issue
- Some unique content in each file should be consolidated
- Structural differences reflect different organizational approaches

**Recommendation:** Standardize notation first, then consolidate unique content to ensure all three files are consistent while maintaining their individual strengths.

