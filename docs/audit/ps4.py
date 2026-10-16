"""Recompute every numeric answer in source/problem_sets/ps4/ps4_solutions.tex."""
import os, sys
from math import sqrt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import check

S = "ps4_solutions.tex:"


def bisect(f, lo, hi):
    for _ in range(200):
        mid = (lo + hi) / 2
        if f(lo) * f(mid) <= 0: hi = mid
        else: lo = mid
    return (lo + hi) / 2


def run():
    # Ex1
    cost, loan = 400 * 35, 4500
    check(1, "a margin EUR", 9500, cost - loan, 0.5, S + "60")
    check(1, "a margin %", 67.9, 100 * (cost - loan) / cost, 0.05, S + "60")
    debt = loan * 1.09
    check(1, "b debt", 4905, debt, 0.5, S + "61")
    m = 400 * 28 - debt
    check(1, "b margin", 6295, m, 0.5, S + "61")
    check(1, "c margin %", 56.2, 100 * m / 11200, 0.05, S + "62")
    check(1, "d return %", -33.7, 100 * (m - 9500) / 9500, 0.05, S + "63")
    check(1, "d price chg %", -20, 100 * (28 - 35) / 35, 0.05, S + "63")

    # Ex2
    cash = 800 * 48
    check(2, "a cash", 38400, cash, 0.5, S + "79")
    check(2, "a margin", 19200, 0.5 * cash, 0.5, S + "79")
    check(2, "b loss", 5600, (55 - 48) * 800, 0.5, S + "80")
    check(2, "b dividend", 1200, 1.5 * 800, 0.5, S + "80")
    m = 19200 - 5600 - 1200
    check(2, "b margin", 12400, m, 0.5, S + "80")
    check(2, "c liability", 44000, 55 * 800, 0.5, S + "81")
    check(2, "c margin %", 28.2, 100 * m / 44000, 0.05, S + "81")
    check(2, "d return %", -35.4, 100 * (m - 19200) / 19200, 0.05, S + "82")
    check(2, "d price chg %", 14.6, 100 * 7 / 48, 0.05, S + "82")

    # Ex3
    check(3, "a spread", 0.50, 62.30 - 61.80, 0.006, S + "111")
    check(3, "a avg size", 300, (400 + 200) / 2, 0.5, S + "111")
    p300 = (200 * 62.30 + 100 * 63.10) / 300
    check(3, "b avg price", 62.57, p300, 0.006, S + "112")
    tot = 200 * 62.30 + 300 * 63.10 + 400 * 64.00
    p900 = tot / 900
    check(3, "c avg price", 63.32, p900, 0.006, S + "113")
    check(3, "c total", 56990, tot, 0.5, S + "113")
    check(3, "d notional", 55800, 900 * 62, 0.5, S + "114")
    check(3, "d cost", 1190, tot - 55800, 0.5, S + "114")
    check(3, "d cost %", 2.13, 100 * (tot - 55800) / 55800, 0.006, S + "114")

    # Ex4
    mk = [3, 1, -2]; obs = [4.6, 2.0, -0.5]; exp = [1.2 * x for x in mk]
    for i, d in enumerate([3.6, 1.2, -2.4]):
        check(4, f"a E(r{i+1}) %", d, exp[i], 0.005, S + str(144 + i))
    ar = [o - e for o, e in zip(obs, exp)]
    for i, d in enumerate([1.0, 0.8, 1.9]):
        check(4, f"b AR{i+1} %", d, ar[i], 0.005, S + str(158 + i))
    check(4, "c CAR %", 3.7, sum(ar), 0.005, S + "172")

    # Ex6
    PA = 1000 / 1.035 ** 2
    check(6, "a P_A", 933.51, PA, 0.006, S + "207")
    check(6, "a PV coupon", 48.54, 50 / 1.03, 0.006, S + "214")
    check(6, "a PV principal", 980.18, 1050 / 1.035 ** 2, 0.006, S + "214")
    PB = 50 / 1.03 + 1050 / 1.035 ** 2
    check(6, "a P_B", 1028.72, PB, 0.006, S + "214")
    tirA = (1000 / 925) ** 0.5 - 1
    check(6, "b TIR_A %", 3.976, 100 * tirA, 0.0005, S + "226")
    # B: price 1035 = 50/x + 1050/x^2
    a, b, c = 1035, -50, -1050
    disc = b * b - 4 * a * c
    check(6, "b discriminant", 4349500, disc, 0.5, S + "249")
    check(6, "b sqrt", 2085.55, sqrt(disc), 0.006, S + "252")
    x = (-b + sqrt(disc)) / (2 * a)
    check(6, "b x", 1.0317, x, 0.00005, S + "255")
    check(6, "b TIR_B %", 3.17, 100 * (x - 1), 0.005, S + "260")
    check(6, "c PV C1", 48.46, 50 / x, 0.006, S + "282")
    check(6, "c PV C2+N", 986.54, 1050 / x ** 2, 0.006, S + "283")
    DB = (50 / x + 2 * 1050 / x ** 2) / 1035
    check(6, "c numerator", 2021.54, 50 / x + 2 * 1050 / x ** 2, 0.006, S + "289")
    check(6, "c D_B", 1.953, DB, 0.0005, S + "289")
    check(6, "c D_A", 2, 2, 0.0, S + "275")
    f = 1.035 * 1.045
    check(6, "d (1+r2)^2", 1.081575, f, 1e-6, S + "303")
    r2 = sqrt(f)
    check(6, "d r2 %", 4.0, 100 * (r2 - 1), 0.05, S + "311")
    # document uses r2 = 4.0% exactly
    check(6, "d P_A new", 924.56, 1000 / 1.04 ** 2, 0.006, S + "317")
    check(6, "d PV coupon new", 48.31, 50 / 1.035, 0.006, S + "318")
    check(6, "d PV principal new", 970.78, 1050 / 1.04 ** 2, 0.006, S + "318")
    check(6, "d P_B new", 1019.09, 50 / 1.035 + 1050 / 1.04 ** 2, 0.006, S + "318")

    # Ex8
    r = {1: .03, 2: .035, 3: .04, 4: .042, 5: .043}
    check(8, "a f11 %", 4.00, 100 * ((1 + r[2]) ** 2 / (1 + r[1]) - 1), 0.005, S + "361")
    # document uses r3 = 4.0% (table), 1.04^3 = 1.124864
    check(8, "b (1.04)^3", 1.124864, 1.04 ** 3, 1e-6, S + "369")
    check(8, "b f21 %", 5.00, 100 * ((1 + r[3]) ** 3 / (1 + r[2]) ** 2 - 1), 0.005, S + "371")
    g = (1 + r[3]) ** 3 / (1 + r[1])
    check(8, "c (1+f12)^2", 1.0921, g, 0.00005, S + "379")
    check(8, "c f12 %", 4.50, 100 * (sqrt(g) - 1), 0.005, S + "381")
    check(8, "c 2y effective %", 9.20, 100 * (1.045 ** 2 - 1), 0.005, S + "383")
    check(8, "e f11 example %", 4.0, 100 * ((1.035) ** 2 / 1.03 - 1), 0.005, S + "397")

    # Ex9
    px = (150000 * 101.00 + 150000 * 101.20 + 50000 * 101.50) / 350000
    check(9, "a avg price %", 101.16, px, 0.005, S + "441")
    cpn = 1000 * 0.145 / 4
    check(9, "a quarterly coupon", 36.25, cpn, 0.006, S + "443")
    acc = cpn / 3
    check(9, "a accrued", 12.08, acc, 0.006, S + "443")
    check(9, "a clean cost EUR", 354060, 350000 * 1.0116, 0.5, S + "443")
    check(9, "a accrued total", 4228, 350 * 12.08, 0.5, S + "443")
    check(9, "a total outlay", 358288, 350000 * 1.0116 + 350 * 12.08, 0.5, S + "443")
    out = 1011.6 + 12.08
    check(9, "b outlay/bond", 1023.68, out, 0.006, S + "465")
    # (b) YTM with the full schedule
    def pv(y, out=out):
        return sum(cpn / (1 + y) ** ((3 * k - 1) / 12) for k in range(1, 12)) + 1036.25 / (1 + y) ** (35 / 12) - out
    ytm = bisect(pv, 0.0, 1.0)
    check(9, "b YTM % (doc: 'below 14.5%')", 14.5, 100 * ytm, 0.0, S + "480")  # expected MISMATCH if YTM > 14.5
    # (c) sale
    sale = (100000 * 99.20 + 150000 * 99.00 + 100000 * 98.75) / 350000
    check(9, "c numerator", 34645000, 100000 * 99.20 + 150000 * 99.00 + 100000 * 98.75, 0.5, S + "492")
    check(9, "c avg sale %", 99.01, sale, 0.005, S + "492")
    check(9, "c sale/bond", 990.14, 10 * sale, 0.006, S + "494")
    check(9, "c accrued sale", 24.17, cpn * 2 / 3, 0.006, S + "500")
    check(9, "c sale+accrued", 1014.31, 10 * sale + cpn * 2 / 3, 0.006, S + "509")
    # internal consistency of the quadratic: 1,014.17 vs 1,014.31 appear in the text
    A, B = 1023.68, -36.25
    for lbl, C, ln in [("C=1014.31", -1014.31, 551), ("C=1014.17", -1014.17, 551)]:
        d = B * B - 4 * A * C
        check(9, f"c discriminant ({lbl})", 4154507.78, d, 0.5, S + str(ln))
    check(9, "c 36.25^2", 1314.06, 36.25 ** 2, 0.006, S + "551")
    d = B * B - 4 * A * (-1014.31)
    check(9, "c sqrt(disc)", 2038.26, sqrt(d), 0.006, S + "554")
    xx = (36.25 + sqrt(d)) / (2 * A)
    check(9, "c x", 1.0133, xx, 0.00005, S + "557")
    check(9, "c TIR % (doc flows)", 8.24, 100 * (xx ** 6 - 1), 0.005, S + "576")
    # TIR using the document's printed flows, solved numerically
    def f2(y, sale_total=1014.31):
        return 36.25 / (1 + y) ** (2 / 12) + sale_total / (1 + y) ** (4 / 12) - out
    check(9, "c TIR % (doc flows, numeric)", 8.24, 100 * bisect(f2, -0.9, 5), 0.005, S + "576")
    check(9, "c TIR % (corrected sale 98.9857)", 8.24,
          100 * bisect(lambda y: f2(y, 10 * sale + cpn * 2 / 3), -0.9, 5), 0.005, S + "576")
    check(9, "c capital loss %", 2.15, 100 * (101.16 - 99.01) / 101.16, 0.005, S + "579")

    # Ex10
    check(10, "a K", 48.67, 45 * 1.04 ** 2, 0.006, S + "613")
    check(10, "b 1.04^-1.5", 0.9426, 1.04 ** -1.5, 0.00005, S + "629")
    check(10, "b PV(K)", 45.24, 48 * 1.04 ** -1.5, 0.006, S + "629")
    check(10, "b value", 4.76, 50 - 48 * 1.04 ** -1.5, 0.006, S + "629")
    for lbl, st, d, ln in [("i", 52, 0.50, 655), ("ii", 48, -3.50, 663), ("iii", 44, -3.50, 671)]:
        check(10, f"c {lbl} net", d, max(st - 48, 0) - 3.5, 0.006, S + str(ln))
    check(10, "c breakeven", 51.50, 48 + 3.5, 0.006, S + "675")
    check(10, "d total net", -1.50, max(44 - 48, 0) + max(48 - 44, 0) - 3.5 - 2.0, 0.006, S + "694")


if __name__ == "__main__":
    run()
