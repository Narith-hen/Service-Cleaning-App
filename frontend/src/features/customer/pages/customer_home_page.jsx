import { useEffect, useRef, useState } from 'react';
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
import useCustomerPageMotion from '../hooks/useCustomerPageMotion';
import '../../../styles/customer/home.scss';


const howItWorksSteps = [
  // {
  //   step: '1',
  //   title: 'Book a Service',
  //   description: 'Choose the cleaning service and select your preferred date and time.'
  // },
  {
    step: '1',
    title: 'Book a Service',
    description: 'Choose the cleaning service and select your preferred date and time..'
  },
  {
    step: '2',
    title: 'Cleaning Process',
    description: 'They clean your home or office efficiently.'
  },
  {
    step: '3',
    title: 'Enjoy a Spotless Space',
    description: 'Relax and enjoy a fresh and clean environment.'
  }
];

const serviceHighlights = [
  {
    id: 's2',
    title: 'Regular Home Cleaning',
    description: 'Weekly or daily cleaning to maintain a tidy home.',
    image: moveServiceImage,
    cta: 'Set a Schedule',
    status: 'active'
  },
  {
    id: 's3',
    title: 'Office Cleaning',
    description: 'Professional cleaning service for offices and workplaces.',
    image: officeServiceImage,
    cta: 'Clean My Office',
    status: 'active'
  },
  {
    id: 's4',
    title: 'Window Cleaning',
    description: 'Streak-free window cleaning for a brighter home.',
    image: windowServiceImage,
    cta: 'View Window Care',
    status: 'active'
  }
];

const hiddenServiceTitles = new Set();

const fallbackImages = [homeServiceImage, officeServiceImage, windowServiceImage, moveServiceImage, shopServiceImage, proServiceImage];
const fallbackTopCleaners = [
  {
    id: 'c1',
    photo: narithImage,
    company: 'FreshNest Cleaning Co.',
    rating: 5,
    reviews: 186,
    totalJobs: 0
  },
  {
    id: 'c2',
    photo: meyImage,
    company: 'Sparkle Pro Services',
    rating: 5,
    reviews: 241,
    totalJobs: 0
  },
  {
    id: 'c3',
    photo: molikaImage,
    company: 'PrimeCare Cleaners',
    rating: 5,
    reviews: 203,
    totalJobs: 0
  }
];

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

const formatServiceStatus = (status) => {
  const normalized = String(status || 'active').trim().toLowerCase();
  return normalized === 'active'
    ? 'Active'
    : normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const mapFeaturedCleanerFromApi = (cleaner, index) => ({
  id: String(cleaner?.id || cleaner?.cleaner_id || `cleaner-${index}`),
  photo: toAbsoluteImageUrl(cleaner?.profileImage || cleaner?.profile_image || cleaner?.photo || '') || fallbackImages[index % fallbackImages.length],
  company: cleaner?.name || cleaner?.username || cleaner?.company_name || 'Cleaning Company',
  rating: Math.max(1, Math.round(Number(cleaner?.rating) || 0)),
  reviews: Number(cleaner?.reviews || cleaner?.total_reviews || 0),
  totalJobs: Number(cleaner?.totalJobs || cleaner?.total_jobs || 0)
});

const getTopCleanerRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.cleaners)) return payload.cleaners;
  if (Array.isArray(payload?.data?.cleaners)) return payload.data.cleaners;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

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

const faqItems = [
    {
      question: "What cleaning services do you offer?",
      answer:
        "We provide home cleaning, office cleaning, deep cleaning, move-in or move-out cleaning, and shop cleaning services."
    },
    {
      question: "Do you bring your own cleaning supplies?",
      answer:
        "Yes. Our cleaners arrive with standard supplies and equipment, so you do not need to prepare anything unless you prefer specific products."
    },
    {
      question: "Do I need to stay at home during the service?",
      answer:
        "No. Many customers give access instructions in advance, but you can stay if you prefer to be present while the cleaning is done."
    },
    {
      question: "How can I reschedule or cancel a booking?",
      answer:
        "You can manage your booking from your account dashboard or contact our support team if you need help changing the date and time."
    },
    {
      question: "How fast can I book a cleaning appointment?",
      answer:
        "You can book online in a few minutes, and available time slots depend on your location, service type, and cleaner availability."
    }
  ];

const CustomerHomePage = () => {
  const navigate = useNavigate();
  const [featuredCleaners, setFeaturedCleaners] = useState([]);
  const [loadingCleaners, setLoadingCleaners] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(1);
  const pageRef = useRef(null);

  useEffect(() => {
    const fetchTopCleaners = async () => {
      try {
        const response = await api.get('/dashboard/top-cleaners', { params: { limit: 20 } });
        const rows = getTopCleanerRows(response?.data);
        const cleaners = rows
          .map(mapFeaturedCleanerFromApi)
          .filter((cleaner) => cleaner.id && cleaner.company)
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            if (b.reviews !== a.reviews) return b.reviews - a.reviews;
            return b.totalJobs - a.totalJobs;
          })
          .slice(0, 3);

        setFeaturedCleaners(cleaners.length ? cleaners : fallbackTopCleaners);
      } catch (error) {
        console.error('Failed to fetch top cleaners:', error);
        setFeaturedCleaners(fallbackTopCleaners);
      } finally {
        setLoadingCleaners(false);
      }
    };

    fetchTopCleaners();
  }, []);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

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
  const motionEnhanced = useCustomerPageMotion(pageRef);

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

  const visibleServices = services.filter((service) => !hiddenServiceTitles.has(service.title));

  return (
    <div
      ref={pageRef}
      className={`customer-home-landing ${motionEnhanced ? 'motion-enhanced' : ''}`}
    >
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
          ) : visibleServices.length > 0 ? (
            visibleServices.slice(0, 3).map((service, index) => (
              <article key={service.id} className={`service-highlight-item reveal stagger-${Math.min(index + 1, 4)}`}>
                <div className="service-highlight-media">
                  <img src={service.image} alt={service.title} loading="lazy" decoding="async" />
                  <span className={`service-status-badge ${service.status === 'active' ? 'active' : ''}`}>
                    {formatServiceStatus(service.status)}
                  </span>
                </div>
                <div className="service-highlight-body">
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
                <div className="service-highlight-media">
                  <img src={service.image} alt={service.title} loading="lazy" decoding="async" />
                  <span className={`service-status-badge ${service.status === 'active' ? 'active' : ''}`}>
                    {formatServiceStatus(service.status)}
                  </span>
                </div>
                <div className="service-highlight-body">
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
                  <img src={cleaner.photo} alt={cleaner.company} className="cleaner-photo" loading="lazy" decoding="async" />
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

      <section className="dashboard-faq reveal reveal-delay-3">
        <header className="faq-head">
          <p className="faq-kicker">FAQ</p>
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <p>
            Everything customers usually ask before booking a cleaning service with us.
          </p>
        </header>

        <div className="faq-accordion">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <article
                key={item.question}
                className={`faq-card ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-trigger"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                >
                  <span>{item.question}</span>
                  <span className="faq-chevron" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </article>
            );
          })}
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
