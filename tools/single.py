#!/usr/bin/env python3
"""Join index.html and js/ into one page body (for publishing as a single file). Usage: tools/single.py OUT.html"""
import re,sys
h=open('index.html').read()
css=re.search(r'<style>([\s\S]*?)</style>',h).group(1).replace('height:100vh;height:100dvh','height:100%')
body=re.search(r'<div id="app">[\s\S]*?\n</div>\n',h).group(0)
js='\n'.join(open('js/%s.js'%n).read() for n in ['data','world','sim','render','ui'])
open(sys.argv[1],'w').write('<title>Crawlers v4</title>\n<style>:root{color-scheme:dark}'+css+'</style>\n'+body+'<script>\n'+js+'\n</script>\n')
