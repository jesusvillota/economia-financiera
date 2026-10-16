"""Shared helper: each check compares a documented value with a recomputed one."""
RESULTS = []


def check(ex, item, doc, calc, tol=0.006, src=""):
    """ex: exercise id, item: part label, doc: value printed in the source,
    calc: our recomputed value, tol: absolute tolerance (default = rounding to 2 dp),
    src: 'file:line' of the documented value."""
    ok = abs(doc - calc) <= tol
    RESULTS.append((ex, item, ok))
    print(f"{'OK      ' if ok else 'MISMATCH'} {ex} {item}: doc={doc} calc={calc:.6g} [{src}]")
    return ok
