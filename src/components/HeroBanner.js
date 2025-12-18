import { useState, useEffect } from 'react';
import Link from 'next/link';

const banners = [
  {
    id: 1,
    title: 'Welcome to The Divine Corner',
    subtitle: 'Discover amazing products at unbeatable prices',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200'
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Check out our latest collection of premium products',
    buttonText: 'Explore',
    buttonLink: '/products',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200'
  },
  {
    id: 3,
    title: 'Special Offers',
    subtitle: 'Up to 50% off on selected items',
    buttonText: 'View Deals',
    buttonLink: '/products',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200'
  }
];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % banners.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const prevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const goToSlide = (index) => {
    if (!isAnimating && index !== currentSlide) {
      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  return (
    <div className="hero-banner">
      <div className="banner-slider">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`banner-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ background: banner.bgColor }}
          >
            <div className="banner-content">
              <div className="banner-text">
                <h1 className="banner-title">{banner.title}</h1>
                <p className="banner-subtitle">{banner.subtitle}</p>
                <Link href={banner.buttonLink} className="banner-button">
                  {banner.buttonText}
                </Link>
              </div>
              <div className="banner-image">
                <img src={banner.image} alt={banner.title} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button className="banner-arrow banner-arrow-left" onClick={prevSlide}>
        ❮
      </button>
      <button className="banner-arrow banner-arrow-right" onClick={nextSlide}>
        ❯
      </button>

      {/* Dots Indicator */}
      <div className="banner-dots">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`banner-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}