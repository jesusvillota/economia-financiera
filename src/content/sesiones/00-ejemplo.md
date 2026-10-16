---
title: "Sesión de ejemplo"
number: 1
source: ps1
chapters: ["00-ejemplo"]
difficulty: 1
summary: "Fixture mínimo que valida el esquema."
exercises:
  - id: ej1
    statement: "Invertimos $\\VA$ euros al $\\Rate{r}$ anual durante $t$ años. ¿Cuál es el valor futuro?"
    parameters:
      - { id: va, label: "Capital inicial", default: 1000, unit: "€" }
      - { id: r, label: "Tasa anual", default: 0.05, min: 0, max: 0.3, step: 0.01 }
      - { id: t, label: "Años", default: 10, min: 1, max: 40, step: 1 }
    hints:
      - "¿Qué fórmula da el valor futuro con capitalización compuesta?"
    steps:
      - { title: "Fórmula", body: "$\\VF = \\VA(1+r)^t$" }
      - { title: "Sustituir", body: "$1000 \\cdot 1{,}05^{10}$" }
    answers:
      - id: vf
        label: "Valor futuro"
        unit: "€"
        value: 1628.894627
        tolerance: { kind: abs, value: 0.01 }
        lib: { module: compound, fn: compound, args: [va, r, t] }
    concepts: ["00-ejemplo"]
---
