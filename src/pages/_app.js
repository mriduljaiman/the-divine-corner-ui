import '../styles/globals.css';
import dynamic from 'next/dynamic';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import TawkTo from '../components/TawkTo';
import PWAInstallBanner from '../components/PWAInstallBanner';

const SplashScreen = dynamic(() => import('../components/SplashScreen'), { ssr: false });

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
      <BottomNav />
    </>
  ));

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
    <AuthProvider>
      <CartProvider>
        {getLayout(<Component {...pageProps} />)}
        <SplashScreen />
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
    </GoogleOAuthProvider>
  );
}

export default MyApp;
