import os, sys, time, requests
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

BASE = os.environ.get('ALC_BASE', 'http://127.0.0.1:8022')
URL = 'https://youtu.be/JTmgi0vO5Ug?si=Rk0KzFKmbXlv3xSr'

print('Posting ingest for', URL)
try:
    r = requests.post(f'{BASE}/ingest', json={'video_url': URL}, timeout=10)
except Exception as e:
    print('Failed to contact backend at', BASE, 'error:', e)
    sys.exit(1)
if r.status_code != 200:
    print('Ingest request failed', r.status_code, r.text)
    sys.exit(1)
job = r.json()
print('job_id', job.get('job_id'))
jid = job.get('job_id')

# Poll status
for i in range(600):
    try:
        s = requests.get(f'{BASE}/ingest-status/{jid}', timeout=10).json()
    except Exception as e:
        print('Status poll failed:', e)
        time.sleep(2)
        continue
    st = s.get('status')
    print(i, st, s.get('step_name'), s.get('progress'))
    if st in ('completed','failed'):
        print('FINAL', st, s.get('source'), s.get('method'), 'HAS_RESULT', bool(s.get('result')))
        vid = s.get('video_id')
        break
    time.sleep(2)
else:
    print('Timed out waiting for ingest')
    sys.exit(1)

if st == 'failed':
    print('Ingest failed:', s)
    sys.exit(1)

print('\nFetching timestamps...')
try:
    r_ts = requests.get(f'{BASE}/timestamps/{vid}', timeout=10).json()
    print('timestamps status:', r_ts.get('status'), 'count:', r_ts.get('count'))
    for t in r_ts.get('timestamps', [])[:10]:
        print(t)
except Exception as e:
    print('Failed to fetch timestamps:', e)

# If we see an excessive number of timestamps (leftover old chroma entries), clear and re-ingest
try:
    ts_count = int(r_ts.get('count') or 0)
except Exception:
    ts_count = 0
if ts_count > 5000:
    print('\nDetected excessive timestamps (', ts_count, '), clearing stored data for this video and re-ingesting...')
    try:
        clr = requests.post(f'{BASE}/videos/{vid}/clear', timeout=10)
        print('clear response:', clr.status_code)
    except Exception as e:
        print('Clear request failed:', e)

    print('Waiting 2s before re-ingest...')
    time.sleep(2)
    print('Re-posting ingest for', URL)
    r2 = requests.post(f'{BASE}/ingest', json={'video_url': URL}, timeout=10)
    if r2.status_code != 200:
        print('Re-ingest request failed', r2.status_code, r2.text)
        sys.exit(1)
    job2 = r2.json()
    jid2 = job2.get('job_id')
    for i in range(600):
        s2 = requests.get(f'{BASE}/ingest-status/{jid2}', timeout=10).json()
        st2 = s2.get('status')
        print('re-ingest', i, st2, s2.get('step_name'), s2.get('progress'))
        if st2 in ('completed','failed'):
            print('RE-INGEST FINAL', st2, s2.get('source'), s2.get('method'), 'HAS_RESULT', bool(s2.get('result')))
            vid = s2.get('video_id')
            break
        time.sleep(2)

    print('\nFetching timestamps after re-ingest...')
    try:
        r_ts = requests.get(f'{BASE}/timestamps/{vid}', timeout=10).json()
        print('timestamps status:', r_ts.get('status'), 'count:', r_ts.get('count'))
        for t in r_ts.get('timestamps', [])[:10]:
            print(t)
    except Exception as e:
        print('Failed to fetch timestamps after re-ingest:', e)

print('\nFetching summary...')
try:
    r_sm = requests.get(f'{BASE}/summary/{vid}', timeout=10).json()
    print('summary method:', r_sm.get('method'))
    print('summary:', (r_sm.get('summary') or '')[:800])
except Exception as e:
    print('Failed to fetch summary:', e)

print('\nFetching quality...')
try:
    rq = requests.get(f'{BASE}/quality/{vid}', timeout=10).json()
    print('quality:', rq.get('quality'))
except Exception as e:
    print('Failed to fetch quality:', e)

print('\nInspecting stored chunks (first 5)...')
try:
    from backend.utils.transcript_store import get_chunks
    chunks = get_chunks(vid)
    print('stored chunk count:', len(chunks))
    for c in chunks[:5]:
        print(c)
except Exception as e:
    print('Failed to inspect chunks:', e)
