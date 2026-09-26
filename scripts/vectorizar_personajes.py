"""Vectoriza los PNG originales por silueta y color usando Potrace."""
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/personaje/kit-svg'
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
poses = {'asomandose': 'Asomándose', 'saludando': 'Saludando', 'caminando': 'Caminando', 'creando': 'Creando'}
OUT.mkdir(exist_ok=True)
with TemporaryDirectory() as temp:
    for pose, title in poses.items():
        im = Image.open(ROOT / f'assets/personaje/indigo-{pose}.png').convert('RGBA')
        pixels = list(im.getdata())
        masks = {
            'silueta': [255 if a > 128 else 0 for r,g,b,a in pixels],
            'amarillo': [255 if a > 128 and r > 100 and g > 70 and b < g * .8 else 0 for r,g,b,a in pixels],
        }
        alpha = Image.new('L', im.size); alpha.putdata(masks['silueta'])
        # Keep the connected character and remove the original floating marks.
        ImageDraw.floodfill(alpha, (650, 650), 128)
        alpha = alpha.point(lambda v: 255 if v == 128 else 0)
        masks['silueta'] = list(alpha.getdata())
        color = Image.new('L', im.size); color.putdata(masks['amarillo'])
        cl, ct, cr, cb = color.getbbox()
        mx = (cl + cr) / 2 - 65
        marks = f'M {mx-52} {ct-18} C {mx-95} {ct-21} {mx-112} {ct-42} {mx-102} {ct-57} C {mx-89} {ct-75} {mx-53} {ct-51} {mx-40} {ct-31} Q {mx-32} {ct-15} {mx-52} {ct-18} Z M {mx+5} {ct-44} C {mx-26} {ct-65} {mx-42} {ct-102} {mx-23} {ct-111} C {mx-4} {ct-122} {mx+22} {ct-78} {mx+23} {ct-56} Q {mx+24} {ct-35} {mx+5} {ct-44} Z'
        left, top, right, bottom = alpha.getbbox()
        top = min(top, ct-125)
        side = max(right-left, bottom-top) + 80
        x = (left+right-side)/2; y = (top+bottom-side)/2
        svg = ET.Element(f'{{{NS}}}svg', {'viewBox':f'{x:g} {y:g} {side} {side}', 'fill':'none', 'role':'img', 'aria-labelledby':f'{pose}-titulo'})
        ET.SubElement(svg,f'{{{NS}}}title',{'id':f'{pose}-titulo'}).text=f'Indigo — {title}'
        ET.SubElement(svg,f'{{{NS}}}desc').text='Personaje vectorial de Indigo. Fondo transparente. Amarillo #F1C844 y negro #050505.'
        for layer, data in masks.items():
            mask=Image.new('L', im.size); mask.putdata(data)
            mask=mask.filter(ImageFilter.MedianFilter(3))
            # Potrace traces black pixels.
            mask=mask.point(lambda p: 255-p).convert('1')
            pbm=Path(temp)/f'{pose}-{layer}.pbm'; traced=pbm.with_suffix('.svg')
            mask.save(pbm)
            subprocess.run(['potrace',str(pbm),'-s','-o',str(traced),'-t','12','-a','1','-O','0.3'],check=True)
            group=ET.parse(traced).getroot().find(f'{{{NS}}}g')
            group.set('id', f'{pose}-{layer}')
            group.set('fill', '#050505' if layer=='silueta' else '#F1C844')
            svg.append(group)
        ET.SubElement(svg, f'{{{NS}}}path', {'id':f'{pose}-marcas', 'd':marks, 'fill':'#050505'})
        ET.indent(svg)
        target=OUT/f'indigo-{pose}.svg'
        ET.ElementTree(svg).write(target,encoding='unicode',xml_declaration=True)
        print(target.name, target.stat().st_size, 'bytes')
