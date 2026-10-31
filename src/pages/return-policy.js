import Link from 'next/link';
import Seo from '../components/Seo';
import { SHOP } from '../config/shop';
import { RETURN_POLICY } from '../config/policy';

// Linked from Google Merchant Center. Owner's decision (Oct 2026): only damaged or wrong
// items are replaced/refunded, reported within 48 hours with photos.
export default function ReturnPolicy() {
  return (
    <div className="seo-page">
      <Seo title={`Return & Refund Policy | ${SHOP.name}`}
        description={`Return and refund policy for online orders at ${SHOP.name}, Jaipur: damaged or wrong items are replaced or refunded when reported within ${RETURN_POLICY.days * 24} hours.`} />
      <header className="seo-hero">
        <h1>Return &amp; Refund Policy</h1>
      </header>
      <section className="seo-block">
        <h2>Damaged or wrong item</h2>
        <p>
          If your order arrives <b>damaged, broken or different from what you ordered</b>, tell us within
          <b> {RETURN_POLICY.days * 24} hours of delivery</b> and we will replace the item or refund you — at no extra cost.
        </p>
        <ol className="seo-steps">
          <li>Call or WhatsApp us on <a href={`tel:${SHOP.phone.replace(/\s/g, '')}`}>{SHOP.phone}</a>
            {SHOP.whatsapp && <> (<a href={`https://wa.me/${SHOP.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>)</>} with your order number.</li>
          <li>Send clear photos of the item and the packaging.</li>
          <li>Keep the item unused in its original packing — we will arrange pickup or ask you to drop it at the shop.</li>
        </ol>
      </section>
      <section className="seo-block">
        <h2>Refunds</h2>
        <p>Approved refunds are sent by UPI or bank transfer within 7 days of approval. Delivery charges are refunded too when the mistake was ours.</p>
      </section>
      <section className="seo-block">
        <h2>Not returnable</h2>
        <p>
          Items that arrive in good condition and match your order cannot be returned or exchanged. This includes
          customized / personalised gifts, pooja samagri, Laddu Gopal dresses and jewellery.
        </p>
      </section>
      <p className="seo-block">Questions? <Link href="/contact">Contact us</Link> · <Link href="/shipping-policy">Shipping Policy</Link></p>
    </div>
  );
}
