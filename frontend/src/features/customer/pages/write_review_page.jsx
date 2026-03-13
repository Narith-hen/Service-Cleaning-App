import { CalendarDays, CircleFadingArrowUp, Filter, MapPin, MessageSquare, Ruler, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import deepCleanImage from '../../../assets/image.png';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import '../../../styles/customer/write_review.scss';

const steps = ['01', '02', '03', '04', '05', '06', '07'];

const quotes = [
  {
    name: 'Elena Rodriguez',
    rating: 4.9,
    jobs: 124,
    quote: '$120.00',
    eta: 'Approx. 3.5 hours',
    message:
      'I specialize in deep cleaning and move-out services. I can bring all my own premium eco-friendly supplies if needed.'
  },
  {
    name: 'Marcus Chen',
    rating: 4.7,
    jobs: 89,
    quote: '$95.00',
    eta: 'Approx. 3 hours',
    badge: 'BEST VALUE',
    message:
      'Quick and efficient. I live in the downtown area and can be there exactly on time. Happy to discuss any special instructions.'
  },
  {
    name: 'Sparkle Shine Services',
    rating: 5.0,
    jobs: 432,
    quote: '$155.00',
    eta: 'Approx. 2 hours (2 cleaners)',
    team: true,
    message:
      'Professional 2-person team. We provide thorough deep cleaning and sanitize all surfaces. Bonded and insured agency.'
  }
];

const WriteReviewPage = () => {
  const navigate = useNavigate();

  return (
    <div className="quotes-page">
      <div className="quotes-steps">
        {steps.map((step, index) => (
          <div key={step} className={`step-dot ${index === 2 ? 'active' : ''}`}>
            {step}
          </div>
        ))}
      </div>

      <section className="quotes-panel">
        <aside className="request-sidebar">
          <p className="sidebar-label">REQUEST STATUS</p>
          <div className="sidebar-head">
            <h3>Apartment Cleaning</h3>
            <span>ACTIVE</span>
          </div>
          <p className="meta">ID: #44291 • Posted 2h ago</p>

          <div className="detail-row">
            <Ruler size={16} />
            <div>
              <small>Space Size</small>
              <strong>850 sq ft (2BR / 1BA)</strong>
            </div>
          </div>

          <div className="detail-row">
            <CalendarDays size={16} />
            <div>
              <small>Preferred Date</small>
              <strong>Oct 24, 2023 • 10:00 AM</strong>
            </div>
          </div>

          <div className="detail-row">
            <MapPin size={16} />
            <div>
              <small>Location</small>
              <strong>Downtown, Seattle</strong>
            </div>
          </div>

          <h4>Reference Photos</h4>
          <div className="photo-grid">
            <img src={homeImage} alt="Reference 1" />
            <img src={officeImage} alt="Reference 2" />
            <img src={deepCleanImage} alt="Reference 3" />
            <button type="button">+2 More</button>
          </div>

          <button type="button" className="edit-btn" onClick={() => navigate('/customer/bookings')}>
            Edit Request Details
          </button>
        </aside>

        <main className="quotes-content">
          <div className="quotes-head">
            <div>
              <h2>Quotes Received</h2>
              <p>3 cleaners are interested in your request</p>
            </div>
            <div className="head-actions">
              <button type="button">
                <Filter size={14} /> Filter
              </button>
              <button type="button">Price: Low to High</button>
            </div>
          </div>

          <div className="quote-list">
            {quotes.map((item) => (
              <article key={item.name} className="quote-card">
                <div className="avatar" />
                <div className="quote-main">
                  <h3>
                    {item.name}
                    {item.team && <span className="team-tag">TEAM</span>}
                  </h3>
                  <p className="rating">
                    <Star size={14} /> {item.rating} • {item.jobs} Cleanings completed
                  </p>
                  <p className="message">"{item.message}"</p>
                  <div className="quote-actions">
                    <button type="button" className="chat-btn" onClick={() => navigate('/customer/notifications')}>
                      <MessageSquare size={14} /> Chat to Negotiate
                    </button>
                    <button type="button" className="profile-btn" onClick={() => navigate('/customer/profile')}>
                      View Full Profile
                    </button>
                  </div>
                </div>
                <div className="quote-price">
                  {item.badge && <span className="best-tag">{item.badge}</span>}
                  <small>PROPOSED QUOTE</small>
                  <strong>{item.quote}</strong>
                  <p>{item.eta}</p>
                </div>
              </article>
            ))}
          </div>
        </main>
      </section>

      <div className="tip-box">
        <CircleFadingArrowUp size={16} />
        <p>
          <strong>Safe Negotiation Tip:</strong> Use the built-in chat to discuss specific tasks or
          adjust the price. Once you agree, the cleaner will send an updated official offer for you
          to accept.
        </p>
      </div>
    </div>
  );
};

export default WriteReviewPage;
