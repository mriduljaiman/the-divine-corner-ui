// ============ pages/contact.js ============
import { useState } from 'react';
import Seo from '../components/Seo';
import { SHOP, shopAddressText, hoursText } from '../config/shop';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, send this to an API
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="contact-page">
      <Seo title={`Contact & Shop Address – ${SHOP.name}, Kanak Vrindavan, Jaipur`}
        description={`Visit ${SHOP.name} at ${shopAddressText()}. Gifts, pooja samagri, Laddu Gopal dresses, stationery and more.`} />
      <div className="container">
        <h1>Contact Us</h1>

        {submitted && (
          <div className="message success">
            Thank you for your message! We'll get back to you soon.
          </div>
        )}

        <div className="contact-layout">
          <div className="contact-form-section">
            <h2>Send us a message</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Send Message
              </button>
            </form>
          </div>

          <div className="contact-info-section">
            <h2>Get in Touch</h2>
            <div className="contact-info">
              <div className="info-item">
                <h3>📍 Address</h3>
                <p>{SHOP.name}<br />{shopAddressText()}</p>
                {SHOP.mapsUrl && <p><a href={SHOP.mapsUrl} target="_blank" rel="noopener noreferrer">Get directions on Google Maps →</a></p>}
              </div>

              {SHOP.phone && (
                <div className="info-item">
                  <h3>📞 Phone</h3>
                  <p><a href={`tel:${SHOP.phone.replace(/\s/g, '')}`}>{SHOP.phone}</a></p>
                  {SHOP.whatsapp && <p><a href={`https://wa.me/${SHOP.whatsapp}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></p>}
                </div>
              )}

              <div className="info-item">
                <h3>📧 Email</h3>
                <p><a href={`mailto:${SHOP.email}`}>{SHOP.email}</a></p>
              </div>

              {SHOP.hours.length > 0 && (
                <div className="info-item">
                  <h3>🕐 Shop Timings</h3>
                  <p>{hoursText().map(line => <span key={line}>{line}<br /></span>)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}