// ============ pages/about.js ============
export default function AboutPage() {
    return (
      <div className="about-page">
        <div className="container">
          <h1>About The Divine Corner</h1>
          
          <section className="about-section">
            <h2>Our Story</h2>
            <p>
              Welcome to The Divine Corner, your trusted destination for quality products at affordable prices. 
              Founded with a passion for excellence and customer satisfaction, we've been serving our community 
              with dedication and integrity.
            </p>
          </section>
  
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              Our mission is to provide our customers with the best shopping experience possible. We carefully 
              curate our product selection to ensure quality, value, and variety. Customer satisfaction is at 
              the heart of everything we do.
            </p>
          </section>
  
          <section className="about-section">
            <h2>Why Choose Us?</h2>
            <ul className="features-list">
              <li>✓ Quality Products</li>
              <li>✓ Competitive Prices</li>
              <li>✓ Fast Shipping</li>
              <li>✓ Excellent Customer Service</li>
              <li>✓ Secure Payment</li>
              <li>✓ Easy Returns</li>
            </ul>
          </section>
        </div>
      </div>
    );
  }