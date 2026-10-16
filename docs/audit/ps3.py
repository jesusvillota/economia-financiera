"""Audit of ps3_solutions.tex: recompute every numeric answer."""
import os, sys
from math import sqrt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import check

F = 'ps3_solutions.tex:'
P = 0.006      # 2 dp in percent  (e.g. 14.31%)
P4 = 0.00006   # 4 dp decimals (0.1431)


def sd(w1, s1, s2, rho):
    return sqrt(w1**2*s1**2 + (1-w1)**2*s2**2 + 2*w1*(1-w1)*rho*s1*s2)


def mv(s1, s2, rho):
    return (s2**2 - rho*s1*s2) / (s1**2 + s2**2 - 2*rho*s1*s2)


def run():
    # Ex 1
    mu = .5*.12 + .5*.08
    check(1, 'a mean', 10, mu*100, tol=P, src=F+'83')
    for rho, doc, ln in [(1, 16.50, 107), (.5, 14.31, 116), (0, 11.72, 124), (-.5, 8.35, 132), (-1, 1.5, 140)]:
        check(1, f'a sd rho={rho}', doc, sd(.5, .18, .15, rho)*100, tol=P, src=F+str(ln))
    check(1, 'a var const', .013725, .5**2*.18**2 + .5**2*.15**2, tol=1e-9, src=F+'97')
    check(1, 'b sd rho=1 text', 16.5, sd(.5, .18, .15, 1)*100, tol=P, src=F+'207')
    check(1, 'b sd rho=-1 text', 1.5, sd(.5, .18, .15, -1)*100, tol=P, src=F+'209')
    w = mv(.18, .15, .3)
    check(1, 'c num', .0144, .15**2 - .3*.18*.15, tol=1e-9, src=F+'223')
    check(1, 'c den', .0387, .18**2 + .15**2 - 2*.3*.18*.15, tol=1e-9, src=F+'223')
    check(1, 'c wA', .3721, w, tol=P4, src=F+'223')
    check(1, 'c wB', .6279, 1-w, tol=P4, src=F+'226')
    check(1, 'c mean', 9.49, (w*.12 + (1-w)*.08)*100, tol=P, src=F+'232')
    v = sd(w, .18, .15, .3)**2
    check(1, 'c var', .017148, v, tol=1e-5, src=F+'243')
    check(1, 'c sd', 13.09, sqrt(v)*100, tol=P, src=F+'246')
    check(1, 'c var term1', .004487, w**2*.18**2, tol=1e-5, src=F+'243')
    check(1, 'c var term2', .008872, (1-w)**2*.15**2, tol=1e-5, src=F+'243')
    check(1, 'c var term3', .003789, 2*w*(1-w)*.3*.18*.15, tol=1e-5, src=F+'243')

    # Ex 2
    for tag, rho, wd, md, vd, sdd, ln in [('a', .8, .2667, 9.27, .038719, 19.68, 287),
                                           ('c', -.2, .4604, 9.46, .017536, 13.24, 320)]:
        w = mv(.22, .20, rho)
        check(2, tag+' wS', wd, w, tol=P4, src=F+str(ln))
        check(2, tag+' wT', 1-wd, 1-w, tol=P4, src=F+str(ln+3))
        check(2, tag+' mean', md, (w*.10 + (1-w)*.09)*100, tol=P, src=F+str(ln+9))
        v = sd(w, .22, .20, rho)**2
        check(2, tag+' var', vd, v, tol=1e-5, src=F+str(ln+20))
        check(2, tag+' sd', sdd, sqrt(v)*100, tol=P, src=F+str(ln+23))
    check(2, 'a den', .0180, .22**2 + .2**2 - 2*.8*.22*.2, tol=1e-9, src=F+'287')
    check(2, 'a num', .0048, .04 - .8*.22*.2, tol=1e-9, src=F+'287')
    w = mv(.22, .20, .8)
    check(2, 'a var t1', .003441, w**2*.22**2, tol=1e-5, src=F+'307')
    check(2, 'a var t2', .021508, (1-w)**2*.04, tol=1e-5, src=F+'307')
    check(2, 'a var t3', .013770, 2*w*(1-w)*.8*.22*.2, tol=1e-5, src=F+'307')
    w = mv(.22, .20, -.2)
    check(2, 'c den', .1060, .22**2 + .04 + 2*.2*.22*.2, tol=1e-9, src=F+'320')
    check(2, 'c var t1', .010260, w**2*.22**2, tol=1e-5, src=F+'340')
    check(2, 'c var t2', .011648, (1-w)**2*.04, tol=1e-5, src=F+'340')
    check(2, 'c var t3', -.004372, 2*w*(1-w)*-.2*.22*.2, tol=1e-5, src=F+'340')
    check(2, 'b=a same weight', .2667, mv(.22, .20, .8), tol=P4, src=F+'313')
    check(2, 'd=c same weight', .4604, mv(.22, .20, -.2), tol=P4, src=F+'348')

    # Ex 3
    w = [.4, .35, .25]; m = [.14, .11, .09]; s = [.25, .18, .15]
    R = [[1, .45, .30], [.45, 1, .55], [.30, .55, 1]]
    C = [[R[i][j]*s[i]*s[j] for j in range(3)] for i in range(3)]
    check(3, 'a mean', 11.7, sum(a*b for a, b in zip(w, m))*100, tol=P, src=F+'396')
    for (i, j), d, ln in [((0, 1), .02025, 403), ((0, 2), .01125, 404), ((1, 2), .01485, 405)]:
        check(3, f'c cov{i+1}{j+1}', d, C[i][j], tol=1e-9, src=F+str(ln))
    terms = [(.010000, w[0]**2*C[0][0], 431), (.003969, w[1]**2*C[1][1], 432), (.001406, w[2]**2*C[2][2], 433),
             (.005670, 2*w[0]*w[1]*C[0][1], 434), (.002250, 2*w[0]*w[2]*C[0][2], 435), (.002599, 2*w[1]*w[2]*C[1][2], 436)]
    for k, (d, c, ln) in enumerate(terms):
        check(3, f'b term{k+1}', d, c, tol=1e-5, src=F+str(ln))
    v = sum(w[i]*w[j]*C[i][j] for i in range(3) for j in range(3))
    check(3, 'b var', .025894, v, tol=1e-5, src=F+'441')
    check(3, 'b sd', 16.09, sqrt(v)*100, tol=P, src=F+'446')

    # Ex 4
    rf, mc, sc = .04, .13, .18
    check(4, 'a mean', 9.4, (.4*rf + .6*mc)*100, tol=P, src=F+'505')
    check(4, 'a var', .011664, (.6*sc)**2, tol=1e-9, src=F+'510')
    check(4, 'a sd', 10.80, .6*sc*100, tol=P, src=F+'515')
    check(4, 'b mean', 14.8, (-.2*rf + 1.2*mc)*100, tol=P, src=F+'527')
    check(4, 'b var', .046656, (1.2*sc)**2, tol=1e-9, src=F+'532')
    check(4, 'b sd', 21.60, 1.2*sc*100, tol=P, src=F+'537')
    sh = (mc-rf)/sc
    check(4, 'c slope', .5, sh, tol=1e-9, src=F+'560')
    check(4, 'd sharpe', .5, sh, tol=1e-9, src=F+'565')
    w = .12/sc
    check(4, 'e w', .6667, w, tol=P4, src=F+'572')
    check(4, 'e w rf %', 33.33, (1-w)*100, tol=P, src=F+'575')
    check(4, 'e mean', 10, ((1-w)*rf + w*mc)*100, tol=P, src=F+'579')
    check(4, 'e CAL mean', 10, (rf + sh*.12)*100, tol=P, src=F+'584')

    # Ex 5
    rfm, rm, vm = .035, .11, .0016
    for n, cv, b, req, obs in [('X', .0028, 1.75, 16.625, 14), ('Y', .0012, .75, 9.125, 6), ('Z', .0036, 2.25, 20.375, 15)]:
        ln = {'X': 625, 'Y': 626, 'Z': 627}[n]
        beta = cv/vm
        check(5, f'a beta {n}', b, beta, tol=1e-9, src=F+str(ln))
        r = (rfm + beta*(rm-rfm))*100
        check(5, f'c req {n}', req, r, tol=1e-9, src=F+str(ln+24))
        dd = {'X': -2.625, 'Y': -3.125, 'Z': -5.375}[n]
        check(5, f'd diff {n}', dd, obs - r, tol=1e-9, src=F+str(660+'XYZ'.index(n)+1))
    check(5, 'c premium', 7.5, (rm-rfm)*100, tol=1e-9, src=F+'644')
    check(5, 'c X parts', .13125, 1.75*.075, tol=1e-9, src=F+'649')
    check(5, 'c Y parts', .05625, .75*.075, tol=1e-9, src=F+'650')
    check(5, 'c Z parts', .16875, 2.25*.075, tol=1e-9, src=F+'651')
    check(5, 'text Z dev', 5.375, 20.375-15, tol=1e-9, src=F+'760')
    check(5, 'text Y dev', 3.125, 9.125-6, tol=1e-9, src=F+'760')
    check(5, 'text X dev', 2.625, 16.625-14, tol=1e-9, src=F+'760')
    check(5, 'plot SML at beta 2.5', 22.25, 3.5+2.5*7.5, tol=1e-9, src=F+'700')

    # Ex 6
    b = [.8, 1.2, 1.5, .6]
    w0 = [.25, .30, .20, .25]; w1 = [.30, .25, .25, .20]
    bp0 = sum(x*y for x, y in zip(w0, b)); bp1 = sum(x*y for x, y in zip(w1, b))
    for d, c, ln in [(.20, .25*.8, 801), (.36, .3*1.2, 801), (.30, .2*1.5, 801), (.15, .25*.6, 801)]:
        check(6, 'a term', d, c, tol=1e-9, src=F+str(ln))
    check(6, 'a beta', 1.01, bp0, tol=1e-9, src=F+'801')
    check(6, 'b ER', 10.07, (.03+bp0*.07)*100, tol=P, src=F+'813')
    for d, c in [(.24, .3*.8), (.30, .25*1.2), (.375, .25*1.5), (.12, .2*.6)]:
        check(6, 'c term', d, c, tol=1e-9, src=F+'823')
    check(6, 'c beta', 1.035, bp1, tol=1e-9, src=F+'823')
    check(6, 'c ER', 10.245, (.03+bp1*.07)*100, tol=1e-9, src=F+'828')
    check(6, 'd table beta0', 1.01, bp0, tol=1e-9, src=F+'838')
    check(6, 'd table ER1', 10.245, (.03+bp1*.07)*100, tol=1e-9, src=F+'839')

    # Ex 7
    s1, s2, rho = .20, .16, .35
    check(7, 'a mean', 10.5, (.5*.12 + .5*.09)*100, tol=P, src=F+'896')
    check(7, 'a var t3', .0056, .25*2*rho*s1*s2, tol=1e-9, src=F+'907')
    check(7, 'a var', .0220, sd(.5, s1, s2, rho)**2, tol=1e-5, src=F+'907')
    check(7, 'a sd', 14.87, sd(.5, s1, s2, rho)*100, tol=P, src=F+'912')
    check(7, 'b den', .0432, s1**2 + s2**2 - 2*rho*s1*s2, tol=1e-9, src=F+'925')
    check(7, 'b num', .0144, s2**2 - rho*s1*s2, tol=1e-9, src=F+'925')
    w = mv(s1, s2, rho)
    check(7, 'b w', .3333, w, tol=P4, src=F+'925')
    check(7, 'c mean', 10, (w*.12 + (1-w)*.09)*100, tol=P, src=F+'934')
    v = sd(w, s1, s2, rho)**2
    check(7, 'c var t1', .004444, w**2*s1**2, tol=1e-5, src=F+'945')
    check(7, 'c var t2', .011378, (1-w)**2*s2**2, tol=1e-5, src=F+'945')
    check(7, 'c var t3', .004977, 2*w*(1-w)*rho*s1*s2, tol=1e-5, src=F+'945')
    check(7, 'c var', .020799, v, tol=1e-5, src=F+'945')
    check(7, 'c sd', 14.42, sqrt(v)*100, tol=P, src=F+'950')
    shp = .07/sqrt(v)
    check(7, 'd sharpe', .4856, shp, tol=P4, src=F+'957')
    check(7, 'e INDITEX req', 12.1, (.03+1.3*.07)*100, tol=1e-9, src=F+'971')
    check(7, 'e REPSOL req', 9.3, (.03+.9*.07)*100, tol=1e-9, src=F+'976')
    wf = .10/sqrt(v)
    check(7, 'f w', .6935, wf, tol=P4, src=F+'989')
    check(7, 'f w %', 69.35, wf*100, tol=P, src=F+'992')
    check(7, 'f rf %', 30.65, (1-wf)*100, tol=P, src=F+'992')
    check(7, 'f mean', 7.85, ((1-wf)*.03 + wf*.10)*100, tol=P, src=F+'996')
    check(7, 'f CAL mean', 7.85, (.03 + shp*.10)*100, tol=P, src=F+'1001')
    check(7, 'obs min-var < equal-w sd', 1, 1 if sqrt(v) < sd(.5, s1, s2, rho) else 0, tol=0, src=F+'953')


if __name__ == '__main__':
    run()
