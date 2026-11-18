# Writes docs/CHANGELOG.md from the commit history, newest first, grouped by day. Run: python3 tools/changelog.py
import subprocess,collections,os
root=os.path.join(os.path.dirname(__file__),'..')
log=subprocess.run(['git','log','--date=short','--pretty=%ad\t%s'],cwd=root,capture_output=True,text=True).stdout.strip().splitlines()
days=collections.OrderedDict()
for line in log:
    d,s=line.split('\t',1);days.setdefault(d,[]).append(s)
out=['# Changelog','','What changed in each published build, newest first. Play: https://myrmecbruh.github.io/Crawlers_v4/','']
for d,ss in days.items():
    out+=['## '+d,'']+['- '+s for s in ss]+['']
open(os.path.join(root,'docs','CHANGELOG.md'),'w').write('\n'.join(out))
print('wrote docs/CHANGELOG.md,',len(log),'entries')
