import { BadgeCheck, Shield, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../../../assets/home.png';
import deepCleanImage from '../../../assets/image.png';
import regularImage from '../../../assets/window.png';
import officeImage from '../../../assets/office.png';
import '../../../styles/customer/home.scss';

const services = [
  {
    title: 'Deep Clean',
    description: 'A thorough, top-to-bottom cleaning of every nook and cranny in your home.',
    image: deepCleanImage
  },
  {
    title: 'Regular Cleaning',
    description: 'Weekly or bi-weekly maintenance to keep your living space consistently fresh.',
    image: regularImage
  },
  {
    title: 'Office Cleaning',
    description: 'Professional sanitation and cleaning for productive workspaces and offices.',
    image: officeImage
  }
];

const testimonials = [
  {
    quote:
      '"PureShine has changed my life. I come home to a fresh-smelling house every Friday without lifting a finger."',
    name: 'Sarah Jenkins',
    role: 'HOMEOWNER'
  },
  {
    quote:
      '"Our office has never been cleaner. The team arrives on time, follows all protocols, and the booking system is so smooth."',
    name: 'Michael Rivera',
    role: 'OFFICE MANAGER'
  },
  {
    quote:
      '"I booked a deep clean after renovation and they did an incredible job. They even cleaned the inside of the oven."',
    name: 'Emily Lawson',
    role: 'APARTMENT RESIDENT'
  }
];

const CustomerHomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="customer-home-landing">
      <section className="hero-section">
        <div className="hero-text">
          <p className="trust-badge">TRUSTED BY 5000+ HOUSEHOLDS</p>
          <h1>
            Professional Cleaning for a <span>Spotless Home</span>
          </h1>
          <p>
            Experience the joy of a pristine living space with our reliable residential and
            commercial cleaning services. Eco-friendly, vetted, and flexible.
          </p>

          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/customer/bookings')}>
              Book Now
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/services')}>
              View Pricing
            </button>
          </div>

          <div className="hero-rating">
            <div className="avatars">
              <span className="avatar one" />
              <span className="avatar two" />
            </div>
            <span>4.9/5 stars from over 2,000 reviews</span>
          </div>
        </div>

        <div className="hero-media">
          <img src={heroImage} alt="Modern clean room" />
        </div>
      </section>

      <section className="services-section">
        <h2>Our Specialized Services</h2>
        <p className="section-subtitle">
          Tailored cleaning solutions for every need, from one-time deep cleans to recurring office
          maintenance.
        </p>

        <div className="services-grid">
          {services.map((service, index) => (
            <article key={service.title} className="service-card">
              <img src={service.image} alt={service.title} />
              <h3>
                {service.title}
                {index === 0 && <span className="tag">Popular</span>}
              </h3>
              <p>{service.description}</p>
              <button type="button" onClick={() => navigate('/services')}>
                Learn More
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="why-section">
        <div className="why-left">
          <h2>Why PureShine is the Best Choice</h2>
          <div className="feature-list">
            <div>
              <BadgeCheck size={18} />
              <div>
                <h4>Eco-Friendly Products</h4>
                <p>We use 100% biodegradable and non-toxic cleaning agents safe for kids and pets.</p>
              </div>
            </div>
            <div>
              <Shield size={18} />
              <div>
                <h4>Background Checked Staff</h4>
                <p>Our cleaning professionals undergo rigorous identity and criminal record checks.</p>
              </div>
            </div>
            <div>
              <CalendarClock size={18} />
              <div>
                <h4>Flexible Scheduling</h4>
                <p>Book, reschedule or cancel in seconds through our seamless web application.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="why-stats">
          {[
            ['98%', 'Satisfaction Rate'],
            ['15k+', 'Cleanings Done'],
            ['24/7', 'Customer Support'],
            ['100%', 'Insured Service']
          ].map(([value, label]) => (
            <article key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <h2>What Our Customers Say</h2>
        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="testimonial-card">
              <p className="stars">*****</p>
              <p className="quote">{item.quote}</p>
              <div className="author">
                <span className="avatar-sm" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready for a Cleaner, Healthier Space?</h2>
        <p>Book your first cleaning in less than 60 seconds. No credit card required to start.</p>
        <div className="cta-actions">
          <button type="button" className="btn-primary" onClick={() => navigate('/customer/bookings')}>
            Book Your First Cleaning
          </button>
          <button type="button" className="btn-secondary dark" onClick={() => navigate('/contact')}>
            Contact Sales
          </button>
        </div>
      </section>
    </div>
  );
};

export default CustomerHomePage;
