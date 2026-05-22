import '../styles/globals.css';
import dynamic from 'next/dynamic';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TawkTo from '../components/TawkTo';
import PWAInstallBanner from '../components/PWAInstallBanner';

const Toaster = dynamic(
  () => import('react-hot-toast').then((mod) => mod.Toaster),
  { ssr: false }
);

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => (
    <>
      <Header />
      <main className="main-content">
        {page}
      </main>
      <Footer />
    </>
  ));

  return (
    <AuthProvider>
      <CartProvider>
        {getLayout(<Component {...pageProps} />)}
        <TawkTo />
        <PWAInstallBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1e293b',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '0.9375rem',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;
