import Link from 'next/link';
import Seo from '../../components/Seo';
import ProductCard from '../../components/ProductCard';
import { SHOP } from '../../config/shop';
import { serverGet, publicProduct } from '../../utils/serverApi';

// Approximate: makers differ by ~½ inch, so the page always tells people to measure
// or bring Thakur ji to the shop. Owner can correct the numbers here.
const SIZES = [
  ['0', '2 – 2.5 in', '5 – 6 cm'],
  ['1', '2.5 – 3 in', '6 – 7.5 cm'],
  ['2', '3 – 3.5 in', '7.5 – 9 cm'],
  ['3', '3.5 – 4 in', '9 – 10 cm'],
  ['4', '4 – 5 in', '10 – 12.5 cm'],
  ['5', '5 – 6 in', '12.5 – 15 cm'],
  ['6', '6 – 7 in', '15 – 18 cm'],
];

const FAQ = [
  ['How do I know my Laddu Gopal size?', 'Measure the idol sitting, from the base to the top of the head (without mukut) in inches and match it with the chart. If it falls between two sizes, take the bigger one.'],
  ['Laddu Gopal ji ka size kaise naapein?', 'Thakur ji ko baitha kar, neeche base se sir ke upar tak (mukut ke bina) inch me naapiye aur chart se milaiye. Do size ke beech ho toh bada size lijiye.'],
  ['Are sizes the same for every brand?', 'Not exactly — sizes vary a little between makers. The safest way is to bring Laddu Gopal ji to our shop and we will try the dress on.'],
];

export default function SizeChartPage({ products }) {
  const path = '/jaipur/laddu-gopal-dress-size-chart';
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SHOP.url },
      { '@type': 'ListItem', position: 2, name: 'Laddu Gopal Dress', item: `${SHOP.url}/jaipur/laddu-gopal-dress` },
      { '@type': 'ListItem', position: 3, name: 'Size Chart', item: `${SHOP.url}${path}` },
    ],
  };

  return (
    <div className="seo-page">
      <Seo
        title="Laddu Gopal Dress Size Chart (0 to 6 No.) | How to Measure – The Divine Corner"
        description="Laddu Gopal dress size chart in inches & cm for size 0, 1, 2, 3, 4, 5, 6. Learn how to measure Thakur ji and pick the right poshak. Shop in Kanak Vrindavan, Jaipur."
        path={path}
        jsonLd={[faqSchema, breadcrumb]}
      />
      <nav className="seo-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/jaipur/laddu-gopal-dress">Laddu Gopal Dress</Link> / <span>Size Chart</span>
      </nav>

      <header className="seo-hero">
        <span className="seo-emoji" aria-hidden="true">📏</span>
        <h1>Laddu Gopal Dress Size Chart</h1>
        <p className="seo-hi" lang="hi"><b>लड्डू गोपाल ड्रेस साइज़ चार्ट – कौन से नंबर की पोशाक लें?</b></p>
        <p>Not sure which number dress fits your Laddu Gopal ji? Measure the idol and match it with the chart below.</p>
      </header>

      <section className="seo-block">
        <h2>How to measure</h2>
        <ol className="seo-steps">
          <li>Keep Laddu Gopal ji in the sitting position.</li>
          <li>Measure from the base to the top of the head, <b>without the mukut</b>.</li>
          <li>Match the height with the chart. Between two sizes? Take the bigger one.</li>
        </ol>
      </section>

      <section className="seo-block">
        <h2>Size chart (approximate)</h2>
        <div className="seo-table-wrap">
          <table className="seo-table">
            <thead><tr><th>Dress size (No.)</th><th>Idol height (inches)</th><th>Idol height (cm)</th></tr></thead>
            <tbody>
              {SIZES.map(([no, inch, cm]) => <tr key={no}><td><b>{no} No.</b></td><td>{inch}</td><td>{cm}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p>Sizes vary slightly between makers. Bring Thakur ji to {SHOP.name}, Kanak Vrindavan, Sirsi Road and we will match the dress for you.</p>
      </section>

      {products.length > 0 && (
        <section className="store-section">
          <div className="store-section-head">
            <div><h2>Laddu Gopal dresses in stock</h2></div>
            <Link href="/jaipur/laddu-gopal-dress">See all</Link>
          </div>
          <div className="meesho-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <section className="seo-block">
        <h2>Frequently asked questions</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="seo-faq">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}

export async function getStaticProps() {
  const cats = (await serverGet('/categories')).data || [];
  const cat = cats.find(c => c.name.toLowerCase() === 'laddu gopal dress');
  const list = cat ? await serverGet(`/products/search?categoryId=${cat.id}&size=10`) : { data: null };
  return {
    props: { products: (list.data?.content || []).filter(p => p.active !== false).map(publicProduct) },
    revalidate: 3600,
  };
}
