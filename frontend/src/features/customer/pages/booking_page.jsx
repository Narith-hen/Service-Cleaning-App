import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, CloudUpload, Home, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/customer/booking.scss';

const stepItems = ['Personal Data', 'Space Category', 'Photos & Details'];

const categoryItems = [
  {
    key: 'residential',
    title: 'Residential',
    desc: 'Deep cleaning for apartments, penthouses, and homes.',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    icon: Home
  },
  {
    key: 'office',
    title: 'Office',
    desc: 'Sanitizing corporate suites and creative studio environments.',
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    icon: Building2
  },
  {
    key: 'move-out',
    title: 'Move-Out',
    desc: 'Comprehensive turnover cleaning for new residents.',
    image:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    icon: Truck
  }
];

const BookingPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  // start with no category chosen so progress only increases when the user makes a selection
  const [selectedCategory, setSelectedCategory] = useState('');
  const [details, setDetails] = useState('');
  const [files, setFiles] = useState([]);

  const onFileChange = (fileList) => {
    const nextFiles = Array.from(fileList || []).slice(0, 10);
    setFiles(nextFiles);
  };

  // compute how far the user has progressed in filling out this step
  const computeProgress = () => {
    let completed = 0;
    if (selectedCategory) completed += 1;
    if (files.length > 0) completed += 1;
    if (details.trim() !== '') completed += 1;
    return Math.round((completed / 3) * 100);
  };

  const progressPercent = computeProgress();

  return (
    <div className="booking-page-v2">
      <div className="booking-shell">
        <header className="booking-header">
          <h1>Request a Cleaning</h1>
          <p>Professional service curated for your premium living and work spaces.</p>
        </header>

        <section className="booking-progress-card" aria-label="booking-progress">
          <div className="progress-topline">
            <span className="active">Step 2 of 3</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <h2>Space Category</h2>
          <div className="progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="progress-labels">
            {stepItems.map((item) => (
              <span key={item} className={item === 'Space Category' ? 'active' : ''}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="category-section">
          <h3>Select Space Category</h3>
          <div className="category-grid">
            {categoryItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedCategory === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`category-card ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(item.key)}
                >
                  <div className="image-wrap">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <div className="category-icon" aria-hidden>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="card-body">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="details-grid">
          <div>
            <h3>Upload Photos</h3>
            <div className="upload-card" onClick={() => inputRef.current?.click()} role="button" tabIndex={0}>
              <div className="upload-icon" aria-hidden>
                <CloudUpload size={20} />
              </div>
              <p className="upload-title">Drag &amp; drop space photos</p>
              <p className="upload-subtitle">Up to 10 images, max 5MB each</p>
              <button type="button" className="upload-btn">
                Browse Files
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onFileChange(e.target.files)}
              />
            </div>
            {files.length > 0 && (
              <p className="upload-count">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div>
            <h3>Additional Instructions</h3>
            <div className="instructions-card">
              <textarea
                placeholder="Tell us about special requirements, fragile items, or specific areas of focus..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
              <div className="tag-row" aria-hidden>
                <span># Eco-friendly</span>
                <span># No pet hair</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="booking-actions">
          <button type="button" className="back-btn" onClick={() => navigate('/customer/dashboard')}>
            <ArrowLeft size={16} /> Back
          </button>
          <button type="button" className="next-btn" onClick={() => navigate('/customer/bookings/matching')}>
            Next: Review Details <ArrowRight size={16} />
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BookingPage;
