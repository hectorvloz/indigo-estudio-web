"""Poses adicionales dibujadas con curvas SVG y grupos por parte."""
from pathlib import Path
from html import escape
import re
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'assets/personaje/kit-svg'
ink='#050505'; yellow='#F1C844'
def limb(d): return f'<path d="{d}" fill="none" stroke="{ink}" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"/>'
def hand(d):
    nums=re.findall(r'-?\d+(?:\.\d+)?',d)
    return f'<ellipse cx="{nums[-2]}" cy="{nums[-1]}" rx="17" ry="19" fill="{ink}"/>'
def foot(x,y,rot=0):return f'<ellipse cx="{x}" cy="{y}" rx="26" ry="14" transform="rotate({rot} {x} {y})"/>'
def marks(d):return f'<path d="{d}" fill="none" stroke="{ink}" stroke-width="7" stroke-linecap="round"/>'
poses={
'saltando':dict(title='Saltando',rot=-9,arms=['M135 191 Q92 171 87 115','M260 185 Q302 159 305 107'],legs=['M165 252 Q141 291 116 265','M230 252 Q257 291 279 258'],feet=[(110,264,-20),(285,256,-35)],extra=marks('M165 324 L158 346 M206 329 L208 355 M246 315 L256 337')),
'cayendo':dict(title='Cayendo',rot=16,arms=['M128 208 Q91 190 84 152','M269 202 Q309 176 314 140'],legs=['M172 265 Q161 294 151 320','M228 264 Q246 286 264 313'],feet=[(140,325,-12),(277,319,18)],extra=marks('M127 65 L116 102 M169 50 L165 89 M214 54 L217 85')),
'celebrando':dict(title='Celebrando',rot=0,arms=['M132 186 Q85 174 83 122','M268 186 Q310 163 317 115'],legs=['M169 271 L153 320','M231 271 L251 320'],feet=[(144,325,-12),(261,325,12)],extra=marks('M50 78 L64 88 M94 55 L98 74 M312 51 L308 71 M346 78 L332 89')+'<path d="m190 55 10-22 10 22-10 13Z" fill="#F1C844"/>'),
'senalando':dict(title='Señalando',rot=-4,arms=['M132 208 Q94 227 121 251','M266 185 Q304 177 322 147'],legs=['M171 272 L161 322','M230 271 L236 323'],feet=[(150,327,0),(249,327,0)],extra=f'<path d="M320 151 L343 123" stroke="{ink}" stroke-width="15" stroke-linecap="round"/>'+marks('M358 108 L369 99 M332 98 L335 85')),
'descansando':dict(title='Descansando',rot=0,arms=['M134 207 Q110 229 135 249','M266 208 Q291 232 265 250'],legs=['M169 260 Q155 280 156 300','M232 260 Q246 280 245 300'],feet=[(146,303,-8),(255,303,8)],extra='',sleep=True),
'saludando-dos-brazos':dict(title='Saludando con ambos brazos',rot=-7,arms=['M131 188 Q85 174 86 127','M267 189 Q312 168 313 121'],legs=['M173 270 L159 319','M231 269 L237 319'],feet=[(148,326,0),(249,326,0)],extra=marks('M54 102 L43 92 M77 86 L76 70 M334 94 L345 84 M311 76 L313 61')),
}
poses['sorprendido']=dict(title='Sorprendido',rot=0,arms=['M132 206 Q104 229 103 179','M266 208 Q295 229 299 180'],legs=['M173 267 L159 321','M231 267 L247 321'],feet=[(148,327,0),(259,327,0)],extra='',expression='surprise')
poses['triste']=dict(title='Triste',rot=0,arms=['M132 208 Q106 230 117 259','M267 208 Q287 232 277 262'],legs=['M173 270 L172 318','M231 270 L233 318'],feet=[(160,324,0),(245,324,0)],extra='',expression='sad')
for name,p in poses.items():
    # Separate groups are ready for later rigging; this kit is static.
    arms=''.join(f'<g id="{name}-brazo-{i}">{limb(d)}{hand(d)}</g>' for i,d in enumerate(p['arms'],1))
    legs=''.join(f'<g id="{name}-pierna-{i}" fill="{ink}">{limb(d)}{foot(*f)}</g>' for i,(d,f) in enumerate(zip(p['legs'],p['feet']),1))
    body=f'<g id="{name}-cuerpo"><path d="M201 108 C253 106 285 144 284 197 C283 246 249 281 201 281 C153 281 118 248 117 199 C116 151 151 110 201 108Z" fill="{yellow}"/></g>'
    eyes=(f'<path d="M207 186 Q216 196 226 184 M248 180 Q257 190 267 178" fill="none" stroke="{ink}" stroke-width="7" stroke-linecap="round"/>' if p.get('sleep') else '<ellipse cx="214" cy="177" rx="11" ry="19" transform="rotate(-7 214 177)"/><ellipse cx="256" cy="174" rx="10" ry="18" transform="rotate(-7 256 174)"/>')
    if p.get('expression') == 'surprise':
        eyes='<ellipse cx="210" cy="179" rx="13" ry="22"/><ellipse cx="254" cy="177" rx="12" ry="21"/><ellipse cx="234" cy="222" rx="10" ry="14"/>'
    elif p.get('expression') == 'sad':
        eyes='<ellipse cx="213" cy="192" rx="10" ry="15"/><ellipse cx="254" cy="192" rx="10" ry="15"/><path d="M200 169 L223 161 M245 161 L266 169 M222 230 Q234 217 247 230" fill="none" stroke="#050505" stroke-width="6" stroke-linecap="round"/>'
    # The same two thick, organic marks sit above the head in every new pose.
    p['extra']='<path d="M158 99 C143 98 129 91 131 84 C134 72 153 82 165 92 Q171 101 158 99Z M185 86 C175 78 163 63 169 56 C179 46 194 68 195 80 Q196 92 185 86Z" fill="#050505"/>'
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-labelledby="{name}-titulo"><title id="{name}-titulo">Indigo — {escape(p['title'])}</title><desc>Personaje amarillo con ojos negros. Pose vectorial con partes agrupadas y fondo transparente.</desc><g id="{name}-personaje" transform="rotate({p['rot']} 200 200)"><g id="{name}-gestos">{p['extra']}</g>{legs}{arms}{body}<g id="{name}-ojos" fill="{ink}">{eyes}</g></g></svg>'''
    (out/f'indigo-{name}.svg').write_text(svg)
    print(name)
# Rebuild only the new section, leaving the four original poses intact.
p=out/'index.html';s=p.read_text();start=s.find('<!-- poses adicionales -->')
if start!=-1:s=s[:start]+s[s.index('</main>',start):]
cards='<!-- poses adicionales -->'+''.join(f'<figure><img src="indigo-{name}.svg" alt="Indigo {p["title"].lower()}"><figcaption><strong>{i:02} / {p["title"]}</strong><a href="indigo-{name}.svg" download>SVG ↓</a></figcaption></figure>' for i,(name,p) in enumerate(poses.items(),5))
s=s.replace('</main>',cards+'</main>').replace('Una cara. Cuatro ideas.','Una cara. Doce ideas.').replace('Una cara. Diez ideas.','Una cara. Doce ideas.').replace('seis poses nuevas','ocho poses nuevas').replace('Basados en las cuatro poses originales. Escalables y editables.','Cuatro poses originales vectorizadas y ocho poses nuevas dibujadas en SVG.')
p.write_text(s)
