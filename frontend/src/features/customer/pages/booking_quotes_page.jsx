import { useNavigate } from 'react-router-dom';
import { MessageSquare, Star } from 'lucide-react';
import '../../../styles/customer/write_review.scss'; // Reusing styles from the quotes page

const BookingQuotesPage = () => {
  const navigate = useNavigate();

  const handleAcceptQuote = (bookingId) => {
    // On accepting a quote, navigate to chat
    navigate(`/customer/chat?booking=${bookingId}`);
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
          {/* Example Quote */}
          <article className="quote-card">
            <div className="avatar" />
            <div className="quote-main">
              <h3>Elena Rodriguez</h3>
              <p className="rating">
                <Star size={14} /> 4.9 • 124 Cleanings completed
              </p>
              <p className="message">"I specialize in deep cleaning and can start tomorrow. Happy to discuss details!"</p>
              <div className="quote-actions">
                <button type="button" className="chat-btn" onClick={() => handleAcceptQuote('demo-quote-1')}>
                  <MessageSquare size={14} /> Chat to Negotiate
                </button>
              </div>
            </div>
            <div className="quote-price">
              <strong>$120.00</strong>
              <button className="accept-quote-btn" onClick={() => handleAcceptQuote('demo-quote-1')}>Accept & Book</button>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
};

export default BookingQuotesPage;
