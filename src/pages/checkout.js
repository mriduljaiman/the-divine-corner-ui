// ============ pages/checkout.js ============
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: user?.address || '',
    shippingCity: user?.city || '',
    shippingState: user?.state || '',
    shippingZipCode: user?.zipCode || '',
    shippingCountry: user?.country || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    paymentMethod: 'COD'
  });

  if (!isAuthenticated()) {
    router.push('/auth/login');
    return null;
  }

  if (!cart || cart.items.length === 0) {
    router.push('/cart');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await orderService.createOrder(formData);
      await clearCart();
      router.push(`/orders/${response.data.id}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Order placement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-section">
            <h2>Shipping Information</h2>
            
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="shippingCity"
                  value={formData.shippingCity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="shippingState"
                  value={formData.shippingState}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  name="shippingZipCode"
                  value={formData.shippingZipCode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="shippingCountry"
                  value={formData.shippingCountry}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <h2>Payment Method</h2>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
            >
              <option value="COD">Cash on Delivery</option>
              <option value="CARD">Credit/Debit Card</option>
            </select>
          </div>

          <div className="checkout-summary">
            <h3>Order Summary</h3>
            {cart.items.map(item => (
              <div key={item.id} className="summary-item">
                <span>{item.product.name} x {item.quantity}</span>
                <span>${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="summary-total">
              <strong>Total</strong>
              <strong>${cart.totalAmount.toFixed(2)}</strong>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large btn-block"
            disabled={loading}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}