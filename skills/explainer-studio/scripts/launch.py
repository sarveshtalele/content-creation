"""Start the local web apps (studio, editor) in the background so an agent's terminal call returns at once with the link.

Why: a web server that runs in the foreground never returns, so an agent (Antigravity, Codex, Claude Code) waits on it forever and the app
looks like it never launched. Here the server is detached, a state file remembers it (pid, port, link), a second call reuses it, and
`--stop` / `--status` manage it. Works the same on Windows, macOS and Linux."""
import hashlib, json, os, subprocess, sys, time, urllib.request, webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))

def _home():
    import studio as ST; return ST.EH

def state_path(kind, key=''):
    d = os.path.join(_home(), 'run'); os.makedirs(d, exist_ok=True)
    return os.path.join(d, kind + ('-' + hashlib.sha1(os.path.abspath(key).encode()).hexdigest()[:8] if key else '') + '.json')

def read_state(path):
    try: return json.load(open(path, encoding='utf-8'))
    except Exception: return None

def write_state(path, port, token, extra=None):
    st = {'pid': os.getpid(), 'port': port, 'url': f'http://127.0.0.1:{port}/?t={token}', 'started': int(time.time())}; st.update(extra or {})
    tmp = path + '.tmp'; open(tmp, 'w', encoding='utf-8').write(json.dumps(st)); os.replace(tmp, path); return st

def alive(st):
    """True only if something answers /health on that port AND it is our app (a stale file or a reused port must not count)."""
    if not st: return False
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{st["port"]}/health', timeout=2) as r: return json.load(r).get('app') == 'explainer-studio'
    except Exception: return False

def _kill(pid):
    try:
        if os.name == 'nt': subprocess.run(['taskkill', '/PID', str(pid), '/T', '/F'], capture_output=True)
        else: os.kill(pid, 15)
    except Exception: pass

def start(kind, extra_args, key='', port=0, open_browser=True, foreground_cmd=None):
    """Returns (exit code, url). Reuses a running instance; otherwise detaches a new one and waits (max 25 s) until it answers."""
    sp = state_path(kind, key); st = read_state(sp)
    if alive(st): return 0, st['url'], True
    if os.path.exists(sp): os.remove(sp)
    log = os.path.join(os.path.dirname(sp), os.path.basename(sp)[:-5] + '.log')
    cmd = [sys.executable, os.path.join(HERE, 'studio.py'), kind] + extra_args + ['--foreground', '--no-open', '--port', str(port), '--state', sp]
    kw = {'stdin': subprocess.DEVNULL, 'stdout': open(log, 'w', encoding='utf-8'), 'stderr': subprocess.STDOUT, 'cwd': HERE}
    if os.name == 'nt': kw['creationflags'] = 0x00000008 | 0x00000200 | 0x08000000      # DETACHED_PROCESS | NEW_PROCESS_GROUP | NO_WINDOW
    else: kw['start_new_session'] = True
    p = subprocess.Popen(cmd, **kw); t0 = time.time()
    while time.time() - t0 < 25:
        st = read_state(sp)
        if st and alive(st): break
        if p.poll() is not None: break
        time.sleep(.25)
    st = read_state(sp)
    if not alive(st):
        tail = ''
        try: tail = open(log, encoding='utf-8', errors='replace').read()[-1500:]
        except Exception: pass
        return 1, 'The app did not start. Log (' + log + '):\n' + tail, False
    if open_browser:
        try: webbrowser.open(st['url'])
        except Exception: pass
    return 0, st['url'], False

def stop(kind, key=''):
    sp = state_path(kind, key); st = read_state(sp)
    if st and alive(st): _kill(st['pid']); time.sleep(.5)
    if os.path.exists(sp): os.remove(sp)
    return bool(st)

def command(kind, a, extra_args=(), key=''):
    """The CLI entry used by `studio.py studio|editor`."""
    if getattr(a, 'stop', False):
        print(f'{kind} stopped.' if stop(kind, key) else f'{kind} was not running.'); return 0
    if getattr(a, 'status', False):
        st = read_state(state_path(kind, key))
        if alive(st): print('RUNNING  ' + st['url']); return 0
        print('NOT RUNNING'); return 1
    code, msg, reused = start(kind, list(extra_args), key, a.port, not a.no_open)
    if code: print(msg); return code
    print(('APP_URL=' + msg)); print(f'The {kind} is running in the background' + (' (already was)' if reused else '') + '. Open that link in a browser; it only works on this computer.')
    print(f'Stop it with: studio.py {kind} {"" if kind == "studio" else "DIR "}--stop'); return 0
