import Link from 'next/link';
import Seo from '../components/Seo';
import { SHOP, shopAddressText } from '../config/shop';
import { SHIPPING } from '../config/policy';

// Linked from Google Merchant Center – keep in sync with backend ShippingService.
export default function ShippingPolicy() {
  return (
    <div className="seo-page">
      <Seo title={`Shipping & Delivery Policy | ${SHOP.name}`}
        description={`Delivery charges and payment for online orders at ${SHOP.name}, Jaipur. Free delivery on orders of ₹${SHIPPING.freeAbove} or more, cash on delivery.`} />
      <header className="seo-hero">
        <h1>Shipping &amp; Delivery Policy</h1>
      </header>
      <section className="seo-block">
        <h2>Delivery charges</h2>
        <ul className="seo-steps">
          <li><b>Free delivery</b> on orders of ₹{SHIPPING.freeAbove} or more.</li>
          <li>Orders below ₹{SHIPPING.freeAbove}: ₹{SHIPPING.charge} delivery charge, shown at checkout before you place the order.</li>
        </ul>
      </section>
      <section className="seo-block">
        <h2>Payment</h2>
        <p>All online orders are <b>Cash on Delivery</b> — pay when your order arrives.</p>
      </section>
      <section className="seo-block">
        <h2>Delivery time</h2>
        <p>
          After you place an order we call or WhatsApp you on {SHOP.phone} to confirm it and share the expected delivery date.
          You can track the status any time from <Link href="/orders">My Orders</Link>.
        </p>
      </section>
      <section className="seo-block">
        <h2>Shop pickup</h2>
        <p>You are always welcome to buy directly from our shop: {SHOP.name}, {shopAddressText()}.</p>
      </section>
      <p className="seo-block">See also our <Link href="/return-policy">Return &amp; Refund Policy</Link>.</p>
    </div>
  );
}
