// ============ pages/contact.js ============
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
                <p>123 Main Street<br />New York, NY 10001</p>
              </div>

              <div className="info-item">
                <h3>📞 Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>

              <div className="info-item">
                <h3>📧 Email</h3>
                <p>support@divinecorner.com</p>
              </div>

              <div className="info-item">
                <h3>🕐 Business Hours</h3>
                <p>Monday - Friday: 9:00 AM - 6:00 PM<br />
                Saturday: 10:00 AM - 4:00 PM<br />
                Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}