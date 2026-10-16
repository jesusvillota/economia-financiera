#!/usr/bin/env python3
"""Recompute every numeric answer of ps1..ps4 and the rentas exam.

Prints OK/MISMATCH per check, then a per-set summary. Exit 0 always (a mismatch is a finding, not a failure).
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common, ps1, ps2, ps3, ps4

summary = []
for name, m in (("ps1+exam", ps1), ("ps2", ps2), ("ps3", ps3), ("ps4", ps4)):
    n0 = len(common.RESULTS)
    m.run()
    r = common.RESULTS[n0:]
    summary.append(f"  {name}: {sum(x[2] for x in r)} OK / {sum(not x[2] for x in r)} MISMATCH")
print("\nSUMMARY (set: OK / MISMATCH)")
print("\n".join(summary))
