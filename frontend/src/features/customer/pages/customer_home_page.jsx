import { useNavigate } from 'react-router-dom';
import heroImage from '../../../assets/home.png';
import deepCleanImage from '../../../assets/image.png';
import regularImage from '../../../assets/window.png';
import officeImage from '../../../assets/office.png';
import '../../../styles/customer/home.scss';

const cleaningHighlights = [
  {
    title: 'Home Deep Cleaning',
    description: 'Detailed room-by-room cleaning for kitchens, bathrooms, bedrooms, and living areas.',
    image: deepCleanImage
  },
  {
    title: 'Regular Cleaning',
    description: 'Weekly or bi-weekly service to keep your home fresh, tidy, and healthy.',
    image: regularImage
  },
  {
    title: 'Office Cleaning',
    description: 'Reliable cleaning for workspaces to maintain a professional and productive environment.',
    image: officeImage
  }
];

const CustomerHomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="customer-home-landing">
      <section className="editorial-hero reveal">
        <div className="hero-copy">
          <h1>
            Professional Cleaning for a <span>Spotless Home</span>
          </h1>
          <p>
            Experience the joy of a pristine living space with our reliable residential and
            commercial cleaning services. Eco-friendly, vetted, and flexible.
          </p>

          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/customer/bookings')}>
              Book Your Service Cleaning
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/customer/services')}>
              View Services
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

      <section className="dashboard-services reveal reveal-delay-1">
        <div className="section-head">
          <p className="section-kicker">OUR SERVICES</p>
          <h2>Cleaning Services Made Simple</h2>
          <p>
            Choose from trusted residential and commercial cleaning options designed for comfort
            and consistency.
          </p>
        </div>

        <div className="service-highlight-grid">
          {cleaningHighlights.map((item) => (
            <article key={item.title} className="service-highlight-item">
              <img src={item.image} alt={item.title} />
              <div className="service-highlight-body">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <button type="button" onClick={() => navigate('/customer/services')}>
                  View Service
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
};

export default CustomerHomePage;
