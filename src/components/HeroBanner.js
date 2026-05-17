import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const banners = [
  {
    id: 1,
    title: 'The Divine Corner',
    subtitle: 'Handpicked Gifts for Every Occasion — Delivered with Love from Jaipur',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200'
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Discover Unique Gifts from Our Latest Collection',
    buttonText: 'Explore',
    buttonLink: '/products',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238bd345?w=1200'
  },
  {
    id: 3,
    title: 'Gifts for Every Occasion',
    subtitle: 'Birthday, Anniversary, Diwali — Find the Perfect Gift',
    buttonText: 'View Collection',
    buttonLink: '/products',
    bgColor: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
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