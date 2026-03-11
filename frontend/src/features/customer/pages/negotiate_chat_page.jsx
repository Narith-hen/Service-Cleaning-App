import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Image, Paperclip, Send, Star, CheckCircle, User } from 'lucide-react';
import '../../../styles/customer/negotiate_chat.scss';

const NegotiateChatPage = () => {
  const navigate = useNavigate();
  const { cleanerId } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'cleaner',
      text: 'Hi! I\'ve reviewed your cleaning request. I can definitely help with your apartment deep clean.',
      time: '10:30 AM'
    },
    {
      id: 2,
      sender: 'user',
      text: 'That sounds perfect. I also have two small rugs in the living room - could you include a steam clean for those within the session?',
      time: '10:32 AM'
    },
    {
      id: 3,
      sender: 'cleaner',
      text: 'Absolutely. I\'ll add the steam rug equipment to our checklist. I\'ve updated the Service Blueprint below to include this. Everything looks aligned on my end!',
      time: '10:33 AM'
    }
  ]);

  // Mock cleaner data - in real app, this would come from API
  const cleaner = {
    id: cleanerId,
    name: 'Sparkle Cleaners Alignment',
    rating: 4.9,
    completed: 124,
    avatar: 'SC',
    servicePackage: 'DEEP CLEAN PLUS',
    estimatedDuration: 'Approx. 3.5 hours',
    proposedDate: 'Oct 24, 2023 - 10:00 AM',
    includedServices: [
      'Complete bathroom sanitation',
      'Kitchen deep clean (appliances included)',
      'Dusting and wiping all surfaces',
      'Vacuuming and mopping all floors',
      'Steam clean for 2 small rugs'
    ],
    quote: 155.00,
    serviceBlueprint: '3BR Deep Clean + 2 Rug Steam + Windows'
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'user',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="negotiate-chat-page">
      <header className="chat-header">
        <button 
          className="back-btn" 
          onClick={() => navigate('/customer/bookings/quotes')}
        >
          <ArrowLeft size={20} />
          Back to Quotes
        </button>
        
        <div className="cleaner-info">
          <div className="cleaner-avatar">{cleaner.avatar}</div>
          <div className="cleaner-details">
            <h2>{cleaner.name}</h2>
            <div className="rating">
              <Star size={14} className="filled" />
              <span>{cleaner.rating}</span>
              <span>({cleaner.completed} jobs)</span>
            </div>
          </div>
        </div>
      </header>

      <div className="chat-container">
        <aside className="service-details">
          <div className="service-package">
            <h3>SERVICE PACKAGE: {cleaner.servicePackage}</h3>
            <div className="package-details">
              <div className="detail-item">
                <Clock size={16} />
                <span>{cleaner.estimatedDuration}</span>
              </div>
              <div className="detail-item">
                <CalendarDays size={16} />
                <span>{cleaner.proposedDate}</span>
              </div>
            </div>
          </div>

          <div className="included-services">
            <h4>Included Services:</h4>
            <ul>
              {cleaner.includedServices.map((service, index) => (
                <li key={index}>
                  <CheckCircle size={14} />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="chat-main">
          <div className="messages-container">
            <div className="messages-list">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`message ${msg.sender === 'user' ? 'user-message' : 'cleaner-message'}`}
                >
                  {msg.sender === 'cleaner' && (
                    <div className="message-avatar">
                      <div className="avatar-circle">{cleaner.avatar}</div>
                    </div>
                  )}
                  <div className="message-content">
                    <p>{msg.text}</p>
                    <span className="message-time">{msg.time}</span>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="message-avatar">
                      <User size={16} className="user-icon" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="message-input-container">
            <div className="input-wrapper">
              <button className="attach-btn" aria-label="Attach file">
                <Paperclip size={18} />
              </button>
              <button className="image-btn" aria-label="Add image">
                <Image size={18} />
              </button>
              <input
                type="text"
                className="message-input"
                placeholder="Ask about specific services or times..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                className="send-btn" 
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>

      <div className="service-blueprint">
        <div className="blueprint-header">
          <h3>SERVICE BLUEPRINT SUMMARY</h3>
        </div>
        <div className="blueprint-content">
          <div className="blueprint-text">
            {cleaner.serviceBlueprint}
          </div>
          <button className="confirm-book-btn">
            Confirm and Book
          </button>
        </div>
      </div>
    </div>
  );
};

export default NegotiateChatPage;
