import { useNavigate } from 'react-router-dom';
import narithImage from '../../../assets/narith.png';
import meyImage from '../../../assets/mey.JPG';
import molikaImage from '../../../assets/molika.png';
import homeServiceImage from '../../../assets/home.png';
import officeServiceImage from '../../../assets/office.png';
import windowServiceImage from '../../../assets/window.png';
import moveServiceImage from '../../../assets/move.png';
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

const featuredCleaners = [
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
];

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

  return (
    <div className="customer-home-landing">
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
              Booking Now!
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
          {/* <h2>How It Works</h2> */}
          <p className="how-summary">
            Explain the simple process so customers understand how to book.
          </p>
        </header>

        <div className="how-flow">
          {howItWorksSteps.map((item) => (
            <article key={item.step} className="how-step">
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
          {serviceHighlights.map((service) => (
            <article key={service.id} className="service-highlight-item">
              <img src={service.image} alt={service.title} />
              <div className="service-highlight-body">
                <span className="service-index">{service.id.slice(1)}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <button type="button" className="service-card-btn" onClick={() => navigate('/customer/services')}>
                  {service.cta}
                </button>
              </div>
            </article>
          ))}
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
          {/* <h2>Top Rated Cleaners</h2> */}
          <p className="cleaners-summary">
            Show some top cleaners or companies from your platform.
          </p>
        </header>

        <div className="cleaners-grid">
          {featuredCleaners.map((cleaner) => (
            <article key={cleaner.id} className="cleaner-card">
              <div className="cleaner-photo-wrap">
                <img src={cleaner.photo} alt={cleaner.company} className="cleaner-photo" />
              </div>
              <h3>{cleaner.company}</h3>
              <p className="cleaner-rating">{'⭐'.repeat(cleaner.rating)}</p>
              <p className="cleaner-reviews">{cleaner.reviews} total reviews</p>
              <button
                type="button"
                className="cleaner-profile-btn"
                onClick={() => navigate('/customer/services')}
              >
                View Profile
              </button>
            </article>
          ))}
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
          {whyChoosePoints.map((point) => (
            <div key={point} className="why-item">
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
