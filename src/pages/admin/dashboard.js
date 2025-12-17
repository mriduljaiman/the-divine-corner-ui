// ============ pages/admin/dashboard.js ============
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      router.push('/');
      return;
    }
    if (isAdmin()) {
      fetchDashboard();
    }
  }, [authLoading, isAdmin]);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardService.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Admin Dashboard</h1>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-value">${dashboard?.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="stat-card">
            <h3>Monthly Revenue</h3>
            <p className="stat-value">${dashboard?.monthlyRevenue?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="stat-card">
            <h3>Total Orders</h3>
            <p className="stat-value">{dashboard?.totalOrders || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Pending Orders</h3>
            <p className="stat-value">{dashboard?.pendingOrders || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Total Products</h3>
            <p className="stat-value">{dashboard?.totalProducts || 0}</p>
          </div>

          <div className="stat-card warning">
            <h3>Low Stock</h3>
            <p className="stat-value">{dashboard?.lowStockProducts || 0}</p>
          </div>

          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-value">{dashboard?.totalUsers || 0}</p>
          </div>

          <div className="stat-card success">
            <h3>Delivered Orders</h3>
            <p className="stat-value">{dashboard?.deliveredOrders || 0}</p>
          </div>
        </div>

        <div className="dashboard-sections">
          <section className="admin-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <Link href="/admin/products/new" className="btn btn-primary">
                Add New Product
              </Link>
              <Link href="/admin/categories/new" className="btn btn-primary">
                Add New Category
              </Link>
              <Link href="/admin/orders" className="btn btn-secondary">
                View All Orders
              </Link>
              <Link href="/admin/products" className="btn btn-secondary">
                Manage Products
              </Link>
            </div>
          </section>

          <section className="admin-section">
            <h2>Recent Orders</h2>
            <div className="recent-orders">
              {dashboard?.recentOrders?.map(order => (
                <div key={order.id} className="recent-order-item">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <p>{order.customerName}</p>
                  </div>
                  <div>
                    <span className={`status status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <strong>${order.totalAmount.toFixed(2)}</strong>
                  </div>
                  <Link href={`/admin/orders/${order.id}`} className="btn btn-sm">
                    View
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}