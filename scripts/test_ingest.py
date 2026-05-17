import time

import requests


BASE = 'http://127.0.0.1:8022'
VIDEO = 'https://youtu.be/lFeYU31TnQ8?si=XdDkULKRFzbsXWKc'


def main():
    r = requests.post(f'{BASE}/ingest', json={'video_url': VIDEO})
    print('ingest status', r.status_code)
    job = r.json()
    print('job', job['job_id'])

    jid = job['job_id']
    st = None
    vid = None
    for i in range(300):
        s = requests.get(f'{BASE}/ingest-status/{jid}').json()
        st = s.get('status')
        print(i, st, s.get('step_name'), s.get('progress'))
        if st in ('completed', 'failed'):
            print('FINAL', st, s.get('source'), s.get('method'), 'HAS_RESULT', bool(s.get('result')))
            vid = s.get('video_id')
            break
        time.sleep(1)
    else:
        print('TIMEOUT')

    if st == 'completed' and vid:
        r = requests.get(f'{BASE}/timestamps/{vid}')
        print('timestamps', r.status_code, r.text)


if __name__ == '__main__':
    main()
