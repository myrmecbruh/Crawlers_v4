#!/usr/bin/env python3
"""Write version.txt. Run before every publish: open pages compare it with the version they loaded and reload when it changes."""
import time
v=time.strftime('%Y%m%d-%H%M%S',time.gmtime());open('version.txt','w').write(v+'\n');print(v)
