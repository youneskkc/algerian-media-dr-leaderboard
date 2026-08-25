import json, os, sys, time, concurrent.futures
from datetime import datetime, timezone
import requests

ROOT=os.path.dirname(os.path.dirname(__file__))
seed_path=os.path.join(ROOT,'data','sites.seed.json')
out_path=os.path.join(ROOT,'data','ratings.json')
key=os.getenv('AHREFS_API_KEY')
if not key:
    raise SystemExit('AHREFS_API_KEY is missing')
seed=json.load(open(seed_path,encoding='utf-8'))
sites=seed.get('sites',[])
now=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
old={}
if os.path.exists(out_path):
    try: old={x.get('domain'):x for x in json.load(open(out_path,encoding='utf-8')).get('sites',[])}
    except Exception: old={}
headers={'Authorization':f'Bearer {key}','Accept':'application/json','User-Agent':'AlgerianMediaDRLeaderboard/1.0'}

def fetch(site):
    d=site['domain']; previous=old.get(d,{})
    try:
        r=requests.get('https://api.ahrefs.com/v3/public/domain-rating-free',params={'target':d,'output':'json'},headers=headers,timeout=25)
        payload=r.json() if r.text else {}
        # Ahrefs public endpoint returns domain_rating as a top-level value.
        value=None
        if isinstance(payload,dict):
            nested=payload.get('domain_rating')
            value=nested.get('domain_rating') if isinstance(nested,dict) else nested
        try: value=float(value) if value is not None else None
        except Exception: value=None
        if r.ok and value is not None:
            return {**site,'dr':value,'last_successful_update':now,'last_checked':now,'stale':False,'error':None}
        msg='HTTP '+str(r.status_code)
        if isinstance(payload,dict) and payload.get('error'): msg += ': '+str(payload.get('error'))[:220]
        return {**site,'dr':previous.get('dr'),'last_successful_update':previous.get('last_successful_update'),'last_checked':now,'stale':previous.get('dr') is not None,'error':msg}
    except Exception as e:
        return {**site,'dr':previous.get('dr'),'last_successful_update':previous.get('last_successful_update'),'last_checked':now,'stale':previous.get('dr') is not None,'error':type(e).__name__}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
    results=list(ex.map(fetch,sites))
# Sort DR descending, unknowns last, then Arabic/Latin name.
results.sort(key=lambda x:(x.get('dr') is None,-(x.get('dr') or 0),x.get('name','')))
summary={'generated_at':now,'source':'Ahrefs Domain Rating free API','site_count':len(results),'successful':sum(x.get('dr') is not None for x in results),'stale':sum(x.get('stale') for x in results),'errors':sum(x.get('error') is not None for x in results),'sites':results}
json.dump(summary,open(out_path,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(json.dumps({k:summary[k] for k in ['generated_at','site_count','successful','stale','errors']},ensure_ascii=False))
