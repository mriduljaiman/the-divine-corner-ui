import Link from 'next/link';
import { FiMapPin } from 'react-icons/fi';
import Seo from '../../components/Seo';
import { SEO_PAGES } from '../../config/seoPages';
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
        <p>
          Gifts, pooja samagri, Laddu Gopal dresses, stationery, bangles, jewellery, toys, kitchen &amp; household items,
          wallpapers, photo frames, passport size photos and birthday decoration — all under one roof.
        </p>
        <p className="seo-addr"><FiMapPin /> {SHOP.name}, {shopAddressText()}</p>
      </header>
      <section className="seo-block">
        <div className="seo-tiles">
          {SEO_PAGES.map(p => (
            <Link key={p.slug} href={`/jaipur/${p.slug}`} className="seo-tile">
              <span aria-hidden="true">{p.emoji}</span>
              <b>{p.label}</b>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
