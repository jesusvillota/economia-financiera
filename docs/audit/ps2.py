"""Audit of ps2_solutions.tex: recompute every numeric answer."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import check

F = 'ps2_solutions.tex:'


def pv(cfs, r):
    return [c / (1 + r) ** (i + 1) for i, c in enumerate(cfs)]


def run():
    # Ex 1
    r = .11
    a, b, c = 2.2 / 1.11, 2.38 / 1.11**2, 2.56 / 1.11**3
    p3 = 34 / 1.11**3
    p0 = a + b + c + p3
    check(1, 'PV D1', 1.982, a, .0006, F + '62')
    check(1, 'PV D2', 1.932, b, .0006, F + '62')
    check(1, 'PV (D3+P3)', 26.732, c + p3, .0006, F + '62')
    check(1, 'P0', 30.65, p0, .006, F + '63')
    check(1, 'PV D3', 1.871, c, .001, F + '67')
    check(1, 'PV dividends', 5.785, a + b + c, .0006, F + '67')
    check(1, '% dividends', 18.87, 100 * (a + b + c) / p0, .006, F + '69')
    check(1, '% resale', 81.13, 100 * p3 / p0, .006, F + '69')
    # Ex 2
    g = .09 - 1.5 / 30
    check(2, 'a g', .04, g, 1e-9, F + '85')
    pn = 1.5 * 1.05 / (.09 - g)
    check(2, 'b D1 new', 1.575, 1.575, 1e-9, F + '87')
    check(2, 'b P0 new', 31.50, pn, .006, F + '89')
    check(2, 'b % change', 5, 100 * (pn / 30 - 1), .006, F + '91')
    # Ex 3
    r = .10
    d = [1.1 * 1.15**k for k in (1, 2, 3)]
    check(3, 'D1', 1.265, d[0], .00005, F + '109')
    check(3, 'D2', 1.4548, d[1], .0001, F + '109')
    check(3, 'D3', 1.6730, d[2], .00005, F + '109')

    def p0_of(g2, round_p3=None):
        p3 = d[2] * (1 + g2) / (r - g2)
        return d[0] / 1.1 + d[1] / 1.21 + (d[2] + (p3 if round_p3 is None else round_p3)) / 1.331, p3
    check(3, 'a D4', 1.7399, d[2] * 1.04, .00005, F + '111')
    p0a, p3a = p0_of(.04)
    check(3, 'a P3', 28.998, p3a, .0006, F + '113')
    check(3, 'a PV D1', 1.150, d[0] / 1.1, .0006, F + '119')
    check(3, 'a PV D2', 1.202, d[1] / 1.21, .0006, F + '119')
    check(3, 'a PV (D3+P3)', 23.045, (d[2] + 29.00) / 1.331, .0006, F + '119')
    check(3, 'a P0', 25.40, p0a, .006, F + '119')
    check(3, 'b D4', 1.7567, d[2] * 1.05, .0001, F + '122')
    p0b, p3b = p0_of(.05)
    check(3, 'b P3', 35.134, p3b, .003, F + '124')
    check(3, 'b PV (D3+P3)', 27.651, (d[2] + 35.13) / 1.331, .0006, F + '129')
    check(3, 'b P0', 30.00, p0b, .006, F + '129')
    check(3, 'b increase EUR', 4.60, p0b - p0a, .006, F + '131')
    check(3, 'b increase %', 18.1, 100 * (p0b / p0a - 1), .06, F + '131')
    p1 = d[1] / 1.1 + (d[2] + p3a) / 1.21
    check(3, 'c PV D2 at t=1', 1.3225, d[1] / 1.1, .00006, F + '135')
    check(3, 'c PV (D3+P3) at t=1', 25.3471, (d[2] + p3a) / 1.21, .0006, F + '135')
    check(3, 'c P1', 26.67, p1, .006, F + '135')
    check(3, 'c div yield %', 4.98, 100 * d[0] / p0a, .006, F + '139')
    check(3, 'c cap gain %', 5.01, 100 * (p1 - p0a) / p0a, .006, F + '142')
    check(3, 'c total %', 10.0, 100 * (d[0] + p1 - p0a) / p0a, 1e-9, F + '144')
    # Ex 4
    fcff = 200 * .7 + 25 - 60 - 15
    check(4, 'a EBIT(1-T)', 140, 140, 1e-9, F + '166')
    check(4, 'a FCFF', 90, fcff, 1e-9, F + '166')
    check(4, 'b FCFE', 50, 90 + 25 - 60 - 15 + 10, 1e-9, F + '173')
    # Ex 5
    re_ = .03 + 1.2 * .06
    wacc = .6 * re_ + .4 * .05 * .7
    check(5, 'a Re %', 10.2, 100 * re_, 1e-9, F + '197')
    check(5, 'a WACC %', 7.52, 100 * wacc, 1e-9, F + '203')
    cf = [95, 110, 125, 140, 150]
    docs = [88.36, 95.15, 100.56, 104.75, 104.39]
    pvs = pv(cf, wacc)
    for i, (x, y) in enumerate(zip(docs, pvs)):
        check(5, f'b PV FCFF{i+1}', x, y, .006, F + str(208 + 2 * (i // 2)))
    tv = 154.5 / (wacc - .03)
    check(5, 'b FCFF6', 154.5, 150 * 1.03, 1e-9, F + '216')
    check(5, 'b TV5', 3418.14, tv, .006, F + '216')
    pvtv = tv / (1 + wacc)**5
    check(5, 'b PV TV', 2378.72, pvtv, .006, F + '220')
    ev = sum(pvs) + pvtv
    check(5, 'b EV (doc terms)', 2871.93, sum(docs) + 2378.72, .006, F + '224')
    check(5, 'b EV (exact)', 2871.93, ev, .006, F + '224')
    # FCFE
    fe = pv([85, 90, 96], .10)
    check(5, 'c PV FCFE1', 77.27, fe[0], .006, F + '229')
    check(5, 'c PV FCFE2', 74.38, fe[1], .006, F + '230')
    check(5, 'c PV FCFE3', 72.17, fe[2], .006, F + '231')
    tv3 = 96 * 1.02 / .08
    check(5, 'c TV3', 1224, tv3, .006, F + '235')
    check(5, 'c PV TV3', 919.62, tv3 / 1.331, .006, F + '239')
    eq = sum(fe) + tv3 / 1.331
    check(5, 'c Equity', 1143.44, eq, .006, F + '243')
    check(5, 'c P0/share', 19.06, eq / 60, .006, F + '247')
    # Ex 7
    re7 = .025 + 1.25 * .06
    w7 = .2 * re7 + .8 * .052 * .7
    check(7, 'a Re %', 10.0, 100 * re7, 1e-9, F + '268')
    check(7, 'a Rd(1-T) %', 3.64, 100 * .052 * .7, 1e-9, F + '268')
    check(7, 'a WACC %', 4.912, 100 * w7, 5e-4, F + '271')

    def proj(w, base_line, tag, d_pv, d_tv, d_pvtv, d_tot, d_van):
        p = pv([55, 60, 68, 75], w)
        for i in range(4):
            check(7, f'{tag} PV{i+1}', d_pv[i], p[i], .006, F + str(base_line + 2 * (i // 2)))
        tv = 75 * 1.02 / (w - .02)
        check(7, f'{tag} TV4', d_tv, tv, .006, F + str(d_tv_line[tag]))
        ptv = tv / (1 + w)**4
        check(7, f'{tag} PV TV', d_pvtv, ptv, .006, F + str(d_pvtv_line[tag]))
        tot = sum(p) + ptv
        check(7, f'{tag} total PV (doc terms)', d_tot, sum(d_pv) + d_pvtv, .006, F + str(d_tot_line[tag]))
        check(7, f'{tag} total PV (exact)', d_tot, tot, .006, F + str(d_tot_line[tag]))
        check(7, f'{tag} NPV', d_van, tot - 950, .006, F + str(d_van_line[tag]))
        return tot - 950
    d_tv_line = {'b': 282, 'c1': 301, 'c2': 324}
    d_pvtv_line = {'b': 284, 'c1': 305, 'c2': 328}
    d_tot_line = {'b': 284, 'c1': 309, 'c2': 332}
    d_van_line = {'b': 286, 'c1': 310, 'c2': 333}
    van = proj(w7, 275, 'b', [52.42, 54.51, 58.89, 61.91], 2627.06, 2168.55, 2396.29, 1446.29)
    vlo = proj(w7 - .01, 294, 'c1', [52.93, 55.53, 60.54, 64.42], 4001.05, 3431.71, 3665.13, 2715.13)
    vhi = proj(w7 + .01, 317, 'c2', [51.93, 53.52, 57.33, 59.52], 1955.52, 1554.11, 1776.41, 826.41)
    check(7, 'c WACC low %', 3.912, 100 * (w7 - .01), 5e-4, F + '290')
    check(7, 'c WACC high %', 5.912, 100 * (w7 + .01), 5e-4, F + '313')
    check(7, 'c dVAN low', 1268.84, vlo - van, .006, F + '338')
    check(7, 'c dVAN low %', 87.7, 100 * (vlo / van - 1), .06, F + '338')
    check(7, 'c dVAN high', 619.88, van - vhi, .006, F + '338')
    check(7, 'c dVAN high %', 42.9, 100 * (1 - vhi / van), .06, F + '338')
    # Ex 8
    p = [.3, .5, .2]
    A = [.18, .05, -.07]; B = [.07, .04, -.02]; M = [.12, .06, -.03]
    E = lambda x: sum(pi * xi for pi, xi in zip(p, x))
    Cv = lambda x, y: E([xi * yi for xi, yi in zip(x, y)]) - E(x) * E(y)
    eA, eB, eM = E(A), E(B), E(M)
    check(8, 'a E[rA]', .065, eA, 1e-9, F + '368')
    check(8, 'a E[rB]', .037, eB, 1e-9, F + '369')
    vA, vB, vM = Cv(A, A), Cv(B, B), Cv(M, M)
    check(8, 'a Var A', .00773, vA, 5e-6, F + '380')
    check(8, 'a Var B', .00098, vB, 5e-6, F + '383')
    check(8, 'a E[rA^2]', .01195, E([x * x for x in A]), 5e-6, F + '387')
    check(8, 'a E[rB^2]', .00235, E([x * x for x in B]), 5e-6, F + '391')
    check(8, 'a sd A %', 8.79, 100 * math.sqrt(vA), .006, F + '395')
    check(8, 'a sd B %', 3.13, 100 * math.sqrt(vB), .006, F + '395')
    cAB = Cv(A, B)
    check(8, 'b Cov AB (dev)', .00266, cAB, 6e-6, F + '405')
    check(8, 'b E[rA rB]', .00506, E([x * y for x, y in zip(A, B)]), 5e-6, F + '410')
    check(8, 'b Cov AB (E[XY])', .00266, cAB, 6e-6, F + '411')
    check(8, 'b Cov AB used in rho', .002655, cAB, 5e-7, F + '415')
    check(8, 'b sdA*sdB', .002753, math.sqrt(vA * vB), 5e-7, F + '415')
    check(8, 'b rho', .964, cAB / math.sqrt(vA * vB), .0006, F + '415')
    check(8, 'c E[rM] %', 6.0, 100 * eM, 1e-9, F + '419')
    check(8, 'c Var M', .0027, vM, 5e-6, F + '421')
    check(8, 'c sd M %', 5.20, 100 * math.sqrt(vM), .006, F + '423')
    cAM, cBM = Cv(A, M), Cv(B, M)
    check(8, 'c Cov AM', .0045, cAM, 5e-6, F + '426')
    check(8, 'c Cov BM', .00162, cBM, 5e-6, F + '428')
    check(8, 'c E[rA rM]', .0084, E([x * y for x, y in zip(A, M)]), 5e-6, F + '433')
    check(8, 'c E[rB rM]', .00384, E([x * y for x, y in zip(B, M)]), 5e-6, F + '438')
    check(8, 'c beta A', 1.67, cAM / vM, .006, F + '443')
    check(8, 'c beta B', 0.60, cBM / vM, .006, F + '444')
    # Ex 9
    P0 = [48, 50, 49, 51, 53, 52]; P1 = [50, 49, 51, 53, 52, 55]
    D = [.3, .3, .3, .3, .35, .35]
    R = [(b + dv - a) / a for a, b, dv in zip(P0, P1, D)]
    for i, (x, line) in enumerate(zip([.0479, -.0140, .0469, .0451, -.0123, .0644], range(476, 482))):
        check(9, f'a R{i+1}', x, R[i], 5e-5, F + str(line))
    m = sum(R) / 6
    check(9, 'b mean %', 2.97, 100 * m, .006, F + '488')
    check(9, 'b mean (6dp)', .029685, m, 5e-7, F + '487')
    dev = [(x - m)**2 for x in R]
    for i, (x, line) in enumerate(zip([.000332, .001908, .000298, .000238, .001760, .001207], range(496, 502))):
        check(9, f'b sq dev {i+1}', x, dev[i], 5e-7, F + str(line))
    ss = sum(dev)
    check(9, 'b sum sq dev', .005742, ss, 5e-7, F + '505')
    s = math.sqrt(ss / 5)
    check(9, 'b s', .03388, s, 2e-5, F + '509')
    check(9, 'b s monthly %', 3.39, 100 * s, .006, F + '509')
    check(9, 'b s annual %', 11.74, 100 * s * math.sqrt(12), .006, F + '513')
    # Appendix examples
    pa = [.3, .5, .2]; r1 = [.10, .05, -.03]
    e1 = sum(x * y for x, y in zip(pa, r1))
    check('App', 'E[r] %', 4.9, 100 * e1, 1e-9, F + '614')
    v1 = sum(x * (y - e1)**2 for x, y in zip(pa, r1))
    check('App', 'Var r', .00203, v1, 5e-6, F + '640')
    check('App', 'sd %', 4.51, 100 * math.sqrt(v1), .006, F + '643')
    ra = [.12, .06, -.02]; rb = [.08, .05, .01]
    ea = sum(x * y for x, y in zip(pa, ra)); eb = sum(x * y for x, y in zip(pa, rb))
    check('App', 'E[rA] %', 6.2, 100 * ea, 1e-9, F + '671')
    check('App', 'E[rB] %', 5.3, 100 * eb, 1e-9, F + '671')
    cv = sum(q * (x - ea) * (y - eb) for q, x, y in zip(pa, ra, rb))
    check('App', 'Cov AB (exact means)', .00118, cv, 5e-6, F + '677')
    check('App', 'beta A', 1.67, .0045 / .0027, .006, F + '700')


if __name__ == '__main__':
    run()
