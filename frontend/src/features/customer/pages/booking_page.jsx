import { useRef, useState } from 'react';
import { Building2, ChevronRight, Home, KeyRound, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/customer/booking.scss';

const steps = ['01', '02', '03', '04', '05', '06', '07'];

const categories = [
  {
    key: 'residential',
    title: 'Residential',
    description: 'Homes, apartments',
    icon: Home
  },
  {
    key: 'office',
    title: 'Office',
    description: 'Workspaces, studios',
    icon: Building2
  },
  {
    key: 'move',
    title: 'Move-in/out',
    description: 'Deep clean focused',
    icon: KeyRound
  }
];

const BookingPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('residential');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
  const MAX_FILES = 6;

  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: not an image`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: larger than 20MB`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length) {
      setUploadError(errors[0]);
    } else {
      setUploadError('');
    }

    if (!validFiles.length) return;

    const currentCount = photos.length;
    const slots = MAX_FILES - currentCount;
    const toAdd = validFiles.slice(0, Math.max(0, slots));
    const photoItems = await Promise.all(
      toAdd.map(async (file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        preview: await toDataUrl(file)
      }))
    );

    setPhotos((prev) => [...prev, ...photoItems]);
  };

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((item) => item.id !== id));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="booking-request-page">
      <div className="booking-steps">
        {steps.map((step, index) => (
          <div key={step} className={`step-circle ${index === 0 ? 'active' : ''}`}>
            {step}
          </div>
        ))}
      </div>

      <section className="request-container">
        <p className="crumbs">
          Dashboard <span>/</span> New Service Request
        </p>
        <h1>Tell us about your space</h1>
        <p className="lead">
          Help cleaners give you the most accurate quote by providing details and photos.
        </p>

        <div className="section-label">
          <span>1</span>
          <h2>Select Cleaning Category</h2>
        </div>

        <div className="category-grid">
          {categories.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedCategory === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`category-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(item.key)}
              >
                <Icon size={18} />
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </button>
            );
          })}
        </div>

        <div className="section-label">
          <span>2</span>
          <h2>Upload Photos</h2>
        </div>

        <div
          className={`upload-box ${isDragActive ? 'drag-active' : ''}`}
          onClick={openFileDialog}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragActive(false);
            await handleFiles(e.dataTransfer.files);
          }}
        >
          <div className="upload-icon">
            <UploadCloud size={22} />
          </div>
          <h3>Drag and drop photos here</h3>
          <p>
            or click to browse from your device <span>(Max 20MB)</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden-file-input"
            onClick={(e) => e.stopPropagation()}
            onChange={async (e) => {
              await handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="preview-row">
            {photos.map((photo) => (
              <div key={photo.id} className="preview-item">
                <img src={photo.preview} alt={photo.name} />
                <button
                  type="button"
                  className="remove-photo"
                  aria-label={`Remove ${photo.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                >
                  x
                </button>
              </div>
            ))}
            {photos.length < MAX_FILES && (
              <button
                type="button"
                aria-label="Add photo"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
              >
                +
              </button>
            )}
          </div>
          {uploadError && <p className="upload-error">{uploadError}</p>}
        </div>

        <div className="section-label">
          <span>3</span>
          <h2>Size &amp; Condition</h2>
        </div>

        <p className="hint">Describe the space (rooms, square footage, specific stains or messy areas)</p>
        <textarea
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="e.g. 3 bedroom apartment, roughly 1200 sqft. Needs focus on kitchen cabinets and master bathroom floor tiles."
        />

        <div className="footer-actions">
          <button type="button" className="back-btn" onClick={() => navigate('/customer/dashboard')}>
            Back to Previous Step
          </button>
          <button type="button" className="submit-btn" onClick={() => navigate('/customer/bookings/matching')}>
            Send to Cleaners <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default BookingPage;
