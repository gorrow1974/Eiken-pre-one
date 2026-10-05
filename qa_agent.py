#!/usr/bin/env python3
"""CLES Release QA Agent. Exit 1 blocks release on critical failures."""
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
errors = []
warnings = []
checks = []


def check(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})
    if not ok:
        errors.append(f"{name}: {detail}")


def load(name):
    try:
        obj = json.loads((ROOT / name).read_text(encoding="utf-8"))
        check(f"JSON parse: {name}", True, "valid")
        return obj
    except Exception as exc:
        check(f"JSON parse: {name}", False, str(exc))
        return {}


def norm(value):
    return re.sub(r"\s+", " ", (value or "").strip().lower())


data = load("data.json")
weekly = load("weekly.json")
today = load("today.json")
load("storage_spec.json")

items = data.get("items", [])
weeks = weekly.get("weeks", [])

ids = [x.get("id") for x in items]
dups = sorted(k for k, v in Counter(ids).items() if k and v > 1)
check("Unique item IDs", not dups, f"duplicates={dups}" if dups else f"{len(ids)} unique IDs")

required = ["id", "type", "theme", "title", "chunk", "sentence", "jp"]
missing = [f"{x.get('id', '?')} missing {f}" for x in items for f in required if not x.get(f)]
check("Required item fields", not missing, "; ".join(missing[:20]) if missing else "all present")

item_map = {x.get("id"): x for x in items}
week_errors = []
for week in weeks:
    wid = week.get("id", "?")
    arr = week.get("item_ids", [])
    if len(arr) != 10:
        week_errors.append(f"{wid}: expected 10, got {len(arr)}")
    if len(set(arr)) != len(arr):
        week_errors.append(f"{wid}: duplicate IDs")
    absent = [x for x in arr if x not in item_map]
    if absent:
        week_errors.append(f"{wid}: missing {absent}")
check("Weekly pack integrity", not week_errors, "; ".join(week_errors) if week_errors else f"{len(weeks)} packs valid")

content_errors = []
for week in weeks:
    fps = defaultdict(list)
    for iid in week.get("item_ids", []):
        it = item_map.get(iid, {})
        fp = "|".join([norm(it.get("title")), norm(it.get("sentence")), norm(it.get("chunk"))])
        fps[fp].append(iid)
    for fp, matched in fps.items():
        if fp and len(matched) > 1:
            content_errors.append(f"{week.get('id')}: {matched}")
check("No identical questions within a week", not content_errors, "; ".join(content_errors) if content_errors else "no duplicates")

sentences = defaultdict(list)
for it in items:
    sentences[norm(it.get("sentence"))].append(it.get("id"))
global_dups = [v for k, v in sentences.items() if k and len(v) > 1]
check("No duplicate sentences globally", not global_dups, f"duplicates={global_dups}" if global_dups else "all unique")

balance_errors = []
for week in weeks:
    if "balanced" in (week.get("title") or "").lower():
        types = {item_map.get(i, {}).get("type") for i in week.get("item_ids", [])} - {None}
        if len(types) < 5:
            balance_errors.append(f"{week.get('id')}: {sorted(types)}")
check("Balanced Review type diversity", not balance_errors, "; ".join(balance_errors) if balance_errors else "5+ types included")

bad_dates = [k for k in today.get("days", {}) if not re.fullmatch(r"\d{2}-\d{2}", k)]
check("Today keys use MM-DD", not bad_dates, f"bad={bad_dates}" if bad_dates else "valid")

index_text = (ROOT / "index.html").read_text(encoding="utf-8")
refs = re.findall(r"(?:src|href)=[\"']([^\"'#?]+)", index_text)
missing_files = [r for r in refs if not r.startswith(("http://", "https://", "data:")) and not (ROOT / r).exists()]
check("HTML referenced files exist", not missing_files, f"missing={missing_files}" if missing_files else "all exist")

for js in ["app.js", "storage_manager.js"]:
    try:
        result = subprocess.run(["node", "--check", str(ROOT / js)], capture_output=True, text=True)
        check(f"JavaScript syntax: {js}", result.returncode == 0, "valid" if result.returncode == 0 else result.stderr.strip())
    except FileNotFoundError:
        warnings.append("Node unavailable; JavaScript syntax checks skipped")

try:
    result = subprocess.run(["node", str(ROOT / "storage_runtime_test.js")], capture_output=True, text=True)
    check("Storage runtime persistence", result.returncode == 0, result.stdout.strip() if result.returncode == 0 else (result.stderr.strip() or result.stdout.strip()))
except FileNotFoundError:
    warnings.append("Node unavailable; storage runtime persistence check skipped")

app_text = (ROOT / "app.js").read_text(encoding="utf-8")
app_match = re.search(r"APP_VERSION='([^']+)'", app_text)
html_match = re.search(r"v(\d+\.\d+\.\d+)", index_text)
app_version = app_match.group(1) if app_match else ""
html_version = html_match.group(1) if html_match else ""
check("Version consistency", bool(app_version and app_version == html_version), f"app={app_version}, html={html_version}")

report = {
    "schema": "cles-qa-report",
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "passed": not errors,
    "error_count": len(errors),
    "warning_count": len(warnings),
    "checks": checks,
    "errors": errors,
    "warnings": warnings,
}
(ROOT / "qa_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
lines = ["# CLES QA Report", "", f"Result: **{'PASS' if not errors else 'FAIL'}**", f"Errors: {len(errors)} / Warnings: {len(warnings)}", ""]
for c in checks:
    lines.append(f"- {'✅' if c['ok'] else '❌'} **{c['name']}** — {c['detail']}")
(ROOT / "QA_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
sys.exit(1 if errors else 0)
