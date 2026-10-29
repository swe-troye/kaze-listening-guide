"""Publish the user-supplied LRC, original translations and reference timing facts.

Usage: python3 scripts/build-youtube-data.py --research-dir /path/to/prepared-inputs
       --archive /path/to/user.zip
Prepared inputs stay local: kaze-youtube-songs.json, kaze-user-lrc.json,
kaze-aligned-cues.json, kaze-translations.json and kaze-maru-timings/*.json.
Raw external lyrics/HTML and temporary signed subtitle URLs are never published.
"""
import argparse, difflib, hashlib, html, json, re, unicodedata
from pathlib import Path

def plain(value):
    return html.unescape(re.sub(r'<[^>]*>', '', value))

def segments(fragment):
    result = []
    cursor = 0
    for match in re.finditer(r'<ruby\b[^>]*>(.*?)</ruby>', fragment, re.S):
        if match.start() > cursor:
            result.append({'text': plain(fragment[cursor:match.start()])})
        body = match.group(1)
        base = re.search(r'<rb\b[^>]*>(.*?)</rb>', body, re.S)
        reading = re.search(r'<(?:rt|rtc)\b[^>]*>(.*?)</(?:rt|rtc)>', body, re.S)
        if base and reading:
            result.append({'text': plain(base.group(1)), 'reading': plain(reading.group(1))})
        else:
            result.append({'text': plain(body)})
        cursor = match.end()
    if cursor < len(fragment):
        result.append({'text': plain(fragment[cursor:])})
    return [x for x in result if x['text']]

def normalize(text):
    out, positions = [], []
    for i, char in enumerate(text):
        for char in unicodedata.normalize('NFKC', char).lower():
            if not unicodedata.category(char).startswith(('P', 'Z', 'S')) and not char.isspace():
                out.append(char)
                positions.append(i)
    return ''.join(out), positions

def annotate(text, sources, vocabulary):
    target, positions = normalize(text)
    annotations = {}
    ranked = []
    for source in sources:
        full = ''.join(x['text'] for x in source)
        normal, src_positions = normalize(full)
        matcher = difflib.SequenceMatcher(None, normal, target, autojunk=False)
        blocks = matcher.get_matching_blocks()
        coverage = sum(b.size for b in blocks) / max(1, len(target))
        ranked.append((coverage, matcher.ratio(), source, normal, src_positions, blocks))
    if ranked:
        coverage, _, source, normal, src_positions, blocks = max(ranked, key=lambda x: (x[0], x[1]))
        if coverage >= .55:
            mapping = {b.a + i: b.b + i for b in blocks for i in range(b.size)}
            cursor = 0
            for token in source:
                end = cursor + len(token['text'])
                if token.get('reading'):
                    ids = [i for i, p in enumerate(src_positions) if cursor <= p < end]
                    mapped = [mapping.get(i) for i in ids]
                    if ids and all(i is not None for i in mapped) and mapped == list(range(mapped[0], mapped[0] + len(mapped))):
                        start, stop = positions[mapped[0]], positions[mapped[-1]] + 1
                        if normalize(text[start:stop])[0] == normalize(token['text'])[0]:
                            annotations[start] = (stop, token['reading'])
                cursor = end
    occupied = {i for start, (stop, _) in annotations.items() for i in range(start, stop)}
    # Only unambiguous per-song readings may fill unmatched words. Contextual
    # readings (一:いち/ひと, 愛:あい/いと, etc.) stay with their matched phrase.
    for base, readings in sorted(vocabulary.items(), key=lambda x: -len(x[0])):
        if len(readings) != 1:
            continue
        for match in re.finditer(re.escape(base), text):
            def kanji(c):
                return '\u3400' <= c <= '\u9fff'
            connected = (match.start() > 0 and kanji(text[match.start() - 1]) and match.start() - 1 not in occupied) or (match.end() < len(text) and kanji(text[match.end()]) and match.end() not in occupied)
            if not connected and not any(i in occupied for i in range(match.start(), match.end())):
                annotations[match.start()] = (match.end(), next(iter(readings)))
                occupied.update(range(match.start(), match.end()))
    out, cursor = [], 0
    for start, (stop, reading) in sorted(annotations.items()):
        if start < cursor:
            continue
        if start > cursor:
            out.append({'text': text[cursor:start]})
        out.append({'text': text[start:stop], 'reading': reading})
        cursor = stop
    if cursor < len(text):
        out.append({'text': text[cursor:]})
    return out or [{'text': text}]


parser=argparse.ArgumentParser()
parser.add_argument('--research-dir',type=Path,required=True)
parser.add_argument('--archive',type=Path,required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
read=lambda name:json.loads((args.research_dir/name).read_text())
songs=read('kaze-youtube-songs.json')
aligned=read('kaze-aligned-cues.json')
raw=read('kaze-user-lrc.json')
translations=read('kaze-translations.json')
archive_hash=hashlib.sha256(args.archive.read_bytes()).hexdigest()
ids=[4046610,34107386,21695208,3429465,4046547,10401714,31456800,23969296,32220959,33152486,4454486,3429414,24517270,28953444,24029989,28771021,24709636,17643422]
videos,lyrics,readings,report={},{},{},[]
unread=[]
for i,(song,a,input_lrc,lrclib_id) in enumerate(zip(songs,aligned,raw,ids),1):
 sid=song['id'];assert a['id']==sid and a['monotonic']
 v=a['video'];source=next((s['url'] for s in song['sources'] if 'marumaru' in s['url']),None)
 videos[sid]={k:v[k] for k in ['videoId','title','channel','channelId','durationSeconds']}
 videos[sid].update(source='https://www.youtube.com/watch?v='+v['videoId'],checkedAt='2026-10-29',marumaruUrl=source,selection='marumaru-linked-video' if source else 'official-audio-fallback')
 direct=sum('matchRatio' in c for c in a['cues'])
 estimate=len(a['cues'])-direct if source else 0
 note=(f"已對照此影片的 marumaru 時間軸：{direct} 個直接對齊，{estimate} 個依相鄰句／位移推算；尚未逐句實聽。" if source else "未找到 marumaru 對照頁，使用官方音源與原始 LRC 時間；尚未實聽校正。")
 def stamp(t):
  ms=round(t*1000);return f'[{ms//60000:02}:{ms//1000%60:02}.{ms%1000:03}]'
 bilingual=[]
 for c in a['cues']:
  assert 0<=c['start']<=v['durationSeconds']
  bilingual.extend([stamp(c['start'])+c['primary'],stamp(c['start'])+translations[sid][c['primary']]])
 lyrics[sid]={'text':'\n'.join(bilingual)+'\n','name':song['name'],'providedFile':f'{i:02}.lrc','archiveName':args.archive.name,'archiveSHA256':archive_hash,'inputSHA256':hashlib.sha256(input_lrc['text'].encode()).hexdigest(),'sourceUrl':f'https://lrclib.net/tracks/{lrclib_id}','duration':v['durationSeconds'],'timingVerified':False,'referenceCompared':bool(source),'directlyAlignedCues':direct,'estimatedCues':estimate,'timingNote':note,'translationCredit':'本站原創繁中翻譯','language':'ja' if any(re.search('[\u3040-\u30ff]',c['primary']) for c in a['cues']) else 'en'}
 path=args.research_dir/'kaze-maru-timings'/f'{sid}.json'
 refs=json.loads(path.read_text())['rows'] if path.exists() else []
 sources=[segments(r.get('LyricsFurigana','')) for r in refs if r.get('LyricsFurigana')]
 vocabulary={}
 for line in sources:
  for token in line:
   if token.get('reading'):vocabulary.setdefault(token['text'],set()).add(token['reading'])
 editorial={'shinunoga-e-wa':{'誰':'だれ','私':'わたし','直':'なお'},'garden':{'振':'ふ'}}.get(sid,{})
 for base,reading in editorial.items():vocabulary.setdefault(base,set()).add(reading)
 lines={}
 for c in a['cues']:
  text=c['primary'];tokens=annotate(text,sources,vocabulary);assert ''.join(x['text'] for x in tokens)==text
  lines[text]=tokens
  for t in tokens:
   if not t.get('reading') and re.search('[\u3400-\u9fff]',t['text']):unread.append({'id':sid,'line':text,'span':t['text']})
 readings[sid]={'sourceName':'marumaru' if source else '原文為英文，無漢字讀音','sourceUrl':source,'editorialReadings':bool(editorial),'lines':lines}
 report.append({'id':sid,'name':song['name'],'videoId':v['videoId'],'videoSource':videos[sid]['source'],'referenceUrl':source,'providedFile':f'{i:02}.lrc','cueCount':len(a['cues']),'directlyAlignedCues':direct,'estimatedCues':estimate,'unchangedUnverifiedCues':len(a['cues']) if not source else 0,'medianOffsetSeconds':a['referenceOffsetSeconds'],'timingVerified':False,'cues':[{k:c[k] for k in ['originalStart','start','matchRatio','referenceIndices','alignment','rejectedReferenceStart'] if k in c} for c in a['cues']]})
for filename,name,data in [('youtube-data.js','KAZE_VIDEOS',videos),('youtube-lrc.js','KAZE_LRC',lyrics),('youtube-readings.js','KAZE_READINGS',readings)]:
 (root/filename).write_text('/* User LRC + original translation; source and comparison details in SOURCES.md. */\nwindow.'+name+' = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'outputs').mkdir(exist_ok=True)
(root/'outputs/kaze-youtube-alignment.json').write_text(json.dumps({'checkedAt':'2026-10-29','archiveName':args.archive.name,'archiveSHA256':archive_hash,'method':'Sequence matching against the same marumaru-linked video; unpaired cues interpolated; isolated offsets >2s use median fallback. No full auditory verification.','songs':report},ensure_ascii=False,indent=2)+'\n')
(args.research_dir/'kaze-unannotated.json').write_text(json.dumps(unread,ensure_ascii=False,indent=2))
print(f'Published {len(lyrics)} bilingual songs; {len(unread)} plain kanji spans remain without inferred readings.')
