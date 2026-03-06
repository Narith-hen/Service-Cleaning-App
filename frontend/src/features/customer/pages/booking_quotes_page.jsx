import { BadgeCheck, CalendarDays, Filter, ImagePlus, Info, MapPin, MessageSquare, Ruler, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import deepCleanImage from '../../../assets/image.png';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import '../../../styles/customer/booking_quotes.scss';

const steps = ['01', '02', '03', '04', '05', '06', '07'];

const quotes = [
  {
    id: 'cleaner-1',
    name: 'Elena Rodriguez',
    rating: 4.9,
    completed: 124,
    quote: 120,
    eta: 'Approx. 3.5 hours',
    note: 'I specialize in deep cleaning and move-out services. I can bring all my own premium eco-friendly supplies if needed.',
    tag: ''
  },
  {
    id: 'cleaner-2',
    name: 'Marcus Chen',
    rating: 4.7,
    completed: 89,
    quote: 95,
    eta: 'Approx. 3 hours',
    note: 'Quick and efficient. I live in the downtown area and can be there exactly on time. Happy to discuss any special instructions.',
    tag: 'BEST VALUE'
  },
  {
    id: 'cleaner-3',
    name: 'Sparkle Shine Services',
    rating: 5.0,
    completed: 432,
    quote: 155,
    eta: 'Approx. 2 hours (2 cleaners)',
    note: 'Professional 2-person team. We provide thorough deep cleaning and sanitize all surfaces. Bonded and insured agency.',
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
          <h2>Apartment Cleaning</h2>
          <small>ID: #44291 - Posted 2h ago</small>

          <ul>
            <li>
              <Ruler size={16} />
              <div>
                <p>Space Size</p>
                <strong>850 sq ft (2BR / 1BA)</strong>
              </div>
            </li>
            <li>
              <CalendarDays size={16} />
              <div>
                <p>Preferred Date</p>
                <strong>Oct 24, 2023 - 10:00 AM</strong>
              </div>
            </li>
            <li>
              <MapPin size={16} />
              <div>
                <p>Location</p>
                <strong>Downtown, Seattle</strong>
              </div>
            </li>
          </ul>

          <h3>Reference Photos</h3>
          <div className="photo-grid">
            <img src={homeImage} alt="Reference room" className="photo" />
            <img src={officeImage} alt="Reference tile" className="photo" />
            <div className="photo more-overlay">
              <img src={deepCleanImage} alt="Reference kitchen" className="photo more-image" />
              <span>+2 More</span>
            </div>
            <button type="button" className="upload-photo" aria-label="Upload more photos">
              <ImagePlus size={20} />
            </button>
          </div>

          <button type="button" className="edit-btn" onClick={() => navigate('/customer/bookings')}>
            Edit Request Details
          </button>
        </aside>

        <main className="quotes-panel">
          <header className="quotes-header">
            <div>
              <h1>Quotes Received</h1>
              <p>3 cleaners are interested in your request</p>
            </div>
            <div className="filter-row">
              <button type="button" className="filter-btn">
                <Filter size={14} />
                Filter
              </button>
              <button type="button" className="filter-btn">
                <Filter size={14} />
                Price: Low to High
              </button>
            </div>
          </header>

          <div className="quote-list">
            {quotes.map((item, index) => (
              <article key={item.id} className="quote-card">
                <div className={`avatar avatar-${index + 1}`} aria-hidden />
                <div className="quote-content">
                  <div className="name-row">
                    <h2>{item.name}</h2>
                    <BadgeCheck size={16} />
                    {item.tag === 'TEAM' && <span className="tag">TEAM</span>}
                  </div>
                  <p className="stats">
                    <span><Star size={14} /> {item.rating}</span>
                    <span>{item.completed} Cleanings completed</span>
                  </p>
                  <p className="note">&quot;{item.note}&quot;</p>
                  <div className="actions">
                    <button type="button" className="chat-btn" onClick={() => navigate('/customer/notifications')}>
                      <MessageSquare size={14} />
                      Chat to Negotiate
                    </button>
                    <button type="button" className="profile-btn" onClick={() => navigate('/customer/profile')}>
                      View Full Profile
                    </button>
                  </div>
                </div>
                <div className="price">
                  {item.tag === 'BEST VALUE' && <span className="best-value">BEST VALUE</span>}
                  <p>Proposed Quote</p>
                  <strong>${item.quote.toFixed(2)}</strong>
                  <small>{item.eta}</small>
                </div>
              </article>
            ))}
          </div>

        </main>
      </section>

      <div className="tip-banner">
        <Info size={16} />
        <p>
          <strong>Safe Negotiation Tip:</strong> Use the built-in chat to discuss specific tasks or
          adjust the price. Once you agree, the cleaner will send an updated official offer for you
          to accept. All payments are secured via CleanStream.
        </p>
      </div>
    </div>
  );
};

export default BookingQuotesPage;
