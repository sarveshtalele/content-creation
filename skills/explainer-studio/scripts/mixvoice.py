"""mixvoice (run with the library's python: needs numpy, soundfile, soxr). Voice ONLY: no music, no effects.
usage: mixvoice.py data.json voice_dir out.wav -> 48 kHz stereo, high-passed + gently compressed; loudness is set later by the mux step."""
import sys, json, numpy as np, soundfile as sf, soxr
from scipy.signal import butter, sosfilt
d = json.load(open(sys.argv[1])); vd = sys.argv[2]; out = sys.argv[3]; SR = 48000
total = int((d['DUR'] + 0.5) * SR); mix = np.zeros(total, dtype=np.float64)
for v in d['voice']:
    a, sr = sf.read(f"{vd}/{v['id']}.wav", dtype='float64')
    if a.ndim > 1: a = a.mean(1)
    a = soxr.resample(a, sr, SR); i = int(v['t'] * SR); n = min(len(a), total - i)
    fi = min(int(.006 * SR), n); fo = min(int(.012 * SR), n)
    if fi: a[:fi] *= np.linspace(0, 1, fi)
    if fo: a[n - fo:n] *= np.linspace(1, 0, fo)
    mix[i:i + n] += a[:n]
def peak(f0, db, q):   # RBJ peaking biquad
    A = 10 ** (db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q); c = np.cos(w)
    b = np.array([1 + al * A, -2 * c, 1 - al * A]); a = np.array([1 + al / A, -2 * c, 1 - al / A]); return np.concatenate([b / a[0], a / a[0]])[None, :]
mix = sosfilt(butter(2, 80, 'hp', fs=SR, output='sos'), mix)      # rumble
mix = sosfilt(peak(280, -2.0, 1.0), mix)                          # less boxiness
mix = sosfilt(peak(3200, 3.0, 0.9), mix)                          # consonant clarity (presence)
mix = sosfilt(peak(6800, -2.5, 2.0), mix)                         # tame sibilance
env = np.maximum.reduce([np.abs(mix)]); k = np.exp(-1 / (0.02 * SR)); g = np.zeros_like(env); acc = 0.0
for i in range(0, len(env), 48):
    acc = max(env[i:i + 48].max(), acc * (k ** 48)); g[i:i + 48] = acc
th = 0.35; gain = np.where(g > th, (th + (g - th) / 3) / np.maximum(g, 1e-9), 1.0)
mix = mix * gain; pk = np.abs(mix).max()
if pk > 0: mix = mix / pk * 0.89
sf.write(out, np.stack([mix, mix], 1).astype('float32'), SR, subtype='PCM_16'); print('mix', out, round(total / SR, 2), 's')
