// ============ pages/orders/index.js ============
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async (page = 0) => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders(page);
      setOrders(response.data.content);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      PENDING: 'status-pending',
      CONFIRMED: 'status-confirmed',
      PROCESSING: 'status-processing',
      SHIPPED: 'status-shipped',
      DELIVERED: 'status-delivered',
      CANCELLED: 'status-cancelled'
    };
    return statusMap[status] || '';
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="orders-page">
      <div className="container">
        <h1>My Orders</h1>

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet</p>
            <Link href="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.orderNumber}</h3>
                      <p>{order.createdAt}</p>
                    </div>
                    <span className={`status ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-items">
                    {order.items.map(item => (
                      <div key={item.id} className="order-item">
                        <img src={item.productImage || '/placeholder.png'} alt={item.productName} />
                        <div>
                          <p>{item.productName}</p>
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <span className="item-price">${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      Total: ${order.totalAmount.toFixed(2)}
                    </div>
                    <Link href={`/orders/${order.id}`} className="btn btn-secondary">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={pagination.page === 0}
                  onClick={() => fetchOrders(pagination.page - 1)}
                >
                  Previous
                </button>
                <span>Page {pagination.page + 1} of {pagination.totalPages}</span>
                <button
                  disabled={pagination.page === pagination.totalPages - 1}
                  onClick={() => fetchOrders(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}