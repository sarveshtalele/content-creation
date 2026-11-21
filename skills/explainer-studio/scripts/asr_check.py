"""asr_check (optional): offline speech-to-text of each narration wav vs the spoken script. usage: asr_check.py items.json voice_dir out.json
items.json = [{"id","text","asr"?}]; exit 0 = all lines >= 0.93 similarity; exit 3 = ASR model not installed (skipped, not a failure)."""
import sys, json, re, difflib, glob, os
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(); TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()
def words(n):
    n = int(n)
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + ('' if n % 10 == 0 else ONES[n % 10])
    if n < 1000: return ONES[n // 100] + 'hundred' + ('' if n % 100 == 0 else words(n % 100))
    return ' '.join(ONES[int(c)] for c in str(n))
def digits(s):
    s = re.sub(r'(\d+)\.(\d+)', lambda m: words(m.group(1)) + ' point ' + ' '.join(ONES[int(c)] for c in m.group(2)), s)
    return re.sub(r'\d+', lambda m: words(m.group(0)), s)
def norm(s):
    s = digits(s).lower().replace(' dot ', '').replace('claude.md', 'claudemd')
    return re.sub(r'[^a-z0-9]', '', s)
try:
    import numpy as np, soundfile as sf, soxr, sherpa_onnx
except Exception as e: print('ASR skipped (python packages missing):', e); sys.exit(3)
M = os.environ.get('EXPLAINER_ASR_MODEL') or os.path.expanduser('~/.cache/explainer-studio/asr/sherpa-onnx-whisper-small.en')
def pick(p):
    g = sorted(glob.glob(f'{M}/{p}')); return g[0] if g else None
enc, dec, tok = pick('*encoder*.int8.onnx'), pick('*decoder*.int8.onnx'), pick('*tokens.txt')
if not (enc and dec and tok): print('ASR skipped (model not found; run scripts/setup.sh asr)'); sys.exit(3)
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=enc, decoder=dec, tokens=tok, language='en', task='transcribe', num_threads=2)
items = json.load(open(sys.argv[1])); vd = sys.argv[2]; res = {}; bad = 0
for L in items:
    a, sr = sf.read(f"{vd}/{L['id']}.wav", dtype='float32')
    if a.ndim > 1: a = a.mean(1)
    s = rec.create_stream(); s.accept_waveform(16000, soxr.resample(a, sr, 16000)); rec.decode_stream(s); heard = s.result.text.strip()
    r = difflib.SequenceMatcher(None, norm(L.get('asr') or L['text']), norm(heard)).ratio(); ok = r >= .93; bad += not ok
    res[L['id']] = {'heard': heard, 'ratio': round(r, 3), 'ok': ok}; print(('OK  ' if ok else 'BAD '), L['id'], round(r, 3), '|', heard)
json.dump(res, open(sys.argv[3], 'w'), indent=1); sys.exit(1 if bad else 0)
