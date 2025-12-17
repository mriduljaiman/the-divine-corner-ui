# The Divine Corner - Frontend

Modern, responsive ecommerce frontend built with Next.js (Page Router), React, and pure CSS.

## 🚀 Tech Stack

- **Next.js 14** (Page Router)
- **React 18**
- **JavaScript ES6+**
- **Context API** (State Management)
- **Axios** (HTTP Client)
- **CSS3** (No frameworks, pure CSS)

## 📁 Project Structure

```
frontend/
├── pages/                  # Next.js pages
│   ├── _app.js            # App wrapper with providers
│   ├── index.js           # Home page
│   ├── about.js           # About page
│   ├── contact.js         # Contact page
│   ├── cart.js            # Shopping cart
│   ├── checkout.js        # Checkout page
│   ├── profile.js         # User profile
│   ├── auth/              # Authentication pages
│   │   ├── login.js
│   │   └── register.js
│   ├── products/          # Product pages
│   │   ├── index.js       # Product listing
│   │   └── [id].js        # Product detail
│   ├── orders/            # Order pages
│   │   ├── index.js       # Order history
│   │   └── [id].js        # Order details
│   └── admin/             # Admin panel
│       ├── dashboard.js
│       └── products/
│           └── index.js
│
├── components/            # Reusable components
│   ├── Header.js         # Navigation header
│   ├── Footer.js         # Footer
│   └── ProductCard.js    # Product card
│
├── context/              # React Context
│   ├── AuthContext.js   # Authentication state
│   └── CartContext.js   # Cart state
│
├── services/            # API services
│   ├── api.js          # Axios instance
│   ├── authService.js
│   ├── productService.js
│   ├── categoryService.js
│   ├── cartService.js
│   ├── orderService.js
│   ├── userService.js
│   └── dashboardService.js
│
├── styles/             # Global styles
│   └── globals.css
│
├── public/             # Static files
│   └── (images, icons)
│
├── package.json
├── .env.local         # Environment variables
├── .gitignore
└── README.md
```

## 🔧 Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend API running (see backend README)

### Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env.local
```

Or create `.env.local` manually:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open browser:**
```
http://localhost:3000
```

## 📜 Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🌐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Optional: For production
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## 🎨 Features

### Public Pages
- ✅ Home page with hero banner
- ✅ Product listing with filters
- ✅ Product search
- ✅ Product details
- ✅ Category browsing
- ✅ About us
- ✅ Contact page

### User Features
- ✅ User registration & login
- ✅ Shopping cart management
- ✅ Secure checkout
- ✅ Order history
- ✅ Order tracking
- ✅ Profile management
- ✅ Address management

### Admin Features
- ✅ Admin dashboard with statistics
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Order management
- ✅ User management
- ✅ Revenue analytics

## 🔐 Authentication

The application uses JWT authentication with HTTP-only cookies:

- Tokens are automatically managed by the browser
- No need to manually handle tokens in code
- Secure cookie-based authentication
- Auto-redirect to login for protected routes

### Protected Routes

**User Routes:**
- `/cart`
- `/checkout`
- `/orders`
- `/orders/[id]`
- `/profile`

**Admin Routes:**
- `/admin/dashboard`
- `/admin/products`
- `/admin/categories`
- `/admin/orders`
- `/admin/users`

## 🎯 Context API Usage

### Auth Context

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAdmin, isAuthenticated } = useAuth();
  
  // Check if user is logged in
  if (!isAuthenticated()) {
    return <div>Please login</div>;
  }
  
  // Check if user is admin
  if (isAdmin()) {
    return <div>Admin Panel</div>;
  }
  
  return <div>Welcome {user.firstName}</div>;
}
```

### Cart Context

```javascript
import { useCart } from '../context/CartContext';

function MyComponent() {
  const { cart, addToCart, updateCartItem, removeFromCart, getCartItemsCount } = useCart();
  
  // Add product to cart
  await addToCart(productId, quantity);
  
  // Get cart items count
  const count = getCartItemsCount();
  
  return <div>Cart Items: {count}</div>;
}
```

## 🔌 API Services

All API calls are handled through service files:

```javascript
// Example: Using product service
import { productService } from '../services/productService';

// Get all products
const response = await productService.getAllProducts(page, size);

// Search products
const response = await productService.searchProducts({
  categoryId: 'uuid',
  minPrice: 10,
  maxPrice: 100,
  search: 'phone'
});

// Get product by ID
const response = await productService.getProductById(id);
```

## 🎨 Styling

The application uses **pure CSS** with custom properties for theming:

```css
/* Custom CSS Variables */
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --secondary: #64748b;
  --success: #22c55e;
  --danger: #ef4444;
  --warning: #f59e0b;
}
```

### Responsive Design

The application is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔍 Pages Overview

### Home Page (`/`)
- Hero banner with call-to-action
- Category grid
- Featured products
- Responsive layout

### Products Page (`/products`)
- Product grid with pagination
- Filters (category, price range, search)
- Sort options
- Responsive cards

### Product Detail (`/products/[id]`)
- Image gallery with thumbnails
- Product information
- Add to cart functionality
- Stock availability
- Price with discounts

### Cart Page (`/cart`)
- Cart items list
- Quantity controls
- Remove items
- Order summary
- Proceed to checkout

### Checkout Page (`/checkout`)
- Shipping information form
- Order summary
- Payment method selection
- Order placement

### Orders Page (`/orders`)
- Order history
- Order status badges
- Order details link
- Pagination

### Profile Page (`/profile`)
- User information
- Edit profile
- Address management
- Password change (to be implemented)

### Admin Dashboard (`/admin/dashboard`)
- Revenue statistics
- Order statistics
- Product statistics
- Recent orders
- Quick actions

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Set environment variables in Vercel dashboard:**
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_URL` with your backend API URL

### Manual Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm start
```

3. **Or use PM2:**
```bash
npm install -g pm2
pm2 start npm --name "divine-corner" -- start
```

## 🐛 Troubleshooting

### Cannot connect to backend

**Issue:** Frontend can't fetch data from backend

**Solution:**
1. Check if backend is running: `curl http://localhost:8080/api/products`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check CORS settings in backend
4. Clear browser cache and cookies

### Authentication not working

**Issue:** User stays logged out after login

**Solution:**
1. Check if cookies are being set (Developer Tools → Application → Cookies)
2. Verify cookie domain settings in backend
3. Ensure `withCredentials: true` in API service
4. Check if backend and frontend are on same domain in production

### Images not loading

**Issue:** Product images not displaying

**Solution:**
1. Check if image URLs are valid
2. Verify CORS headers for images
3. Use placeholder image for missing images
4. Optimize images before upload

### Build errors

**Issue:** `npm run build` fails

**Solution:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## 📊 Performance Tips

1. **Image Optimization:**
   - Use optimized images
   - Implement lazy loading
   - Use Next.js Image component (optional)

2. **Code Splitting:**
   - Next.js automatically code splits
   - Dynamic imports for heavy components

3. **Caching:**
   - API responses are cached by browser
   - Static assets are cached by CDN

4. **SEO:**
   - Add meta tags to pages
   - Use semantic HTML
   - Implement structured data

## 🔒 Security Best Practices

- ✅ HttpOnly cookies for tokens
- ✅ CSRF protection via cookie settings
- ✅ Input validation on forms
- ✅ Protected routes with authentication
- ✅ Role-based access control
- ✅ Secure API communication

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👥 Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Check browser console for errors
- Verify environment variables

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Context API Guide](https://react.dev/learn/passing-data-deeply-with-context)
- [Axios Documentation](https://axios-http.com/docs/intro)

## 📞 Contact

- Email: support@divinecorner.com
- Website: https://divinecorner.com

---

**Made with ❤️ using Next.js and React**