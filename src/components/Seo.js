import Head from 'next/head';
import { useRouter } from 'next/router';
import { SHOP } from '../config/shop';

// Per-page title / description / canonical / social tags + optional JSON-LD blocks
export default function Seo({ title, description, image, path, noindex = false, jsonLd = [], type = 'website' }) {
  const router = useRouter();
  const url = `${SHOP.url}${path ?? router.asPath.split(/[?#]/)[0]}`;
  const img = image || SHOP.image;
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="en_IN" />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd.filter(Boolean).map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }} />
      ))}
    </Head>
  );
}
