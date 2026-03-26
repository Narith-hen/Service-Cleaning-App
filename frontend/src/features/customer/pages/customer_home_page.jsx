import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import narithImage from '../../../assets/narith.png';
import meyImage from '../../../assets/mey.JPG';
import molikaImage from '../../../assets/molika.png';
import homeServiceImage from '../../../assets/home.png';
import officeServiceImage from '../../../assets/office.png';
import windowServiceImage from '../../../assets/window.png';
import moveServiceImage from '../../../assets/move.png';
import shopServiceImage from '../../../assets/shop.png';
import proServiceImage from '../../../assets/pro.png';
import api from '../../../services/api';
import '../../../styles/customer/home.scss';

const howItWorksSteps = [
  {
    step: '1',
    title: 'Book a Service',
    description: 'Choose the cleaning service and select your preferred date and time.'
  },
  {
    step: '2',
    title: 'Cleaner Arrives',
    description: 'Our professional cleaners arrive fully equipped.'
  },
  {
    step: '3',
    title: 'Cleaning Process',
    description: 'They clean your home or office efficiently.'
  },
  {
    step: '4',
    title: 'Enjoy a Spotless Space',
    description: 'Relax and enjoy a fresh and clean environment.'
  }
];

const serviceHighlights = [
  {
    id: 's1',
    title: 'Home Deep Cleaning',
    description: 'Complete cleaning for kitchen, bathroom, bedroom, and living areas.',
    image: homeServiceImage,
    cta: 'Book Deep Clean'
  },
  {
    id: 's2',
    title: 'Regular Home Cleaning',
    description: 'Weekly or daily cleaning to maintain a tidy home.',
    image: moveServiceImage,
    cta: 'Set a Schedule'
  },
  {
    id: 's3',
    title: 'Office Cleaning',
    description: 'Professional cleaning service for offices and workplaces.',
    image: officeServiceImage,
    cta: 'Clean My Office'
  },
  {
    id: 's4',
    title: 'Window Cleaning',
    description: 'Streak-free window cleaning for a brighter home.',
    image: windowServiceImage,
    cta: 'View Window Care'
  }
];

const fallbackImages = [homeServiceImage, officeServiceImage, windowServiceImage, moveServiceImage, shopServiceImage, proServiceImage];

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const mapServiceFromApi = (item, index) => ({
  id: String(item?.service_id || item?.id || `${item?.name || 'service'}-${index}`),
  title: String(item?.name || 'Untitled Service'),
  description: String(item?.description || 'Professional cleaning service.'),
  image: toAbsoluteImageUrl(item?.images?.[0]?.image_url || item?.image || '') || fallbackImages[index % fallbackImages.length],
  status: String(item?.status || 'active').toLowerCase(),
});

const mapFeaturedCleanerFromApi = (cleaner, index) => ({
  id: String(cleaner?.id || cleaner?.cleaner_id || `cleaner-${index}`),
  photo: toAbsoluteImageUrl(cleaner?.profileImage || cleaner?.profile_image || cleaner?.photo || '') || fallbackImages[index % fallbackImages.length],
  company: cleaner?.name || cleaner?.username || cleaner?.company_name || 'Cleaning Company',
  rating: Math.max(1, Math.round(Number(cleaner?.rating) || 0)),
  reviews: Number(cleaner?.reviews || cleaner?.total_reviews || 0)
});

const truncateWords = (text, wordLimit = 25) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};

const whyChoosePoints = [
  'Trusted and verified cleaners',
  'Affordable pricing',
  'Eco-friendly cleaning products',
  'Easy online booking',
  'Flexible scheduling',
  'Customer support'
];

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const [featuredCleaners, setFeaturedCleaners] = useState([]);
  const [loadingCleaners, setLoadingCleaners] = useState(true);

  useEffect(() => {
    const fetchTopCleaners = async () => {
      try {
        const response = await api.get('/dashboard/top-cleaners?limit=3');
        if (response.data.success) {
          const cleaners = (response.data.data || []).map(mapFeaturedCleanerFromApi);
          setFeaturedCleaners(cleaners);
        }
      } catch (error) {
        console.error('Failed to fetch top cleaners:', error);
        // Use fallback data if API fails
        setFeaturedCleaners([
          {
            id: 'c1',
            photo: narithImage,
            company: 'FreshNest Cleaning Co.',
            rating: 5,
            reviews: 186
          },
          {
            id: 'c2',
            photo: meyImage,
            company: 'Sparkle Pro Services',
            rating: 5,
            reviews: 241
          },
          {
            id: 'c3',
            photo: molikaImage,
            company: 'PrimeCare Cleaners',
            rating: 5,
            reviews: 203
          }
        ]);
      } finally {
        setLoadingCleaners(false);
      }
    };

    fetchTopCleaners();
  }, []);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services', { params: { page: 1, limit: 6 } });
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        const mappedServices = rows.map(mapServiceFromApi);
        setServices(mappedServices);
      } catch (error) {
        console.error('Failed to fetch services:', error);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const elements = document.querySelectorAll('.customer-home-landing .reveal');
    if (!elements.length) return undefined;

    setMotionEnabled(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    const frame = window.requestAnimationFrame(() => {
      elements.forEach((element) => observer.observe(element));
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [loadingServices, services.length]);

  const handleBookService = (service) => {
    navigate('/customer/bookings', {
      state: {
        service: {
          service_id: service.service_id || service.id,
          id: service.id,
          title: service.title,
          name: service.title,
          description: service.description,
          image: service.image
        }
      }
    });
  };

  return (
    <div className={`customer-home-landing ${motionEnabled ? 'motion-enhanced' : ''}`}>
      <section className="editorial-hero reveal">
        <div className="hero-copy">
          <h1>
            Professional Cleaning for a <br />
            <span>Spotless Home</span>
          </h1>
          <p>
            Experience the joy of a pristine living space with our reliable residential and
            commercial cleaning services. Eco-friendly, vetted, and flexible.
          </p>

          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/customer/bookings')}>
              Book Now
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/customer/services')}>
              View Services
            </button>
          </div>
        </div>
      </section>

      <section className="how-it-works reveal reveal-delay-1">
        <header className="how-head">
          <p className="how-kicker">HOW IT WORKS</p>
          <p className="how-summary">
            Explain the simple process so customers understand how to book.
          </p>
        </header>

        <div className="how-flow">
          {howItWorksSteps.map((item, index) => (
            <article key={item.step} className={`how-step reveal stagger-${Math.min(index + 1, 4)}`}>
              <div className="how-icon" aria-hidden="true">
                <span>{item.step}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="our-services reveal reveal-delay-2">
        <header className="services-head">
          <p className="services-kicker">OUR CLEANING SERVICES</p>
          <p className="services-summary">
            Choose from a wide range of professional cleaning services designed to keep your home or
            workplace spotless.
          </p>
        </header>

        <div className="service-highlight-grid">
          {loadingServices ? (
            <div className="services-loading">Loading services...</div>
          ) : services.length > 0 ? (
            services.slice(0, 4).map((service, index) => (
              <article key={service.id} className={`service-highlight-item reveal stagger-${Math.min(index + 1, 4)}`}>
                <img src={service.image} alt={service.title} />
                <div className="service-highlight-body">
                  <span className="service-index">{index + 1}</span>
                  <h3>{service.title}</h3>
                  <p>{truncateWords(service.description, 25)}</p>
                  <button type="button" className="service-card-btn" onClick={() => handleBookService(service)}>
                    Book Now
                  </button>
                </div>
              </article>
            ))
          ) : (
            serviceHighlights.map((service, index) => (
              <article key={service.id} className={`service-highlight-item reveal stagger-${Math.min(index + 1, 4)}`}>
                <img src={service.image} alt={service.title} />
                <div className="service-highlight-body">
                  <span className="service-index">{index + 1}</span>
                  <h3>{service.title}</h3>
                  <p>{truncateWords(service.description, 25)}</p>
                  <button type="button" className="service-card-btn" onClick={() => handleBookService(service)}>
                    {service.cta}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="services-actions">
          <button type="button" className="btn-primary" onClick={() => navigate('/customer/services')}>
            View All Services
          </button>
        </div>
      </section>

      <section className="top-cleaners reveal reveal-delay-2">
        <header className="cleaners-head">
          <p className="cleaners-kicker">TOP RATED CLEANERS</p>
          <p className="cleaners-summary">
            Show some top cleaners or companies from your platform.
          </p>
        </header>

        <div className="cleaners-grid">
          {loadingCleaners ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className={`cleaner-card reveal stagger-${Math.min(index + 1, 3)}`}>
                <div className="cleaner-photo-wrap skeleton-loader"></div>
                <h3 className="skeleton-loader" style={{ width: '80%', height: '24px', margin: '10px 0' }}></h3>
                <p className="skeleton-loader" style={{ width: '60%', height: '20px', margin: '5px 0' }}></p>
                <p className="skeleton-loader" style={{ width: '40%', height: '16px', margin: '5px 0' }}></p>
                <button className="cleaner-profile-btn skeleton-loader" style={{ height: '36px' }}></button>
              </div>
            ))
          ) : featuredCleaners.length > 0 ? (
            featuredCleaners.map((cleaner, index) => (
              <article key={cleaner.id} className={`cleaner-card reveal stagger-${Math.min(index + 1, 3)}`}>
                <div className="cleaner-photo-wrap">
                  <img src={cleaner.photo} alt={cleaner.company} className="cleaner-photo" />
                </div>
                <h3>{cleaner.company}</h3>
                <p className="cleaner-rating">{'\u2605'.repeat(cleaner.rating)}</p>
                <p className="cleaner-reviews">{cleaner.reviews} total reviews</p>
                <button
                  type="button"
                  className="cleaner-profile-btn"
                  onClick={() => navigate('/customer/services')}
                >
                  View Profile
                </button>
              </article>
            ))
          ) : (
            <div className="no-cleaners-message">
              <p>No top cleaners available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <section className="why-choose reveal reveal-delay-3">
        <header className="why-head">
          <p className="why-kicker">WHY CHOOSE US</p>
          <p className="why-summary">
            Customers want to know why they should trust your service.
          </p>
        </header>

        <div className="why-list">
          {whyChoosePoints.map((point, index) => (
            <div key={point} className={`why-item reveal stagger-${(index % 4) + 1}`}>
              <span className="why-icon" aria-hidden="true">
                {'\u2713'}
              </span>
              <span className="why-text">{point}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner reveal reveal-delay-4">
        <div className="cta-content">
          <h2>Ready for a Cleaning!</h2>
          <p>
            Book professional cleaners in minutes and enjoy a spotless space today.
          </p>
          <div className="cta-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/customer/bookings')}>
              Book Now
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/customer/services')}>
              Browse Services
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerHomePage;
