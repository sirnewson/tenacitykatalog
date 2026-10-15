"""Build the Tenacity Locks catalogue.

    python build.py            # index.html + optimised images
    python build.py --pdf      # also export the print PDF and the light WhatsApp PDF

Edit data/products.json (products, prices) and data/sections.json (section copy),
then re-run. Photos are never altered except for resizing.
"""
import html, json, os, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
IMG_SIZES = {'img': (1000, 80), 'img-sm': (560, 62)}  # folder: (long side px, JPEG quality)
BROWSERS = [r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
            r'C:\Program Files\Google\Chrome\Application\chrome.exe']

esc = html.escape


def ksh(n):
    return f'KSh {n:,}'


def make_images(products):
    for folder, (side, q) in IMG_SIZES.items():
        out = ROOT / 'assets' / folder
        out.mkdir(parents=True, exist_ok=True)
        for p in products:
            dst = out / f"{p['id']}.jpg"
            src = ROOT / p['photo_path']
            if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
                continue
            im = Image.open(src).convert('RGB')
            im.thumbnail((side, side), Image.LANCZOS)
            im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)


def badges(p):
    out = []
    if p['offer']:
        out.append('<span class="badge badge-offer">Offer</span>')
    if p['warranty'].startswith('Lifetime'):
        out.append('<span class="badge badge-life">Lifetime guarantee</span>')
    elif p['warranty']:
        out.append('<span class="badge badge-g5">5-yr guarantee</span>')
    return ''.join(out)


def price_block(p):
    if p['variants']:
        rows = ''.join(f'<tr><th>{esc(s)}</th><td>{ksh(v)}</td></tr>' for s, v in p['variants'])
        return f'<table class="variants" aria-label="Sizes and prices">{rows}</table>'
    if p['price_kes'] is None:
        return '<p class="price price-tbc">Price on request</p>'
    prev = f' <s>{ksh(p["previous_price_kes"])}</s>' if p['previous_price_kes'] else ''
    return f'<p class="price">{ksh(p["price_kes"])}{prev}</p>'


def card(p, img_dir, lazy):
    search = ' '.join([p['model_code'], p['display_name'], p['finish'], p['supplier_category'],
                       *p['specs'], str(p['price_kes'] or '')]).lower()
    specs = ''.join(f'<li>{esc(s)}</li>' for s in p['specs'])
    original = esc(p['photo_path'].replace(' ', '%20'))
    loading = ' loading="lazy"' if lazy else ''
    return f'''
      <article class="card" data-search="{esc(search)}">
        <button class="shot" type="button" data-full="{original}" aria-label="Enlarge photo of {esc(p['model_code'])}">
          <img src="assets/{img_dir}/{p['id']}.jpg" alt="Tenacity {esc(p['model_code'])} — {esc(p['display_name'])}"{loading} decoding="async">
          <span class="badges">{badges(p)}</span>
        </button>
        <div class="card-body">
          <h4 class="model">{esc(p['model_code'])}</h4>
          <p class="name">{esc(p['display_name'])}</p>
          <ul class="specs">{specs}</ul>
          {price_block(p)}
        </div>
      </article>'''


def build_html(products, cfg, img_dir='img', lazy=True):
    by_sec = {}
    for p in products:
        by_sec.setdefault(p['section'], []).append(p)
    c = cfg['contact']
    hero = next(p for p in products if p['model_code'] == 'Big F6 MAB/Wood')

    toc, chips, body = [], [], []
    for col in cfg['collections']:
        items = ''.join(
            f'<li><a href="#s{s["id"]}"><span class="toc-num">{s["id"]}</span>'
            f'<span class="toc-title">{esc(s["title"])}{" <em>" + s["cat"] + "</em>" if s.get("cat") else ""}</span>'
            f'<span class="toc-count">{len(by_sec.get(s["id"], []))}</span></a></li>'
            for s in col['sections'])
        toc.append(f'<div class="toc-col"><h3><span>Collection {col["id"]}</span>{esc(col["title"])}</h3><ol>{items}</ol></div>')
        chips.append(f'<a href="#c{col["id"]}">{esc(col["title"])}</a>')

        secs = []
        for s in col['sections']:
            facts = ''.join(f'<li>{esc(f)}</li>' for f in s['facts'])
            cat = f'<span class="cat">Supplier {esc(s["cat"])}</span>' if s.get('cat') else ''
            cards = ''.join(card(p, img_dir, lazy) for p in by_sec.get(s['id'], []))
            secs.append(f'''
    <section class="section" id="s{s['id']}">
      <header class="section-head">
        <div class="section-num">{s['id']}</div>
        <div class="section-text">
          {cat}
          <h3>{esc(s['title'])}</h3>
          <p class="lead">{esc(s['copy'])}</p>
          <blockquote><span>Supplier note</span>“{esc(s['quote'])}”</blockquote>
          {f'<ul class="facts">{facts}</ul>' if facts else ''}
        </div>
      </header>
      <div class="grid">{cards}
      </div>
    </section>''')
        body.append(f'''
  <div class="collection" id="c{col['id']}">
    <header class="collection-head">
      <p class="eyebrow">Collection {col['id']}</p>
      <h2>{esc(col['title'])}</h2>
      <p>{esc(col['intro'])}</p>
    </header>{''.join(secs)}
  </div>''')

    guide = ''.join(f'<tr><td>{esc(a)}</td><td>{esc(b)}</td></tr>' for a, b in cfg['guide'])
    notes = ''.join(f'<li>{n}</li>' for n in cfg['notes'])
    fine = ''.join(f'<li>{esc(n)}</li>' for n in cfg['fine_print'])
    template = (ROOT / 'template.html').read_text(encoding='utf-8')
    return (template
            .replace('{{HERO}}', f'assets/{img_dir}/{hero["id"]}.jpg')
            .replace('{{PHONE}}', esc(c['phone'])).replace('{{TEL}}', esc(c['phone_tel']))
            .replace('{{LOCATION}}', esc(c['location'])).replace('{{CTA}}', esc(c['cta']))
            .replace('{{COUNT}}', str(len(products)))
            .replace('{{CHIPS}}', ''.join(chips)).replace('{{TOC}}', ''.join(toc))
            .replace('{{GUIDE}}', guide).replace('{{NOTES}}', notes).replace('{{FINE}}', fine)
            .replace('{{BODY}}', ''.join(body)))


def export_pdf(html_file, pdf_file):
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        print('No Edge/Chrome found; skipping', pdf_file)
        return
    subprocess.run([browser, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
                    '--virtual-time-budget=20000', '--run-all-compositor-stages-before-draw',
                    f'--print-to-pdf={ROOT / pdf_file}', (ROOT / html_file).as_uri()],
                   check=True, capture_output=True, timeout=180)
    print(f'{pdf_file}: {os.path.getsize(ROOT / pdf_file) / 1e6:.1f} MB')


def main():
    products = json.loads((DATA / 'products.json').read_text(encoding='utf-8'))
    cfg = json.loads((DATA / 'sections.json').read_text(encoding='utf-8'))
    make_images(products)
    (ROOT / 'index.html').write_text(build_html(products, cfg), encoding='utf-8')
    print(f'index.html: {len(products)} products')
    if '--pdf' in sys.argv:
        tmp = ROOT / '_print.html'
        tmp.write_text(build_html(products, cfg, 'img', lazy=False), encoding='utf-8')
        export_pdf('_print.html', 'Tenacity-Catalogue-2026.pdf')
        tmp.write_text(build_html(products, cfg, 'img-sm', lazy=False), encoding='utf-8')
        export_pdf('_print.html', 'Tenacity-Catalogue-2026-WhatsApp.pdf')
        tmp.unlink()


if __name__ == '__main__':
    main()
