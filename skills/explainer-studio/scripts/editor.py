"""editor: a local, single-user web editor for everything in story.json (carousel slides and CTAs, GIF, Reel, post, brand), with build buttons and live previews.
It binds to 127.0.0.1 only, needs a random per-run token on every request, refuses foreign Host headers, and serves only files under out/ and final/ of the project."""
import contextlib, io, json, mimetypes, os, secrets, subprocess, sys, threading, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

HERE = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(HERE)
MAX_BODY = 2 * 1024 * 1024
GROUPS = ['blue', 'green', 'clay', 'sand']

def serve(work, port=0, open_browser=True, state_path=None):
    import studio as ST, carousel as CAR, validate_story as VS
    work = os.path.abspath(work); token = secrets.token_urlsafe(16); lock = threading.Lock()
    page = open(os.path.join(SKILL, 'editor', 'editor.html'), encoding='utf-8').read()

    def state():
        sp = os.path.join(work, 'story.json'); story = json.load(open(sp, encoding='utf-8')) if os.path.exists(sp) else {'meta': {'title': '', 'slug': ''}}
        c = story.get('carousel'); deck = []
        if c:
            try:
                for i, d in enumerate(CAR.compile_deck(story), 1): deck.append({'n': i, 'type': d['type']})
            except Exception: deck = []
        outs = []
        for root in ('out', 'final'):
            base = os.path.join(work, root)
            for dp, _, fs in os.walk(base):
                if os.sep + 'review' in dp or os.sep + '.' in dp: continue
                for f in sorted(fs):
                    if f.lower().endswith(('.png', '.jpg', '.gif', '.mp4', '.pdf', '.txt', '.srt')):
                        rel = os.path.relpath(os.path.join(dp, f), work).replace(os.sep, '/'); outs.append({'path': rel, 'mtime': int(os.path.getmtime(os.path.join(dp, f)))})
        return {'story': story, 'brand': ST.brand(), 'icons': sorted(VS.icon_names()), 'templates': list(VS.TEMPLATES), 'groups': GROUPS, 'hook_styles': list(CAR.HOOK_STYLES),
                'hook_help': CAR.HOOKS, 'slide_types': list(VS.CAR_TYPES), 'deck': deck, 'outputs': outs, 'work': os.path.basename(work)}

    def check_text():
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf): ok = ST.do_check(work)[0]
        return ok, buf.getvalue()

    def run_build(arts, slide):
        cmd = [sys.executable, os.path.join(HERE, 'studio.py'), 'build', work, '--artifacts', arts] + (['--slide', str(int(slide))] if slide else [])
        r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=1800)
        return r.returncode, (r.stdout + r.stderr)[-6000:]

    class H(BaseHTTPRequestHandler):
        server_version = 'explainer-editor'
        def log_message(self, *a): pass
        def _ok_host(self):
            h = (self.headers.get('Host') or '').split(':')[0]; return h in ('127.0.0.1', 'localhost')
        def _auth(self, q):
            t = self.headers.get('X-Token') or (q.get('t') or [''])[0]; return secrets.compare_digest(t, token)
        def _send(self, code, body, ctype='application/json'):
            b = body if isinstance(body, bytes) else body.encode('utf-8')
            self.send_response(code); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(b))); self.send_header('Cache-Control', 'no-store'); self.send_header('X-Content-Type-Options', 'nosniff'); self.end_headers(); self.wfile.write(b)
        def _json(self, code, obj): self._send(code, json.dumps(obj, ensure_ascii=False))
        def do_GET(self):
            u = urlparse(self.path); q = parse_qs(u.query)
            if not self._ok_host(): return self._send(403, 'bad host', 'text/plain')
            if u.path == '/health': return self._json(200, {'ok': True, 'app': 'explainer-studio'})
            if u.path == '/':
                if not self._auth(q): return self._send(403, 'open the link printed by studio.py editor', 'text/plain')
                return self._send(200, page.replace('__TOKEN__', token), 'text/html; charset=utf-8')
            if not self._auth(q): return self._send(403, 'bad token', 'text/plain')
            if u.path == '/api/state': return self._json(200, state())
            if u.path.startswith('/file/'):
                rel = unquote(u.path[6:]); full = os.path.realpath(os.path.join(work, rel))
                ok = any(full.startswith(os.path.realpath(os.path.join(work, r)) + os.sep) for r in ('out', 'final')) and os.path.isfile(full)
                if not ok: return self._send(404, 'not found', 'text/plain')
                ct = mimetypes.guess_type(full)[0] or 'application/octet-stream'
                return self._send(200, open(full, 'rb').read(), ct)
            self._send(404, 'not found', 'text/plain')
        def do_POST(self):
            u = urlparse(self.path); q = parse_qs(u.query)
            if not self._ok_host() or not self._auth(q): return self._send(403, 'forbidden', 'text/plain')
            n = int(self.headers.get('Content-Length') or 0)
            if n > MAX_BODY: return self._send(413, 'too large', 'text/plain')
            try: body = json.loads(self.rfile.read(n) or b'{}')
            except Exception: return self._json(400, {'error': 'bad json'})
            with lock:
                if u.path == '/api/save':
                    if not isinstance(body.get('story'), dict): return self._json(400, {'error': 'story object required'})
                    ST.save_story(work, body['story']); ok, log = check_text(); return self._json(200, {'ok': ok, 'log': log})
                if u.path == '/api/check': ok, log = check_text(); return self._json(200, {'ok': ok, 'log': log})
                if u.path == '/api/build':
                    arts = body.get('artifacts', 'gif')
                    if not all(a in ('gif', 'reel', 'post', 'carousel') for a in arts.split(',')): return self._json(400, {'error': 'artifacts'})
                    rc, log = run_build(arts, body.get('slide')); return self._json(200, {'ok': rc == 0, 'log': log})
                if u.path == '/api/brand':
                    import argparse
                    ns = argparse.Namespace(name=body.get('name'), tagline=body.get('tagline'), follow=body.get('follow'), avatar=None, voice=None, cta=None, speed=None, reset=False)
                    buf = io.StringIO()
                    with contextlib.redirect_stdout(buf): rc = ST.set_brand(ns)
                    return self._json(200, {'ok': not rc, 'log': buf.getvalue()})
            self._send(404, 'not found', 'text/plain')

    srv = ThreadingHTTPServer(('127.0.0.1', port), H); url = f'http://127.0.0.1:{srv.server_address[1]}/?t={token}'
    if state_path:
        import launch as LA; LA.write_state(state_path, srv.server_address[1], token)
    print('Editor running. Open this link (only this computer can reach it; Ctrl+C to stop):\n  ' + url)
    if open_browser:
        try: webbrowser.open(url)
        except Exception: pass
    try: srv.serve_forever()
    except KeyboardInterrupt: print('\nstopped')
    return 0
