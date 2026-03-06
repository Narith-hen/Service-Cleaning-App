import { ArrowLeft, SearchCheck, ShieldCheck, Images, Star, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import deepCleanImage from '../../../assets/image.png';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import '../../../styles/customer/booking_match.scss';

const steps = ['01', '02', '03', '04', '05', '06', '07'];

const statusCards = [
  {
    title: 'Identity Verified',
    body: 'Verifying background checks and certifications of nearby pros.',
    state: 'completed',
    icon: ShieldCheck,
    label: 'COMPLETED'
  },
  {
    title: 'Detail Review',
    body: '3 cleaners are currently reviewing your photos and job details.',
    state: 'active',
    icon: Images,
    label: 'ACTIVE NOW'
  },
  {
    title: 'Top Match',
    body: 'Selecting the highest rated provider for your specific task type.',
    state: 'pending',
    icon: Star,
    label: 'PENDING'
  }
];

const BookingMatchPage = () => {
  const navigate = useNavigate();
  const progress = 72;

  return (
    <div className="booking-match-page">
      <div className="booking-steps">
        {steps.map((step, index) => (
          <div key={step} className={`step-circle ${index === 1 ? 'active' : ''}`}>
            {step}
          </div>
        ))}
      </div>

      <section className="match-panel">
        <div className="match-top-row">
          <button type="button" className="back-link" onClick={() => navigate('/customer/bookings')}>
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mini-photos" aria-label="Previous uploaded photos">
            <img src={homeImage} alt="Previous upload 1" />
            <img src={officeImage} alt="Previous upload 2" />
            <img src={deepCleanImage} alt="Previous upload 3" />
          </div>
        </div>

        <div className="pulse-wrap" aria-hidden>
          <span />
          <span />
          <span />
          <div className="pulse-core">
            <SearchCheck size={30} />
          </div>
        </div>

        <h1>Finding the best cleaners for you...</h1>
        <p className="lead">
          We&apos;re connecting your request with top-rated professionals in your area who
          match your specific needs.
        </p>

        <article className="progress-card">
          <p className="badge">Status: Active</p>
          <div className="progress-head">
            <h2>Matching in Progress</h2>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="meta">
            <Clock3 size={14} />
            Usually takes less than 2 minutes to get the first response.
          </p>
        </article>

        <div className="status-grid">
          {statusCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className={`status-card ${item.state}`}>
                <div className="status-icon">
                  <Icon size={18} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <strong>{item.label}</strong>
              </article>
            );
          })}
        </div>

        <div className="actions-panel">
          <p>
            You&apos;ll receive a notification as soon as a cleaner accepts your request. You can
            then chat with them directly to finalize any details.
          </p>
          <div className="button-row">
            <button type="button" className="ghost-btn" onClick={() => navigate('/customer/bookings/quotes')}>
              View Quotes
            </button>
            <button type="button" className="ghost-btn" onClick={() => navigate('/customer/bookings')}>
              Edit Request
            </button>
            <button type="button" className="danger-btn" onClick={() => navigate('/customer/dashboard')}>
              Cancel Request
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookingMatchPage;
