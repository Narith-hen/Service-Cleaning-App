import { BadgeCheck, CalendarDays, CircleFadingArrowUp, Filter, MapPin, MessageSquare, Ruler, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import deepCleanImage from '../../../assets/image.png';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import '../../../styles/customer/booking_quotes.scss';

const steps = ['01', '02', '03', '04'];

const quotes = [
  {
    id: 'quote-1',
    name: 'Elena Rodriguez',
    rating: 4.9,
    completed: 124,
    price: '$120.00',
    eta: 'Approx. 3.5 hours',
    note: 'I specialize in deep cleaning and move-out services. I bring eco-friendly supplies.',
    badge: 'BEST VALUE'
  },
  {
    id: 'quote-2',
    name: 'Marcus Chen',
    rating: 4.7,
    completed: 89,
    price: '$95.00',
    eta: 'Approx. 3 hours',
    note: 'Fast, efficient, and on time. Happy to discuss any special instructions.'
  },
  {
    id: 'quote-3',
    name: 'Sparkle Shine Services',
    rating: 5.0,
    completed: 432,
    price: '$155.00',
    eta: 'Approx. 2 hours (2 cleaners)',
    note: 'Professional 2-person team. Bonded and insured agency.',
    tag: 'TEAM'
  }
];

const BookingQuotesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="booking-quotes-page">
      <div className="booking-steps">
        {steps.map((step, index) => (
          <div key={step} className={`step-circle ${index === 2 ? 'active' : ''}`}>
            {step}
          </div>
        ))}
      </div>

      <section className="quotes-shell">
        <aside className="request-summary">
          <div className="summary-head">
            <p>Request Status</p>
            <span>ACTIVE</span>
          </div>
          <h2>Deep Cleaning</h2>
          <small>ID: #JOB-8921 - Posted 2h ago</small>

          <ul>
            <li>
              <Ruler size={18} />
              <div>
                <p>Space Size</p>
                <strong>850 sq ft (2BR / 1BA)</strong>
              </div>
            </li>
            <li>
              <CalendarDays size={18} />
              <div>
                <p>Preferred Date</p>
                <strong>March 24, 2026 - 10:00 AM</strong>
              </div>
            </li>
            <li>
              <MapPin size={18} />
              <div>
                <p>Location</p>
                <strong>Downtown Phnom Penh</strong>
              </div>
            </li>
          </ul>

          <h3>Reference Photos</h3>
          <div className="photo-grid">
            <img className="photo" src={homeImage} alt="Reference 1" />
            <img className="photo" src={officeImage} alt="Reference 2" />
            <div className="more-overlay">
              <img className="photo" src={deepCleanImage} alt="Reference 3" />
              <span>+2</span>
            </div>
            <button type="button" className="upload-photo">
              + Upload
            </button>
          </div>

          <button type="button" className="edit-btn" onClick={() => navigate('/customer/bookings')}>
            Edit Request Details
          </button>
        </aside>

        <div className="quotes-panel">
          <div className="quotes-header">
            <div>
              <h1>Quotes Received</h1>
              <p>3 cleaners are interested in your request</p>
            </div>
            <div className="filter-row">
              <button type="button" className="filter-btn">
                <Filter size={14} /> Filter
              </button>
              <button type="button" className="filter-btn">
                Price: Low to High
              </button>
            </div>
          </div>

          <div className="quote-list">
            {quotes.map((item, index) => (
              <article key={item.id} className="quote-card">
                <div className={`avatar avatar-${index + 1}`} aria-hidden />
                <div>
                  <div className="name-row">
                    <h2>{item.name}</h2>
                    <BadgeCheck size={16} />
                    {item.tag === 'TEAM' && <span className="tag">TEAM</span>}
                  </div>
                  <p className="stats">
                    <span>
                      <Star size={14} /> {item.rating}
                    </span>
                    <span>{item.completed} Cleanings completed</span>
                  </p>
                  <p className="note">"{item.note}"</p>
                  <div className="actions">
                    <button
                      type="button"
                      className="chat-btn"
                      onClick={() => navigate(`/customer/bookings/quotes/chat/${item.id}`)}
                    >
                      <MessageSquare size={14} />
                      Chat to Negotiate
                    </button>
                    <button type="button" className="profile-btn" onClick={() => navigate('/customer/profile')}>
                      View Full Profile
                    </button>
                  </div>
                </div>
                <div className="price">
                  {item.badge && <span className="best-value">{item.badge}</span>}
                  <p>Proposed Quote</p>
                  <strong>{item.price}</strong>
                  <small>{item.eta}</small>
                </div>
              </article>
            ))}
          </div>

          <div className="tip-banner">
            <CircleFadingArrowUp size={16} />
            <p>
              <strong>Safe Negotiation Tip:</strong> Use the built-in chat to discuss tasks or
              adjust the price. Once you agree, the cleaner will send an updated offer to accept.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingQuotesPage;