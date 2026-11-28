"""Official technology logos for every design.

Bundled: a CC0 subset of the Iconify "logos" set (data/logos.json). The person can add more (`studio.py logos --add NAME`,
fetched once from the Iconify API) or import an official icon pack they downloaded themselves, such as the AWS Architecture
Icons (`studio.py logos --import DIR`); both live in ~/.cache/explainer-studio/logos.json and win over the bundled ones.
A story names one as icon "logo:NAME". Rule: a logo appears only when the source names that technology (grounded())."""
import json, os, re, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(HERE)
BUNDLED = os.path.join(SKILL, 'data', 'logos.json')
EH = os.environ.get('EXPLAINER_HOME') or os.path.join(os.path.expanduser('~'), '.cache', 'explainer-studio')
USER = os.path.join(EH, 'logos.json')
# words the source may use for a logo, when the name alone is not how people write it
ALIAS = {'model-context-protocol': ['mcp', 'model context protocol'], 'postgresql': ['postgres', 'postgresql'], 'kubernetes': ['kubernetes', 'k8s'],
         'aws': ['aws', 'amazon web services'], 'google-cloud': ['google cloud', 'gcp'], 'google-cloud-platform': ['google cloud', 'gcp'], 'microsoft-azure': ['azure'],
         'aws-elastic-cache': ['elasticache'], 'aws-elasticache': ['elasticache'], 'aws-open-search': ['opensearch'], 'aws-elb': ['load balancer', 'elb'],
         'aws-api-gateway': ['api gateway'], 'aws-iam': ['iam'], 'aws-s3': ['s3'], 'aws-ec2': ['ec2'], 'aws-rds': ['rds'], 'aws-sqs': ['sqs'], 'aws-sns': ['sns'],
         'aws-bedrock': ['bedrock'], 'aws-lambda': ['lambda'], 'aws-eks': ['eks'], 'aws-ecs': ['ecs'], 'aws-kms': ['kms'], 'aws-vpc': ['vpc'],
         'openai': ['openai', 'chatgpt', 'gpt'], 'google-gemini': ['gemini'], 'meta': ['meta', 'llama'], 'mistral-ai': ['mistral'], 'huggingface': ['hugging face', 'huggingface'],
         'nodejs': ['node.js', 'nodejs', 'node'], 'nextjs': ['next.js', 'nextjs'], 'visual-studio-code': ['vs code', 'vscode', 'visual studio code'], 'linux-tux': ['linux'],
         'github-actions': ['github actions'], 'github-copilot': ['copilot'], 'claude-code': ['claude code'], 'apache-spark': ['spark'], 'tailwindcss': ['tailwind'], 'git': ['git']}
_IDX = None


def _load(p):
    try: return json.load(open(p, encoding='utf-8')).get('icons', {})
    except Exception: return {}


def index():
    global _IDX
    if _IDX is None: _IDX = {**_load(BUNDLED), **_load(USER)}
    return _IDX


def resolve(name):
    """'logo:slack' -> 'slack-icon' (the square mark) when there is one, else the name itself; None if unknown."""
    n = name[5:] if name.startswith('logo:') else name; ix = index()
    return n + '-icon' if n + '-icon' in ix else n if n in ix else None


def names(): return sorted({'logo:' + (k[:-5] if k.endswith('-icon') else k) for k in index()})


def search(q):
    q = q.lower().replace(' ', '-'); return [n for n in names() if q in n]


def words(name):
    n = name[5:] if name.startswith('logo:') else name
    n = n[:-5] if n.endswith('-icon') else n
    if n in ALIAS: return ALIAS[n]
    rest = re.sub(r'^(aws|amazon|google|microsoft|apache)-', '', n)
    return [rest.replace('-', ' ')]


def grounded(name, text):
    return any(re.search(r'(?<![a-z0-9])' + re.escape(w).replace(r'\ ', r'[\s-]?') + r'(?![a-z0-9])', text, re.I) for w in words(name))


def used(obj, out=None):
    """Every 'logo:NAME' string anywhere in a story."""
    out = set() if out is None else out
    if isinstance(obj, str) and obj.startswith('logo:'): out.add(obj)
    elif isinstance(obj, dict): [used(v, out) for v in obj.values()]
    elif isinstance(obj, list): [used(v, out) for v in obj]
    return out


def pack(story):
    """The logos a story uses, for the film's data.json: {'logo:NAME': {w,h,body}}."""
    ix = index(); return {n: ix[resolve(n)] for n in used(story) if resolve(n)}


def _save_user(new):
    cur = _load(USER); cur.update(new); os.makedirs(EH, exist_ok=True)
    json.dump({'info': {'note': 'added or imported by the person; trademarks of their owners'}, 'icons': cur}, open(USER, 'w', encoding='utf-8'))
    global _IDX; _IDX = None


def add(names_):
    """Fetch more logos from the Iconify API (CC0 'logos' set) into the person's cache."""
    want = [n[5:] if n.startswith('logo:') else n for n in names_]
    url = 'https://api.iconify.design/logos.json?icons=' + ','.join(want)
    d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'explainer-studio'}), timeout=30))
    W, H = d.get('width', 256), d.get('height', 256)
    got = {k: {'w': v.get('width', W), 'h': v.get('height', H), 'body': v['body']} for k, v in (d.get('icons') or {}).items()}
    if got: _save_user(got)
    return sorted(got), sorted(set(want) - set(got))


def import_dir(d):
    """Import every SVG under DIR (an official icon pack the person downloaded). Name = file name, lower-case, sizes and prefixes dropped:
    Arch_Amazon-Simple-Storage-Service_64.svg -> logo:amazon-simple-storage-service."""
    got = {}
    for root, _, fs in os.walk(d):
        for f in fs:
            if not f.lower().endswith('.svg'): continue
            s = open(os.path.join(root, f), encoding='utf-8', errors='replace').read()
            vb = re.search(r'viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)', s); body = re.search(r'<svg[^>]*>(.*)</svg>', s, re.S)
            if not vb or not body: continue
            n = re.sub(r'^(arch|res|arch-category|resource)[_-]', '', f[:-4], flags=re.I)
            n = re.sub(r'[_-](16|20|24|32|48|64|light|dark)$', '', re.sub(r'[_-](16|20|24|32|48|64)(?=[_-]|$)', '', n), flags=re.I)
            n = re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')
            body_ = re.sub(r'<(script|foreignObject)[\s\S]*?</\1>', '', body.group(1), flags=re.I)   # artwork only
            got[n] = {'w': float(vb.group(1)), 'h': float(vb.group(2)), 'body': body_}
    if got: _save_user(got)
    return sorted(got)


if __name__ == '__main__':   # self-check
    assert resolve('logo:slack') == 'slack-icon' and resolve('logo:aws-s3') == 'aws-s3' and resolve('logo:nope') is None
    assert grounded('logo:aws-s3', 'Data lands in S3 buckets') and not grounded('logo:aws-s3', 'S3x storage')
    assert grounded('logo:model-context-protocol', 'deploy through MCP integrations') and not grounded('logo:github', 'open a PR')
    assert grounded('logo:claude-code', 'Start Claude Code sessions') and not grounded('logo:claude-code', 'Claude writes code')
    assert used({'a': [{'icon': 'logo:git'}, 'x'], 'b': 'logo:slack'}) == {'logo:git', 'logo:slack'}
    print('logos ok', len(index()))
