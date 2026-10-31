// Single source for the shop's name / address / phone (NAP). Google matches these
// against the Google Business Profile, so keep them EXACTLY the same everywhere
// (website, GBP, Justdial, IndiaMART, Instagram bio). Empty values are left out
// of the schema instead of publishing something wrong.
export const SHOP = {
  name: 'The Divine Corner',
  url: 'https://thedivinecorner.in',
  logo: 'https://thedivinecorner.in/logo.png',
  image: 'https://thedivinecorner.in/logo_tagline.png',
  email: 'thedivinecorner.seva@gmail.com',
  phone: '+91 89469 94377',
  whatsapp: '918946994377',
  street: 'Shop 3, Kanak Vrindavan, Sirsi Road, Panchyawala',
  locality: 'Panchyawala',
  city: 'Jaipur',
  region: 'Rajasthan',
  postalCode: '302034',
  country: 'IN',
  lat: '',              // TODO from Google Maps (right click the shop pin)
  lng: '',
  mapsUrl: 'https://share.google/pXh9tSNjZxZHQWHkw',
  // [days, open, close] in 24h. Days: Mo Tu We Th Fr Sa Su
  hours: [['Mo-Su', '10:00', '22:00']],
  priceRange: '₹₹',
  // Nearby areas customers come from – used in page copy so "X in <area>" searches match
  nearbyAreas: ['Kanak Vrindavan', 'Sirsi Road', 'Panchyawala', 'Vaishali Nagar', 'Meenawala', 'Siwar Mod', 'Bindayaka', 'Khatipura', 'Jhotwara', 'Dhaka Nagar', 'Jaipur'],
  sameAs: [],           // TODO Instagram / Facebook / Justdial page URLs
};

export const shopAddressText = () =>
  [SHOP.street, SHOP.street.includes(SHOP.locality) ? '' : SHOP.locality, SHOP.city, SHOP.region, SHOP.postalCode]
    .filter(Boolean).join(', ');

const to12h = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
};

// e.g. "Open all 7 days: 10 am – 10 pm"
export const hoursText = () => SHOP.hours.map(([days, open, close]) =>
  `${days === 'Mo-Su' ? 'Open all 7 days' : days}: ${to12h(open)} – ${to12h(close)}`);

const DAY_MAP = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };
const DAY_ORDER = Object.keys(DAY_MAP);

const expandDays = (spec) => {
  const [a, b] = spec.split('-');
  if (!b) return [DAY_MAP[a]];
  return DAY_ORDER.slice(DAY_ORDER.indexOf(a), DAY_ORDER.indexOf(b) + 1).map(d => DAY_MAP[d]);
};

// schema.org Store (a LocalBusiness) – the block Google reads for local results
export function localBusinessSchema() {
  const s = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SHOP.url}/#store`,
    name: SHOP.name,
    url: SHOP.url,
    logo: SHOP.logo,
    image: SHOP.image,
    email: SHOP.email,
    priceRange: SHOP.priceRange,
    description: 'Gift shop, pooja samagri, Laddu Gopal dresses, stationery, bangles & jewellery, soft toys, RC cars, kitchen & household items, photo frames, passport size photos and birthday decoration in Kanak Vrindavan, Sirsi Road, Jaipur.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SHOP.street,
      addressLocality: SHOP.city,
      addressRegion: SHOP.region,
      addressCountry: SHOP.country,
      ...(SHOP.postalCode && { postalCode: SHOP.postalCode }),
    },
    areaServed: SHOP.nearbyAreas.map(name => ({ '@type': 'Place', name })),
    paymentAccepted: 'Cash, UPI',
    currenciesAccepted: 'INR',
  };
  if (SHOP.phone) s.telephone = SHOP.phone;
  if (SHOP.lat && SHOP.lng) s.geo = { '@type': 'GeoCoordinates', latitude: SHOP.lat, longitude: SHOP.lng };
  if (SHOP.mapsUrl) s.hasMap = SHOP.mapsUrl;
  if (SHOP.sameAs.length) s.sameAs = SHOP.sameAs;
  if (SHOP.hours.length) {
    s.openingHoursSpecification = SHOP.hours.map(([days, opens, closes]) => ({
      '@type': 'OpeningHoursSpecification', dayOfWeek: expandDays(days), opens, closes,
    }));
  }
  return s;
}
