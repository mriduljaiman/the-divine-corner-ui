export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="container">
        <h1>About The Divine Corner</h1>

        <section className="about-section">
          <h2>Our Story</h2>
          <p>
            Welcome to The Divine Corner — your go-to destination for thoughtfully curated gifts and
            unique products. Based in Kanak Vrindavan, Jaipur, we bring you a handpicked selection
            of gifts perfect for every occasion, from birthdays and anniversaries to festivals like
            Diwali and Holi.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            We believe every gift should carry a feeling. Our mission is to help you find that perfect
            something — meaningful, beautiful, and priced right. We carefully source every product in
            our store to ensure quality, variety, and value for our customers.
          </p>
        </section>

        <section className="about-section">
          <h2>Why Choose Us?</h2>
          <ul className="features-list">
            <li>✓ Handpicked Gift Collection</li>
            <li>✓ Gifts for Every Occasion</li>
            <li>✓ Affordable Prices</li>
            <li>✓ Fast Delivery</li>
            <li>✓ Easy Shopping Experience</li>
            <li>✓ Friendly Customer Support</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Get in Touch</h2>
          <p>
            We are based in Kanak Vrindavan, Jaipur. Reach us at{' '}
            <a href="mailto:thedivinecorner.seva@gmail.com">thedivinecorner.seva@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}