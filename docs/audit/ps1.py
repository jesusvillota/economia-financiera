"""Recompute every numeric answer of ps1_solutions.tex and the exam (rentas)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import check

P = "ps1_solutions.tex"


def ann(a, r, n):
    return a * (1 - (1 + r) ** -n) / r


def gann(a, r, g, n):
    return a * (1 - ((1 + g) / (1 + r)) ** n) / (r - g)


def run():
    # Ex 1
    check("ps1.1", "a C3.5", 181500, 150000 * (1 + .06 * 3.5), src=f"{P}:53")
    for k, d, ln in [(12, .005, 55), (6, .01, 56), (4, .015, 57), (3, .02, 58), (2, .03, 59), (.5, .12, 60)]:
        check("ps1.1", f"b i_{k}", d, .06 / k, 1e-9, f"{P}:{ln}")
    check("ps1.1", "c trimestre 1", 2250, 150000 * .06 / 4, src=f"{P}:62")
    check("ps1.1", "d V0 t=10", 6666.67, 10000 / (1 + .05 * 10), src=f"{P}:65")
    check("ps1.1", "d V0 3 semestres", 9174.31, 10000 / (1 + .03 * 3), src=f"{P}:66")
    # Ex 2 (doc prints 36,734 with trailing '.' = truncated; true value 36,733.20)
    check("ps1.2", "a C5", 36734, 25000 * 1.08 ** 5, 1.0, f"{P}:81")
    for k, d, ln in [(12, .006434, 83), (6, .012913, 84), (4, .019427, 85), (3, .025981, 86), (2, .03923, 87), (.5, .1664, 88)]:
        check("ps1.2", f"b i_{k}", d, 1.08 ** (1 / k) - 1, 5e-7, f"{P}:{ln}")
    i12 = 1.08 ** (1 / 12) - 1
    check("ps1.2", "c mes 1", 160.85, i12 * 25000, src=f"{P}:90")
    check("ps1.2", "c mes 2", 161.88, i12 * 25000 * (1 + i12), src=f"{P}:91")
    check("ps1.2", "d i) V0", 6139.13, 10000 / 1.05 ** 10, src=f"{P}:93")
    check("ps1.2", "d ii) i12", .004868, 1.06 ** (1 / 12) - 1, 5e-7, f"{P}:94")
    check("ps1.2", "d ii) V0", 9165, 10000 / 1.06 ** 1.5, 1.0, f"{P}:94")
    # Ex 3
    c3 = 100000 * 1.06 * 1.08 ** 2
    check("ps1.3", "a C3", 123638.40, c3, src=f"{P}:121")
    check("ps1.3", "b simple eq", .078794, (c3 / 1e5 - 1) / 3, 1e-5, f"{P}:122")
    check("ps1.3", "b compound eq", .0732, (c3 / 1e5) ** (1 / 3) - 1, 1e-4, f"{P}:123")
    check("ps1.3", "c A montante", 124000, 100000 * (1 + .02 * 12), src=f"{P}:126")
    check("ps1.3", "c B annual eq", .0612, 1.02 ** 3 - 1, 5e-5, f"{P}:128")
    # doc rounds (1.02)^9 to 1.195 (true 1.19509): montante 119,500 vs 119,509.26
    check("ps1.3", "c B montante", 119500, 100000 * 1.02 ** 9, 1.0, f"{P}:130")
    # Ex 4
    check("ps1.4", "a V0", 29269, ann(5000, .09, 8), 1.0, f"{P}:147")
    check("ps1.4", "b V0 growing", 31885, gann(5000, .09, .03, 8), 1.0, f"{P}:148")
    t1 = ann(5000, .09, 3)
    v3 = gann(5000, .09, .03, 5)
    check("ps1.4", "c tramo 1", 12674, t1, 1.0, f"{P}:150")
    check("ps1.4", "c V3", 21351, v3, 1.0, f"{P}:152")
    check("ps1.4", "c tramo 2", 16466, v3 / 1.09 ** 3, 1.0, f"{P}:153")
    check("ps1.4", "c total", 29140, t1 + v3 / 1.09 ** 3, 1.0, f"{P}:154")
    # Ex 5
    check("ps1.5", "a", 31250, 2500 / .08, src=f"{P}:168")
    check("ps1.5", "b", 41667, 2500 / .06, 1.0, f"{P}:169")
    check("ps1.5", "c first pay", 2760, 2500 * 1.02 ** 5, 1.0, f"{P}:170")
    check("ps1.5", "c V5", 46004, 2500 * 1.02 ** 5 / .06, 1.0, f"{P}:171")
    check("ps1.5", "c V0", 31318, 2500 * 1.02 ** 5 / .06 / 1.08 ** 5, 1.0, f"{P}:172")
    # Ex 6
    im = 1.09 ** (1 / 12) - 1
    check("ps1.6", "i12", .007207, im, 5e-7, f"{P}:192")
    vm = ann(600, im, 120)
    vg = gann(2000, .09, .04, 10)
    check("ps1.6", "a renta mensual", 55612, vm, 1.0, f"{P}:194")
    check("ps1.6", "b creciente", 16756, vg, 1.0, f"{P}:195")
    check("ps1.6", "c total", 72368, vm + vg, 1.0, f"{P}:196")
    check("ps1.6", "d prepagable", 56013, vm * (1 + im), 1.0, f"{P}:198")
    # Ex 7
    cfs = [40000, 45000, 50000, 55000]
    pv = [c / 1.1 ** (t + 1) for t, c in enumerate(cfs)]
    for t, (p, d) in enumerate(zip(pv, [36364, 37190, 37565, 37565]), 1):
        check("ps1.7", f"PV term t={t}", d, p, 1.0, f"{P}:212")
    check("ps1.7", "VAN", 28684, sum(pv) - 120000, 1.0, f"{P}:213")
    # Ex 8 (miles)
    check("ps1.8", "a PR", 2.70, 2 + (120 - 85) / 50, src=f"{P}:227")
    for t, d in enumerate([36.36, 69.55, 94.20, 112.95], 1):
        check("ps1.8", f"b PRD cumulative t={t}", d, sum(pv[:t]) / 1000, src=f"{P}:228")
    check("ps1.8", "b PRD", 3.46, 3 + (120 - sum(pv[:3]) / 1000) / (pv[3] / 1000), src=f"{P}:228")
    # Ex 9
    x = (3 + 69 ** .5) / 10
    check("ps1.9", "a TIR", .1307, x - 1, 5e-5, f"{P}:275")
    check("ps1.9", "a sqrt69", 8.3066, 69 ** .5, 5e-5, f"{P}:271")
    check("ps1.9", "residual NPV(TIR)=0", 0, -100 + 60 / x + 60 / x ** 2, 1e-9, f"{P}:254")
    # Ex 10
    check("ps1.10", "a VAN A", 90.91, -1000 + 1200 / 1.1, src=f"{P}:315")
    check("ps1.10", "a VAN B", 90.91, -1000 + 200 / 1.1 + 1100 / 1.21, src=f"{P}:320")
    check("ps1.10", "b PR A", .833, 1000 / 1200, 5e-4, f"{P}:323")
    check("ps1.10", "b PR B", 1.73, 1 + 800 / 1100, src=f"{P}:324")
    check("ps1.10", "b PRD A", .917, 1000 / (1200 / 1.1), 5e-4, f"{P}:326")
    check("ps1.10", "b PRD B", 1.90, 1 + (1000 - 200 / 1.1) / (1100 / 1.21), src=f"{P}:327")
    check("ps1.10", "c TIR A", .20, 1200 / 1000 - 1, 1e-9, f"{P}:333")
    xb = (2 + 444 ** .5) / 20
    check("ps1.10", "c TIR B", .154, xb - 1, 5e-4, f"{P}:358")
    check("ps1.10", "c sqrt444", 21.071, 444 ** .5, 5e-4, f"{P}:354")

    # Exam (rentas), exam_rentas_solutions.tex:44-93: symbolic answer, test numerically
    E = "exam_rentas_solutions.tex"
    A, beta, gam = 100.0, .02, .01
    i2 = (1 + gam) ** 2 - 1
    g2 = (1 + beta) ** .5 - 1
    # brute force: payments at t=2 (4 semesters out), 2.5, 3, ... growing by g2 per semester, discounted at i2/semester
    brute = sum(A * (1 + g2) ** k / (1 + i2) ** (4 + k) for k in range(0, 20000))
    opt_b = A / (((1 + gam) ** 2 - (1 + beta) ** .5) * (1 + gam) ** 6)
    opt_a = A / ((1 + gam) ** 2 - (1 + beta) ** .5)
    check("exam.1", "option b = brute-force PV", brute, opt_b, 1e-6, f"{E}:45,91")
    ok_a = abs(brute - opt_a) > 1.0
    check("exam.1", "option a is NOT the PV (distractor)", 1, int(ok_a), 0, f"{E}:44")


if __name__ == "__main__":
    run()
