// ============ pages/_app.js ============
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;
