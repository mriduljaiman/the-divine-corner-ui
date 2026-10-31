import Link from 'next/link';
import { FiMapPin } from 'react-icons/fi';
import Seo from '../../components/Seo';
import { SHOP_PAGES, FESTIVAL_PAGES } from '../../config/seoPages';
import { SHOP, shopAddressText } from '../../config/shop';

export default function JaipurHub() {
  return (
    <div className="seo-page">
      <Seo
        title="The Divine Corner, Kanak Vrindavan Jaipur | Gifts, Pooja Samagri, Stationery & more"
        description="One shop for gifts, customized gifts, pooja samagri, Laddu Gopal dresses, bangles, jewellery, stationery, toys, kitchen & household items, photo frames and passport size photos in Kanak Vrindavan, Jaipur."
        path="/jaipur"
      />
      <header className="seo-hero">
        <h1>Your neighbourhood shop in Kanak Vrindavan, Sirsi Road, Jaipur</h1>
        <p className="seo-hi" lang="hi"><b>कनक वृंदावन, सिरसी रोड, जयपुर – हर ज़रूरत का सामान एक ही दुकान पर</b></p>
        <p>
          Gifts, pooja samagri, Laddu Gopal dresses, stationery, bangles, jewellery, toys, kitchen &amp; household items,
          wallpapers, photo frames, passport size photos and birthday decoration — all under one roof.
        </p>
        <p className="seo-addr"><FiMapPin /> {SHOP.name}, {shopAddressText()}</p>
      </header>
      {[['Shop by need', SHOP_PAGES], ['Festival shopping', FESTIVAL_PAGES]].map(([heading, pages]) => (
        <section key={heading} className="seo-block">
          <h2>{heading}</h2>
          <div className="seo-tiles">
            {pages.map(p => (
              <Link key={p.slug} href={`/jaipur/${p.slug}`} className="seo-tile">
                <span aria-hidden="true">{p.emoji}</span>
                <b>{p.label}</b>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <section className="seo-block">
        <Link href="/jaipur/laddu-gopal-dress-size-chart">📏 Laddu Gopal dress size chart →</Link>
      </section>
    </div>
  );
}
