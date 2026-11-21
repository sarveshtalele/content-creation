"""Security and guardrail tests (offline). Run: python3 tests/test_security.py"""
import os, sys, tempfile, subprocess, json
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(H, '..', 'scripts'))
import ingest

def blocked(url):
    try: ingest.check_url(url)
    except ValueError: return True
    return False
for u in ('http://127.0.0.1/', 'http://localhost:8080/x', 'http://169.254.169.254/latest/meta-data', 'http://10.0.0.5/', 'http://[::1]/', 'file:///etc/passwd', 'ftp://example.com/', 'https://user:pw@example.com/'):
    assert blocked(u), 'should block ' + u
t = 'key AKIAABCDEFGHIJKLMNOP and ghp_' + 'a' * 36 + ' and sk-' + 'b' * 30 + '\n-----BEGIN RSA PRIVATE KEY-----\nMIIabc\n-----END RSA PRIVATE KEY-----\nok text'
r = ingest.redact(t)
assert 'AKIA' not in r and 'ghp_' not in r and 'sk-bbbb' not in r and 'MIIabc' not in r and 'ok text' in r, r
# repo reader never follows a symlink out of the repo
d = tempfile.mkdtemp(); sec = os.path.join(tempfile.mkdtemp(), 'secret.md'); open(sec, 'w', encoding='utf-8').write('TOPSECRET')
open(os.path.join(d, 'README.md'), 'w', encoding='utf-8').write('# demo\nhello')
try: os.symlink(sec, os.path.join(d, 'notes.md'))
except (OSError, NotImplementedError): print('note: symlinks not permitted here (Windows without developer mode); symlink case still covered by the reader code')
_, parts = ingest.read_repo(d, 'demo'); assert 'TOPSECRET' not in json.dumps(parts)
print('SECURITY TESTS OK')
