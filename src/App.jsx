import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, DownloadSimple, List, MagnifyingGlass, Phone, SlidersHorizontal, Sparkle, WhatsappLogo, X } from "@phosphor-icons/react";
import products from "../data/products.json";
import catalogue from "../data/sections.json";

const money = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
const sections = catalogue.collections.flatMap((collection) => collection.sections.map((section) => ({ ...section, collection: collection.title })));
const sectionById = new Map(sections.map((section) => [section.id, section]));
const featuredIds = ["T059", "T058", "T050", "T040"];
const featured = featuredIds.map((id) => products.find((product) => product.id === id)).filter(Boolean);
const productImage = (product) => `/assets/img/${product.id}.jpg`;
function productPrice(product) {
  if (product.price_kes) return `KSh ${money.format(product.price_kes)}`;
  if (product.variants?.length) return `From KSh ${money.format(Math.min(...product.variants.map(([, price]) => price)))}`;
  return "Price on request";
}

function Header({ onSearchFocus }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <a className="brand" href="#top" aria-label="Tenacity Locks home"><img src="/assets/tenacity-logo.png" alt="Tenacity Locks Ltd" /></a>
    <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
      <a href="#categories" onClick={() => setMenuOpen(false)}>Categories</a><a href="#products" onClick={() => setMenuOpen(false)}>Products</a><a href="#about" onClick={() => setMenuOpen(false)}>Why Tenacity</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
    </nav>
    <div className="header-actions">
      <button className="icon-button" type="button" onClick={onSearchFocus} aria-label="Search catalogue"><MagnifyingGlass size={20} weight="bold" /></button>
      <a className="header-cta" href="tel:+254711776688"><Phone size={18} weight="fill" /> <span>Call us</span></a>
      <button className="menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">{menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}</button>
    </div>
  </header>;
}

function HeroCard({ product, className, onOpen }) {
  return <button className={`hero-product ${className}`} type="button" onClick={() => onOpen(product)}>
    <img src={productImage(product)} alt={`${product.model_code} ${product.display_name}`} />
    <span className="hero-card-meta"><span><strong>{product.model_code}</strong><small>{productPrice(product)}</small></span><span className="round-arrow"><ArrowRight size={16} weight="bold" /></span></span>
  </button>;
}

function Hero({ onOpen }) {
  return <section className="hero" id="top">
    <div className="hero-copy"><p className="kicker"><Sparkle size={15} weight="fill" /> Product catalogue · 2026</p><h1>Security,<br /><em>beautifully</em> built.</h1><p className="hero-lead">Discover dependable locks and door hardware for every room, entrance and project—clearly organised and easy to compare.</p>
      <div className="hero-actions"><a className="button button-accent" href="#products">Explore products <ArrowRight size={18} weight="bold" /></a><a className="button button-ghost" href="/Tenacity-Catalogue-2026-WhatsApp.pdf" download><DownloadSimple size={18} /> Download PDF</a></div>
      <dl className="hero-stats"><div><dt>118</dt><dd>verified products</dd></div><div><dt>18</dt><dd>specialist sections</dd></div><div><dt>5 yr</dt><dd>selected lock guarantee</dd></div></dl>
    </div>
    <div className="hero-showcase" aria-label="Top products of the month"><div className="showcase-heading"><span>Top products</span><strong>of the month</strong></div><HeroCard product={featured[1]} className="card-left" onOpen={onOpen} /><HeroCard product={featured[0]} className="card-center" onOpen={onOpen} /><HeroCard product={featured[2]} className="card-right" onOpen={onOpen} /><a className="explore-disc" href="#products" aria-label="Explore the full catalogue"><ArrowDown size={26} weight="bold" /><span>EXPLORE</span></a></div>
  </section>;
}

function CategoryRail({ selected, onSelect }) {
  return <section className="category-section" id="categories"><div className="section-heading"><div><p className="eyebrow">Find your fit</p><h2>Shop by category</h2></div><p>Start with the door or application. Each collection keeps related models, finishes and price points together.</p></div><div className="category-grid">
    {catalogue.collections.map((collection, index) => { const count = products.filter((product) => collection.sections.some((section) => section.id === product.section)).length; const preview = products.find((product) => product.section === collection.sections[0].id); return <button key={collection.id} type="button" className={selected === collection.id ? "category-card selected" : "category-card"} onClick={() => onSelect(collection.id)}><span className="category-index">0{index + 1}</span><img src={productImage(preview)} alt="" /><span className="category-copy"><strong>{collection.title}</strong><small>{count} products</small></span><span className="round-arrow"><ArrowRight size={16} weight="bold" /></span></button>; })}
  </div></section>;
}

function ProductCard({ product, onOpen }) {
  const section = sectionById.get(product.section);
  return <article className="product-card" itemScope itemType="https://schema.org/Product"><button className="product-image" type="button" onClick={() => onOpen(product)} aria-label={`View ${product.model_code}`}><img itemProp="image" src={productImage(product)} alt={`${product.model_code} — ${product.display_name}`} loading="lazy" />{product.offer ? <span className="offer-tag">Offer</span> : null}<span className="view-chip">View product <ArrowRight size={14} weight="bold" /></span></button><div className="product-info"><p className="product-category">{section?.title}</p><h3 itemProp="name">{product.model_code}</h3><p itemProp="description">{product.display_name}</p><div className="product-bottom"><strong>{productPrice(product)}</strong><span>{product.finish || "Multiple finishes"}</span></div></div></article>;
}

function ProductExplorer({ collection, setCollection, query, setQuery, searchRef, onOpen }) {
  const [sort, setSort] = useState("featured"); const [visibleCount, setVisibleCount] = useState(16); const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const sectionIds = useMemo(() => collection === "all" ? null : new Set(catalogue.collections.find((item) => item.id === collection)?.sections.map((section) => section.id)), [collection]);
  const filtered = useMemo(() => { const list = products.filter((product) => { if (sectionIds && !sectionIds.has(product.section)) return false; if (!deferredQuery) return true; return [product.model_code, product.display_name, product.finish, product.supplier_category, ...product.specs].join(" ").toLowerCase().includes(deferredQuery); }); if (sort === "low") return [...list].sort((a, b) => (a.price_kes ?? Infinity) - (b.price_kes ?? Infinity)); if (sort === "high") return [...list].sort((a, b) => (b.price_kes ?? -1) - (a.price_kes ?? -1)); return list; }, [deferredQuery, sectionIds, sort]);
  const displayed = filtered.slice(0, visibleCount);
  return <section className="products-section" id="products"><div className="section-heading products-heading"><div><p className="eyebrow">The full collection</p><h2>Choose with confidence</h2></div><p>Search by model, use or finish. Open any product for verified specifications and a direct enquiry.</p></div>
    <div className="catalogue-toolbar"><label className="search-control"><MagnifyingGlass size={20} /><input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(16); }} placeholder="Search model, finish or product…" aria-label="Search products" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={18} /></button> : null}</label><label className="select-control"><SlidersHorizontal size={19} /><span>Category</span><select value={collection} onChange={(event) => { setCollection(event.target.value); setVisibleCount(16); }}><option value="all">All products</option>{catalogue.collections.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label className="select-control sort-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>
    <div className="results-line"><strong>{filtered.length}</strong> products <span>Prices and availability are subject to confirmation.</span></div>
    {displayed.length ? <div className="product-grid">{displayed.map((product) => <ProductCard key={product.id} product={product} onOpen={onOpen} />)}</div> : <div className="empty-state"><MagnifyingGlass size={34} /><h3>No matching products</h3><p>Try a model like “510”, a finish like “MAB”, or clear the category filter.</p><button className="button button-dark" type="button" onClick={() => { setQuery(""); setCollection("all"); }}>Reset filters</button></div>}
    {visibleCount < filtered.length ? <button className="load-more" type="button" onClick={() => setVisibleCount((count) => count + 16)}>Show more products <ArrowDown size={18} weight="bold" /></button> : null}
  </section>;
}

function Assurance() { const items = [["Clear choices", "Compare real product photos, model codes, finishes and verified prices."], ["Built for the door", "Browse dedicated collections for internal, steel, wooden and main doors."], ["Direct support", "Call or message Tenacity Locks for availability and the right specification."]]; return <section className="assurance" id="about"><div><p className="eyebrow">Why Tenacity</p><h2>Hardware made easier to choose.</h2></div><div className="assurance-grid">{items.map(([title, copy]) => <article key={title}><span><Check size={20} weight="bold" /></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>; }

function ProductModal({ product, onClose }) {
  useEffect(() => {
    if (!product) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [product, onClose]);
  if (!product) return null; const message = encodeURIComponent(`Hello Tenacity Locks, I would like to enquire about ${product.model_code} — ${product.display_name} (${productPrice(product)}). Please confirm availability.`);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" type="button" onClick={onClose} aria-label="Close product details"><X size={22} weight="bold" /></button><div className="modal-image"><img src={productImage(product)} alt={`${product.model_code} ${product.display_name}`} /></div><div className="modal-copy"><p className="eyebrow">{sectionById.get(product.section)?.title}</p><h2 id="modal-title">{product.model_code}</h2><p className="modal-name">{product.display_name}</p><strong className="modal-price">{productPrice(product)}</strong><ul>{product.specs.map((spec) => <li key={spec}><Check size={16} weight="bold" /> {spec}</li>)}</ul><dl><div><dt>Finish</dt><dd>{product.finish || "See product image"}</dd></div><div><dt>Warranty</dt><dd>{product.warranty || "Confirm with supplier"}</dd></div><div><dt>Model</dt><dd>{product.model_code}</dd></div></dl><div className="modal-actions"><a className="button button-whatsapp" href={`https://wa.me/254711776688?text=${message}`} target="_blank" rel="noreferrer"><WhatsappLogo size={20} weight="fill" /> Enquire on WhatsApp</a><a className="button button-ghost-dark" href="tel:+254711776688"><Phone size={19} weight="fill" /> Call</a></div></div></section></div>;
}

function Footer() { return <footer id="contact"><div className="footer-top"><img src="/assets/tenacity-logo.png" alt="Tenacity Locks Ltd" /><h2>Secure every door.</h2><p>Explore the collection, compare your options, then talk directly to the Tenacity team.</p><a className="button button-accent" href="https://wa.me/254711776688" target="_blank" rel="noreferrer"><WhatsappLogo size={20} weight="fill" /> Start an enquiry</a></div><div className="footer-bottom"><span>Tenacity Locks Ltd · Along Kijabe Street</span><a href="tel:+254711776688">0711 77 66 88</a><span>Prices and availability subject to confirmation.</span></div></footer>; }

export function App() {
  const [collection, setCollection] = useState("all"); const [query, setQuery] = useState(""); const [activeProduct, setActiveProduct] = useState(null); const searchRef = useRef(null);
  function selectCollection(id) { setCollection(id === collection ? "all" : id); document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" }); }
  return <><Header onSearchFocus={() => { document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" }); window.setTimeout(() => searchRef.current?.focus(), 500); }} /><main><Hero onOpen={setActiveProduct} /><CategoryRail selected={collection} onSelect={selectCollection} /><ProductExplorer collection={collection} setCollection={setCollection} query={query} setQuery={setQuery} searchRef={searchRef} onOpen={setActiveProduct} /><Assurance /></main><Footer /><ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} /></>;
}
