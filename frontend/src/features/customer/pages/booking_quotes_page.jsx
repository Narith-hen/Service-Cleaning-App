import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Star } from 'lucide-react';
import '../../../styles/customer/write_review.scss';

const BookingQuotesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const bookingId = (() => {
    const fromState = location?.state?.bookingId || location?.state?.booking_id;
    const fromQuery = searchParams.get('booking') || searchParams.get('thread');
    const candidate = fromState || fromQuery;

    if (candidate && /^\d+$/.test(String(candidate))) {
      return String(candidate);
    }

    try {
      const stored = localStorage.getItem('last_booking_id');
      return stored && /^\d+$/.test(String(stored)) ? String(stored) : null;
    } catch {
      return null;
    }
  })();

  const handleAcceptQuote = () => {
    if (!bookingId) {
      navigate('/customer/bookings');
      return;
    }

    navigate(`/customer/chat?booking=${encodeURIComponent(bookingId)}`);
  };

  return (
    <div className="quotes-page" style={{ background: '#f0f2f5', minHeight: '100vh', padding: '40px 20px' }}>
      <main className="quotes-content" style={{ margin: 'auto', maxWidth: '900px', background: 'white', borderRadius: '12px', padding: '2rem' }}>
        <div className="quotes-head">
          <div>
            <h2>Quotes Received</h2>
            <p>Cleaners interested in your job will appear here. You can then chat and accept their offer.</p>
          </div>
        </div>
        <div className="quote-list">
          <article className="quote-card">
            <div className="avatar" />
            <div className="quote-main">
              <h3>Elena Rodriguez</h3>
              <p className="rating">
                <Star size={14} /> 4.9 • 124 Cleanings completed
              </p>
              <p className="message">"I specialize in deep cleaning and can start tomorrow. Happy to discuss details!"</p>
              <div className="quote-actions">
                <button type="button" className="chat-btn" onClick={handleAcceptQuote}>
                  <MessageSquare size={14} /> Chat to Negotiate
                </button>
              </div>
            </div>
            <div className="quote-price">
              <strong>$120.00</strong>
              <button type="button" className="accept-quote-btn" onClick={handleAcceptQuote}>
                Accept & Book
              </button>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
};

export default BookingQuotesPage;
