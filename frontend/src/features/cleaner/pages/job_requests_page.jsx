import React, { useRef, useState } from 'react';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  PictureOutlined
} from '@ant-design/icons';
import '../../../styles/cleaner/job_requests.scss';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import windowImage from '../../../assets/window.png';
import shopImage from '../../../assets/shop.png';
import fallbackImage from '../../../assets/image.png';

const jobRequests = [
  {
    id: 1,
    badge: 'URGENT',
    badgeType: 'urgent',
    title: 'Deep House Cleaning',
    price: '$145.00',
    image: homeImage,
    details: [
      { icon: <EnvironmentOutlined />, text: 'Downtown District, Central Heights' },
      { icon: <ClockCircleOutlined />, text: 'Est. 4.5 Hours - Starts Today, 2:00 PM' },
      { icon: <InfoCircleOutlined />, text: '3 BR, 2 BA - Supplies provided' }
    ],
    extraDetails: [
      'Customer: Sarah Jenkins',
      'Special request: Focus on kitchen grease and bathroom tiles',
      'Parking available in basement lot B2',
      'Contact on arrival: +1 (555) 138-4421'
    ]
  },
  {
    id: 2,
    badge: '',
    badgeType: '',
    title: 'Move-Out Sanitation',
    price: '$210.00',
    image: shopImage,
    details: [
      { icon: <EnvironmentOutlined />, text: 'Oak Ridge Estates, North Side' },
      { icon: <ClockCircleOutlined />, text: 'Est. 6 Hours - Tomorrow, 9:00 AM' },
      { icon: <InfoCircleOutlined />, text: 'Empty Apartment - Focus on Kitchen' }
    ],
    extraDetails: [
      'Customer: Michael Reed',
      'Move-out checklist provided by landlord',
      'Bring strong degreaser for oven and range hood',
      'Gate code: #4128'
    ]
  },
  {
    id: 3,
    badge: '',
    badgeType: '',
    title: 'Office Recurring Clean',
    price: '$85.00',
    image: officeImage,
    details: [
      { icon: <EnvironmentOutlined />, text: 'Tech Park, Building 4B' },
      { icon: <ClockCircleOutlined />, text: 'Est. 2 Hours - Weekly Contract' },
      { icon: <InfoCircleOutlined />, text: 'General dusting and waste removal' }
    ],
    extraDetails: [
      'Customer: NovaTech Office Admin',
      'Clean schedule: Every Monday and Thursday',
      'Conference room needs extra glass cleaning',
      'Access card pickup at front desk'
    ]
  },
  {
    id: 4,
    badge: 'NEW CLIENT',
    badgeType: 'new',
    title: 'Condo Routine Clean',
    price: '$110.00',
    image: windowImage,
    details: [
      { icon: <EnvironmentOutlined />, text: 'The View Condos, Floor 12' },
      { icon: <ClockCircleOutlined />, text: 'Est. 3 Hours - Saturday, 10:00 AM' },
      { icon: <InfoCircleOutlined />, text: 'No pets - Hardwood floors' }
    ],
    extraDetails: [
      'Customer: Emily Carter',
      'Use wood-safe cleaning products only',
      'Primary focus: Living room windows and kitchen area',
      'Building requires check-in at reception'
    ]
  }
];

const JobRequestsPage = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [chatJob, setChatJob] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState({});
  const imageInputRef = useRef(null);

  const getCustomerName = (job) => {
    if (!job?.extraDetails?.length) return 'Customer';
    const customerLine = job.extraDetails.find((line) => line.startsWith('Customer:'));
    if (!customerLine) return 'Customer';
    return customerLine.replace('Customer:', '').trim() || 'Customer';
  };

  const getCustomerInitials = (name) => {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return 'C';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  };

  const openChat = (job) => {
    if (!job) return;

    setChatJob(job);
    setSelectedJob(null);
    setChatInput('');

    setChatMessages((prev) => {
      if (prev[job.id]) return prev;

      const customerName = getCustomerName(job);
      return {
        ...prev,
        [job.id]: [
          {
            id: `${job.id}-seed-1`,
            from: 'customer',
            text: `Hi, this is ${customerName}. Thanks for accepting my request.`,
            time: 'Now'
          },
          {
            id: `${job.id}-seed-2`,
            from: 'customer',
            text: 'Please message me when you are on your way.',
            time: 'Now'
          }
        ]
      };
    });
  };

  const handleSendMessage = () => {
    if (!chatJob) return;

    const text = chatInput.trim();
    if (!text) return;

    const outgoingMessage = {
      id: `${chatJob.id}-${Date.now()}`,
      from: 'cleaner',
      text,
      time: 'Now'
    };

    setChatMessages((prev) => {
      const existing = prev[chatJob.id] || [];
      return {
        ...prev,
        [chatJob.id]: [...existing, outgoingMessage]
      };
    });

    setChatInput('');
  };

  const handlePickImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelected = (event) => {
    if (!chatJob) return;

    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const outgoingImageMessage = {
        id: `${chatJob.id}-img-${Date.now()}`,
        from: 'cleaner',
        image: String(reader.result),
        time: 'Now'
      };

      setChatMessages((prev) => {
        const existing = prev[chatJob.id] || [];
        return {
          ...prev,
          [chatJob.id]: [...existing, outgoingImageMessage]
        };
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="cleaner-job-requests-page">
      <div className="page-headline">
        <h1>Available Job Requests</h1>
        <p>Review and accept high-priority cleaning opportunities in your area.</p>
      </div>

      <div className="job-request-grid">
        {jobRequests.map((job) => (
          <article
            className="job-request-card"
            key={job.id}
            onClick={() => setSelectedJob(job)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedJob(job);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="job-image-wrap">
              {job.badge ? <span className={`job-badge ${job.badgeType}`}>{job.badge}</span> : null}
              <img
                src={job.image}
                alt={job.title}
                onError={(e) => {
                  e.currentTarget.src = fallbackImage;
                }}
              />
              <div className="job-image-title">{job.title}</div>
            </div>

            <div className="job-content">
              <div className="job-top-row">
                <div className="job-price">{job.price}</div>
              </div>

              <ul className="job-meta-list">
                {job.details.map((detail, idx) => (
                  <li key={`${job.id}-${idx}`}>
                    {detail.icon}
                    <span>{detail.text}</span>
                  </li>
                ))}
              </ul>

              <div className="job-actions">
                <button
                  type="button"
                  className="accept-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openChat(job);
                  }}
                >
                  <CheckCircleOutlined /> Accept
                </button>
                <button
                  type="button"
                  className="decline-btn"
                  aria-label="decline request"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CloseOutlined />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedJob ? (
        <div className="job-request-modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div
            className="job-request-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedJob.title} details`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="job-request-modal-head">
              <button
                type="button"
                className="job-request-modal-close"
                aria-label="Close details"
                onClick={() => setSelectedJob(null)}
              >
                <CloseOutlined />
              </button>
            </div>

            <div className="job-request-modal-body">
              <div className="job-request-modal-image-wrap">
                <img
                  src={selectedJob.image}
                  alt={selectedJob.title}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                />
                <div className="job-image-title">{selectedJob.title}</div>
              </div>

              <div className="job-request-modal-info">
                <div className="job-request-modal-price">{selectedJob.price}</div>
                <ul className="job-meta-list">
                  {selectedJob.details.map((detail, idx) => (
                    <li key={`${selectedJob.id}-modal-${idx}`}>
                      {detail.icon}
                      <span>{detail.text}</span>
                    </li>
                  ))}
                </ul>

                <h4>More Details</h4>
                <ul className="job-request-modal-extra-list">
                  {selectedJob.extraDetails.map((item, idx) => (
                    <li key={`${selectedJob.id}-extra-${idx}`}>{item}</li>
                  ))}
                </ul>

                <div className="job-actions">
                  <button type="button" className="accept-btn" onClick={() => openChat(selectedJob)}>
                    <CheckCircleOutlined /> Accept
                  </button>
                  <button type="button" className="decline-btn" aria-label="decline request">
                    <CloseOutlined />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {chatJob ? (
        <div className="job-request-modal-backdrop chat-backdrop" onClick={() => setChatJob(null)}>
          <div
            className="job-chat-modal"
            role="dialog"
            aria-modal="true"
            aria-label={getCustomerName(chatJob)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="job-chat-head">
              <div className="job-chat-customer">
                <div className="job-chat-avatar">{getCustomerInitials(getCustomerName(chatJob))}</div>
                <div>
                  <h3>{getCustomerName(chatJob)}</h3>
                  <p>{chatJob.title}</p>
                </div>
              </div>
              <button
                type="button"
                className="job-request-modal-close"
                aria-label="Close chat"
                onClick={() => setChatJob(null)}
              >
                <CloseOutlined />
              </button>
            </div>

            <div className="job-chat-body">
              {(chatMessages[chatJob.id] || []).map((message) => (
                <div
                  key={message.id}
                  className={`job-chat-bubble ${message.from === 'cleaner' ? 'mine' : 'theirs'}`}
                >
                  {message.image ? <img src={message.image} alt="Shared in chat" className="job-chat-image" /> : null}
                  {message.text ? <p>{message.text}</p> : null}
                  <span>{message.time}</span>
                </div>
              ))}
            </div>

            <div className="job-chat-compose">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelected}
                style={{ display: 'none' }}
              />
              <button type="button" className="chat-attach-btn" aria-label="Attach image" onClick={handlePickImage}>
                <PictureOutlined />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Type a message..."
              />
              <button type="button" className="accept-btn" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default JobRequestsPage;
