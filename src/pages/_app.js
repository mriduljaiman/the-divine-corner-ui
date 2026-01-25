import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatWidget from '../components/ChatWidget';

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
        <ChatWidget />
      </CartProvider>
    </AuthProvider>
  );
}

export default MyApp;