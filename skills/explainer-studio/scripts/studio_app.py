"""Design Studio server: pick a design, fill in your content, get the real file. Local only (127.0.0.1), random token on every request,
foreign Host headers refused, only files inside the jobs folder, the samples and the fonts are served."""
import base64, json, mimetypes, os, secrets, struct, sys, threading, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote
HERE = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(HERE); sys.path.insert(0, HERE)
MAX_BODY = 14 * 1024 * 1024

def serve(port=0, open_browser=True):
    import studio as ST, designs as DS, studio_jobs as SJ
    token = secrets.token_urlsafe(16); lock = threading.Lock()
    jobs = os.path.join(ST.EH, 'studio_jobs'); os.makedirs(jobs, exist_ok=True)
    page = open(os.path.join(SKILL, 'studio', 'index.html'), encoding='utf-8').read()
    roots = {'file': os.path.realpath(jobs), 'samples': os.path.realpath(os.path.join(SKILL, 'studio', 'samples')), 'fonts': os.path.realpath(os.path.join(SKILL, 'assets', 'fonts'))}

    def photo_path():
        return ST.USER_PHOTO if os.path.isfile(ST.USER_PHOTO) else os.path.join(SKILL, 'assets', 'photo_cutout.png')

    class H(BaseHTTPRequestHandler):
        server_version = 'explainer-studio'
        def log_message(self, *a): pass
        def _ok_host(self): return (self.headers.get('Host') or '').split(':')[0] in ('127.0.0.1', 'localhost')
        def _auth(self, q): return secrets.compare_digest(self.headers.get('X-Token') or (q.get('t') or [''])[0], token)
        def _send(self, code, body, ctype='application/json'):
            b = body if isinstance(body, bytes) else body.encode('utf-8')
            self.send_response(code); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(b))); self.send_header('Cache-Control', 'no-store'); self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'unsafe-inline' 'self'; script-src 'unsafe-inline' 'self'; font-src 'self'; connect-src 'self'"); self.end_headers(); self.wfile.write(b)
        def _json(self, code, obj): self._send(code, json.dumps(obj, ensure_ascii=False))
        def _static(self, kind, rel):
            full = os.path.realpath(os.path.join(roots[kind], unquote(rel)))
            if not full.startswith(roots[kind] + os.sep) or not os.path.isfile(full): return self._send(404, 'not found', 'text/plain')
            self._send(200, open(full, 'rb').read(), mimetypes.guess_type(full)[0] or 'application/octet-stream')
        def do_GET(self):
            u = urlparse(self.path); q = parse_qs(u.query)
            if not self._ok_host(): return self._send(403, 'bad host', 'text/plain')
            if u.path == '/':
                if not self._auth(q): return self._send(403, 'open the link printed by studio.py studio', 'text/plain')
                return self._send(200, page.replace('__TOKEN__', token), 'text/html; charset=utf-8')
            if u.path.startswith('/fonts/'): return self._static('fonts', u.path[7:])     # fonts carry no secrets; the page needs them before it can send a token header
            if not self._auth(q): return self._send(403, 'bad token', 'text/plain')
            if u.path == '/api/designs':
                b = ST.brand(); return self._json(200, {'designs': DS.public(), 'themes': DS.THEMES, 'icons': DS.ICONS, 'brand': {'name': b.get('name', ''), 'tagline': b.get('tagline', '')}, 'customPhoto': os.path.isfile(ST.USER_PHOTO)})
            if u.path == '/api/photo': return self._send(200, open(photo_path(), 'rb').read(), 'image/png')
            if u.path.startswith('/samples/'): return self._static('samples', u.path[9:])
            if u.path.startswith('/file/'): return self._static('file', u.path[6:])
            self._send(404, 'not found', 'text/plain')
        def do_POST(self):
            u = urlparse(self.path); q = parse_qs(u.query)
            if not self._ok_host() or not self._auth(q): return self._send(403, 'forbidden', 'text/plain')
            n = int(self.headers.get('Content-Length') or 0)
            if n > MAX_BODY: return self._json(413, {'error': 'That file is too large (limit 10 MB).'})
            try: body = json.loads(self.rfile.read(n) or b'{}')
            except Exception: return self._json(400, {'error': 'The request was not valid JSON.'})
            with lock:
                if u.path == '/api/generate':
                    try: r = SJ.render(jobs, body.get('items') or [], body.get('closing'), body.get('theme') or 'sky', body.get('mode') or 'single', body.get('format') or 'images')
                    except ValueError as e: return self._json(400, {'error': str(e)})
                    rel = lambda p: os.path.relpath(p, jobs).replace(os.sep, '/')
                    return self._json(200, {'ok': r['ok'], 'log': r['log'], 'files': [{'name': os.path.basename(p), 'url': '/file/' + rel(p)} for p in r['files']]})
                if u.path == '/api/photo':
                    try: raw = base64.b64decode(body.get('data') or '', validate=True)
                    except Exception: return self._json(400, {'error': 'Choose a PNG file.'})
                    if raw[:8] != b'\x89PNG\r\n\x1a\n': return self._json(400, {'error': 'The cover photo must be a PNG with a transparent background.'})
                    w, h = struct.unpack('>II', raw[16:24])
                    if min(w, h) < 400: return self._json(400, {'error': f'That PNG is {w}x{h}px. Use at least 400px on the short side so it stays sharp.'})
                    os.makedirs(ST.EH, exist_ok=True); open(ST.USER_PHOTO, 'wb').write(raw); return self._json(200, {'ok': True, 'w': w, 'h': h})
                if u.path == '/api/photo/reset':
                    if os.path.isfile(ST.USER_PHOTO): os.remove(ST.USER_PHOTO)
                    return self._json(200, {'ok': True})
            self._send(404, 'not found', 'text/plain')

    srv = ThreadingHTTPServer(('127.0.0.1', port), H); url = f'http://127.0.0.1:{srv.server_address[1]}/?t={token}'
    print('Design Studio running. Open this link (only this computer can reach it; Ctrl+C to stop):\n  ' + url, flush=True)
    if open_browser:
        try: webbrowser.open(url)
        except Exception: pass
    try: srv.serve_forever()
    except KeyboardInterrupt: print('\nstopped')
    return 0
