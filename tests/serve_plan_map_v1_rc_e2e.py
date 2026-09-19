#!/usr/bin/env python3
"""Local-only browser fixture server for the Plan Map V1 release candidate.

All submitted plans live only in this process and disappear when it stops.
"""
from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from uuid import uuid4
from urllib.parse import parse_qs, urlsplit


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
DEV_MAPS_CONFIG = DOCS / "unsolo/plans/maps-key.dev.local.js"

PLANS: list[dict[str, object]] = []
COUNTS = {"feed": 0, "search": 0, "submit": 0, "maps_config": 0}


def json_bytes(value: object) -> bytes:
    return json.dumps(value, separators=(",", ":")).encode()


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, _format: str, *_args: object) -> None:
        return

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, status: int, value: object) -> None:
        body = json_bytes(value)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        split = urlsplit(self.path)
        if split.path == "/__viewport-e2e":
            query = parse_qs(split.query)
            maps_enabled = query.get("maps", ["0"])[0] == "1"
            form_open = query.get("form", ["0"])[0] == "1"
            revoke_after = query.get("revoke", ["0"])[0] == "1"
            date_mode = query.get("date_mode", ["flexible"])[0]
            body = f"""<!doctype html><meta charset=\"utf-8\"><title>RC viewport test</title>
<style>body{{margin:0;background:#111;color:#fff;font:14px monospace}} iframe{{border:0;display:block}} pre{{white-space:pre-wrap}}</style>
<iframe id=\"subject\" title=\"Plan Map viewport subject\"></iframe><pre id=\"result\">running</pre>
<script>
const consentKey = 'unsolo-plan-map-google-consent-v1';
if ({str(maps_enabled).lower()}) localStorage.setItem(consentKey, 'yes');
else localStorage.removeItem(consentKey);
const frame = document.querySelector('#subject');
const output = document.querySelector('#result');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function size(width, height) {{ frame.style.width = width + 'px'; frame.style.height = height + 'px'; }}
function sample(label) {{
  const d = frame.contentDocument; const w = frame.contentWindow;
  const root = d.documentElement; const header = d.querySelector('.site-header');
  const card = d.querySelector('.map-card'); const feed = d.querySelector('.feed-panel');
  const footer = d.querySelector('footer'); const script = d.querySelector('#unsolo-google-maps');
  const dialog = d.querySelector('#add-plan-dialog'); const fields = d.querySelector('.add-plan-fields');
  const panel = d.querySelector('.add-plan-panel'); const dateFields = d.querySelector('#exact-date-fields');
  const dateFrom = d.querySelector('#plan-date-from'); const dateTo = d.querySelector('#plan-date-to');
  const month = d.querySelector('#plan-month');
  const addPlan = d.querySelector('#add-plan-open'); const loadMaps = d.querySelector('#load-map');
  const addStyle = w.getComputedStyle(addPlan); const loadStyle = w.getComputedStyle(loadMaps);
  const googleResources = [...w.performance.getEntriesByType('resource')]
    .filter((entry) => /googleapis|gstatic/i.test(entry.name)).length;
  const panelRect = panel.getBoundingClientRect();
  const bounds = (control) => {{
    const rect = control.getBoundingClientRect();
    return {{ left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width),
      insidePanel: rect.left >= panelRect.left && rect.right <= panelRect.right }};
  }};
  return {{ label, width: root.clientWidth, height: root.clientHeight,
    horizontalOverflow: root.scrollWidth > root.clientWidth,
    verticalOverflow: root.scrollHeight > root.clientHeight,
    headerTop: Math.round(header.getBoundingClientRect().top),
    cardBottom: Math.round(card.getBoundingClientRect().bottom),
    feedBottom: Math.round(feed.getBoundingClientRect().bottom),
    footerBottom: Math.round(footer.getBoundingClientRect().bottom),
    mapsScript: Boolean(script), googleResources,
    mapVisible: !d.querySelector('#map-canvas').hidden,
    consentVisible: !d.querySelector('#consent-panel').hidden,
    formOpen: dialog.open,
    formInternalScroll: fields ? fields.scrollHeight >= fields.clientHeight : false,
    dialogBottom: dialog.open ? Math.round(dialog.getBoundingClientRect().bottom) : null,
    addPlanBackground: addStyle.backgroundImage,
    addPlanColor: addStyle.color,
    addPlanBorder: addStyle.borderColor,
    loadMapsVisible: !d.querySelector('#consent-panel').hidden,
    loadMapsBackground: loadStyle.backgroundImage,
    dateMode: d.querySelector('input[name="date_mode"]:checked')?.value,
    dateGridOverflow: dateFields.scrollWidth > dateFields.clientWidth,
    dateFrom: bounds(dateFrom), dateTo: bounds(dateTo), month: bounds(month) }};
}}
async function run() {{
  size(390, 844); frame.src = '/unsolo/plans/';
  await new Promise((resolve) => frame.addEventListener('load', resolve, {{once:true}}));
  await wait({3000 if maps_enabled else 600});
  if ({str(form_open).lower()}) {{
    frame.contentDocument.querySelector('#add-plan-open').click(); await wait(250);
    const mode = frame.contentDocument.querySelector(`input[name="date_mode"][value="{date_mode}"]`);
    if (mode) {{ mode.click(); await wait(100); }}
  }}
  const results = [sample('portrait-1')];
  size(844, 320); await wait(500); results.push(sample('landscape-1'));
  size(390, 844); await wait(500); results.push(sample('portrait-2'));
  size(844, 320); await wait(500); results.push(sample('landscape-2'));
  size(390, 844); await wait(500); results.push(sample('portrait-3'));
  size(1200, 800); await wait(500); results.push(sample('desktop'));
  if ({str(revoke_after).lower()}) {{
    const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, {{once:true}}));
    frame.contentDocument.querySelector('#turn-off-map').click();
    await loaded; await wait(700); results.push(sample('after-revoke'));
  }}
  output.textContent = JSON.stringify(results, null, 2);
  output.dataset.done = 'true';
}}
run();
</script>""".encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path == "/unsolo/plans/maps-key.js":
            if not DEV_MAPS_CONFIG.is_file():
                self.send_error(404)
                return
            COUNTS["maps_config"] += 1
            body = DEV_MAPS_CONFIG.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path == "/__public-plans":
            COUNTS["feed"] += 1
            self.send_json(200, {"version": 1, "truncated": False, "plans": PLANS})
            return
        if self.path == "/__e2e-state":
            self.send_json(200, {"counts": COUNTS, "plans": len(PLANS)})
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        size = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(size))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "invalid_request"})
            return

        if self.path == "/__search-destinations":
            COUNTS["search"] += 1
            query = payload.get("q") if isinstance(payload, dict) else None
            results = [] if not isinstance(query, str) or len(query) < 2 else [
                {"id": "2867714", "label": "Munich, Bavaria, Germany"}
            ]
            self.send_json(200, {"results": results})
            return

        if self.path != "/__submit-plan":
            self.send_error(404)
            return

        COUNTS["submit"] += 1
        plan_id = str(uuid4())
        mode = payload.get("date_mode")
        public_plan = {
            "id": plan_id,
            "activity_id": payload.get("activity_id"),
            "activity_label": "Hiking",
            "destination_label": "Munich, Bavaria, Germany",
            "latitude": 48.137154,
            "longitude": 11.576124,
            "date_mode": mode,
            "date_from": payload.get("date_from"),
            "date_to": payload.get("date_to"),
            "month": payload.get("month_start"),
            "created_at": "2026-09-11T12:00:00Z",
        }
        PLANS.append(public_plan)
        response_plan = {
            "id": plan_id,
            "activity_id": payload.get("activity_id"),
            "activity_label": "Hiking",
            "destination": "Munich, Bavaria, Germany",
            "latitude": 48.137154,
            "longitude": 11.576124,
            "date_mode": mode,
            "date_from": payload.get("date_from"),
            "date_to": payload.get("date_to"),
            "month_start": payload.get("month_start"),
        }
        self.send_json(200, {"version": 1, "result": "created", "plan": response_plan})


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 8765), partial(Handler, directory=str(DOCS)))
    print("Plan Map V1 RC E2E server ready on http://127.0.0.1:8765/unsolo/plans/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
