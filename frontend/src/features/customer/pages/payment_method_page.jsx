import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircleOutlined, CloseOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import '../../../styles/customer/payment_method.scss';
import localQrImage from '../../../images/QR.png';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const formatUsd = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toFixed(2)}`;
};

const formatPaymentDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const toAbsoluteFileUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${apiHost}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getInitials = (name) => {
  const parts = String(name || '')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return 'CL';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const normalizeReviewBooking = (booking, fallbackBookingId, fallbackServiceName) => ({
  bookingId: String(booking?.booking_id || booking?.id || fallbackBookingId || ''),
  cleanerId: booking?.cleaner_id || booking?.cleaner?.user_id || null,
  cleanerName:
    booking?.cleaner_full_name ||
    booking?.cleaner_username ||
    booking?.cleaner_display_name ||
    booking?.cleaner_name ||
    booking?.cleaner?.username ||
    [booking?.cleaner_first_name, booking?.cleaner_last_name].filter(Boolean).join(' ').trim() ||
    'Assigned cleaner',
  cleanerAvatar: toAbsoluteFileUrl(booking?.cleaner_avatar || booking?.cleaner?.avatar || ''),
  serviceName:
    booking?.service_name ||
    booking?.service?.name ||
    fallbackServiceName ||
    'Cleaning Service',
  reviewId: booking?.review_id ? Number(booking.review_id) : null,
  reviewRating: Number(booking?.rating || 0),
  reviewComment: booking?.review_comment || ''
});

const PaymentMethodPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const fileInputRef = useRef(null);
  const ratingPopupTimeoutRef = useRef(null);

  const [loadingFinalization, setLoadingFinalization] = useState(false);
  const [finalization, setFinalization] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(null);
  const hasLoadedFinalizationRef = useRef(false);

  const amountDue = Number(finalization?.amount_due || 186.5);
  const paymentStatus = String(finalization?.payment_status || '').toLowerCase();
  const isReceiptSubmitted = paymentStatus === 'receipt_submitted';
  const isPaymentConfirmed = paymentStatus === 'completed' || paymentStatus === 'paid';
  const canReviewService = isReceiptSubmitted || isPaymentConfirmed;
  const canSubmitReceipt = !isReceiptSubmitted && !isPaymentConfirmed;
  const isPdfReceipt = receiptFile?.type === 'application/pdf';

  const invoiceNumber = useMemo(() => {
    if (finalization?.qr_reference) return finalization.qr_reference;
    if (bookingId) return `INV-${String(bookingId).padStart(4, '0')}`;
    return 'INV-2023-0892';
  }, [bookingId, finalization?.qr_reference]);

  const summaryRows = useMemo(() => {
    if (!bookingId) {
      return [
        { label: 'Deep Home Cleaning', value: amountDue }
      ];
    }

    return [
      { label: finalization?.service_name || 'Cleaning Service', value: amountDue }
    ];
  }, [bookingId, amountDue, finalization?.service_name]);

  const currentDateLabel = useMemo(
    () => formatPaymentDate(new Date().toISOString()),
    []
  );

  const paymentDateLabel = useMemo(() => {
    if (!bookingId) return currentDateLabel;
    return formatPaymentDate(finalization?.receipt_uploaded_at) || currentDateLabel;
  }, [bookingId, currentDateLabel, finalization?.receipt_uploaded_at]);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;

    const loadFinalization = async () => {
      if (!cancelled && !hasLoadedFinalizationRef.current) {
        setLoadingFinalization(true);
      }
      try {
        const response = await api.get(`/payments/booking/${bookingId}/finalization`);
        if (!cancelled) {
          const payload = response?.data?.data || null;
          setFinalization(payload);
          hasLoadedFinalizationRef.current = true;
          if (payload?.payment_status === 'completed' || payload?.payment_status === 'paid') {
            setStatusText('');
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStatusText(error?.response?.data?.message || 'Could not load payment details.');
        }
      } finally {
        if (!cancelled) {
          setLoadingFinalization(false);
        }
      }
    };

    loadFinalization();

    const intervalId = window.setInterval(() => {
      loadFinalization();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [bookingId]);

  useEffect(() => {
    if (!receiptFile || !String(receiptFile.type || '').startsWith('image/')) {
      setReceiptPreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(receiptFile);
    setReceiptPreviewUrl(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [receiptFile]);

  useEffect(() => {
    return () => {
      if (ratingPopupTimeoutRef.current) {
        window.clearTimeout(ratingPopupTimeoutRef.current);
      }
    };
  }, []);

  const loadBookingForReview = async (fallbackServiceName) => {
    if (!bookingId) return;

    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const booking = response?.data?.data || null;
      const normalized = normalizeReviewBooking(booking, bookingId, fallbackServiceName);
      setReviewBooking(normalized);
      setRating(normalized.reviewId ? normalized.reviewRating : 0);
      setComment(normalized.reviewId ? normalized.reviewComment : '');
    } catch {
      const fallback = normalizeReviewBooking(null, bookingId, fallbackServiceName);
      setReviewBooking(fallback);
      setRating(0);
      setComment('');
    }
  };

  const handleOpenFileDialog = () => {
    if (isPaymentConfirmed) return;
    fileInputRef.current?.click();
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
  };

  const handleStarSelect = (value) => {
    setRating((current) => (current === value ? Math.max(0, value - 1) : value));
    setReviewFeedback(null);
  };

  const handleSubmitReceipt = async () => {
    if (!bookingId) {
      setStatusText('Demo mode: open this page with bookingId to submit a real receipt.');
      return;
    }
    if (!canSubmitReceipt) return;
    if (!receiptFile) {
      setStatusText('Please select your payment receipt first.');
      return;
    }

    setUploadingReceipt(true);
    setStatusText('Uploading receipt...');
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      const response = await api.post(`/payments/booking/${bookingId}/submit-receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const payload = response?.data?.data || null;
      setFinalization(payload);
      setStatusText('');
      setReceiptFile(null);
      setReviewFeedback(null);
      void loadBookingForReview(payload?.service_name);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (ratingPopupTimeoutRef.current) {
        window.clearTimeout(ratingPopupTimeoutRef.current);
      }
      ratingPopupTimeoutRef.current = window.setTimeout(() => {
        setStatusText('');
        setShowRatingModal(true);
      }, 5000);
    } catch (error) {
      setStatusText(error?.response?.data?.message || 'Failed to submit receipt.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!bookingId) {
      setReviewFeedback({ type: 'error', message: 'Missing booking reference.' });
      return;
    }

    if (reviewBooking?.reviewId) {
      setReviewFeedback({ type: 'muted', message: 'You already rated this cleaner.' });
      return;
    }

    if (!rating) {
      setReviewFeedback({ type: 'error', message: 'Please select a star rating first.' });
      return;
    }

    setSubmittingReview(true);
    setReviewFeedback(null);

    try {
      await api.post('/reviews', {
        booking_id: Number(bookingId),
        rating,
        comment: comment.trim() || undefined,
        command: comment.trim() || undefined,
        cleaner_id: reviewBooking?.cleanerId ? Number(reviewBooking.cleanerId) : undefined
      });

      setReviewBooking((current) => (
        current
          ? {
              ...current,
              reviewId: -1,
              reviewRating: rating,
              reviewComment: comment.trim()
            }
          : current
      ));
      setReviewFeedback({ type: 'success', message: 'Thanks for rating your cleaner.' });
      window.setTimeout(() => {
        setShowRatingModal(false);
      }, 1200);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.map((item) => item.msg).join(', ')
          : null) ||
        'Could not submit your rating. Please try again.';

      setReviewFeedback({ type: 'error', message });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="final-payment-page">
      <div className="final-payment-card">
        <header className="final-payment-header">
          <h1>Final Payment</h1>
          <p>Invoice # {invoiceNumber}</p>
        </header>

        {loadingFinalization ? (
          <div className="final-payment-loading">Loading payment details...</div>
        ) : (
          <>
            <section className="final-payment-grid">
              <article className="payment-summary-box">
                <h3>Service Summary</h3>
                <div className="summary-list">
                  {summaryRows.map((row, index) => (
                    <div className="summary-row" key={`${row.label}-${index}`}>
                      <span>{row.label}</span>
                      <strong>{formatUsd(row.value)}</strong>
                    </div>
                  ))}
                </div>
                {paymentDateLabel && (
                  <div className="payment-date-row">
                    <span>Payment Date</span>
                    <strong>{paymentDateLabel}</strong>
                  </div>
                )}
                <div className="total-row">
                  <span>Total Due</span>
                  <strong>{formatUsd(amountDue)}</strong>
                </div>
              </article>

              <article className="payment-qr-box">
                <h3>ABA&apos; PAY</h3>
                <div className="qr-frame">
                  <img src={localQrImage} alt="ABA QR Payment" />
                </div>
                <p>Scan QR with ABA Mobile</p>
                <p>or any Banking App</p>
                <button type="button" className="aba-chip">
                  ABA BANK
                </button>
              </article>
            </section>

            <section className="receipt-upload-section">
              <h3>Upload Payment Receipt</h3>
              <button
                type="button"
                className={`receipt-dropzone ${isPaymentConfirmed ? 'disabled' : ''} ${receiptPreviewUrl ? 'has-preview' : ''}`}
                onClick={handleOpenFileDialog}
                disabled={isPaymentConfirmed}
              >
                {receiptPreviewUrl ? (
                  <img className="receipt-preview-image" src={receiptPreviewUrl} alt="Receipt preview" />
                ) : (
                  <>
                    <span className="upload-icon"><CloudUploadOutlined /></span>
                    <strong>Click to upload receipt</strong>
                    <small>PNG, JPG, PDF</small>
                    {isPdfReceipt && <span className="receipt-pdf-tag">PDF selected</span>}
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                className="hidden-receipt-input"
                onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                disabled={isPaymentConfirmed}
              />

              {receiptFile && !receiptPreviewUrl && (
                <p className="receipt-selected">Selected file: {receiptFile.name}</p>
              )}

              {finalization?.receipt_image_url && (
                <a
                  className="receipt-link"
                  href={toAbsoluteFileUrl(finalization.receipt_image_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View uploaded receipt
                </a>
              )}
            </section>

            <button
              type="button"
              className="submit-payment-button"
              onClick={handleSubmitReceipt}
              disabled={!canSubmitReceipt || uploadingReceipt}
            >
              {uploadingReceipt ? 'Submitting...' : isPaymentConfirmed ? 'Payment Confirmed' : 'Submit'}
            </button>

            <button
              type="button"
              className="back-history-button"
              onClick={() => navigate('/customer/history')}
            >
              Back To History
            </button>

            {bookingId && canReviewService && (
              <button
                type="button"
                className="back-history-button"
                onClick={() => navigate(`/customer/write-review/${bookingId}`, {
                  state: {
                    from: `/customer/payment-methods?bookingId=${bookingId}`
                  }
                })}
              >
                Review Service
              </button>
            )}

            {statusText && <p className="payment-status-text">{statusText}</p>}
          </>
        )}
      </div>

      {/* {showRatingModal && (
        <div className="payment-success-modal-backdrop" role="presentation">
          <section
            className="payment-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
          >
            <button
              type="button"
              className="payment-success-close"
              onClick={handleCloseRatingModal}
              aria-label="Close rating dialog"
            >
              <CloseOutlined />
            </button>

            <div className="payment-success-badge">
              <CheckCircleOutlined />
            </div>

            <p className="payment-success-kicker">Rate Your Cleaner</p>
            <h2 id="payment-success-title">
              Share your experience
            </h2>
            <p className="payment-success-copy">
              {reviewBooking?.serviceName || finalization?.service_name || 'Cleaning service'} is complete.
              Your feedback helps us improve the service quality.
            </p>

            <div className="payment-success-cleaner">
              <div className="payment-success-avatar">
                {reviewBooking?.cleanerAvatar ? (
                  <img src={reviewBooking.cleanerAvatar} alt={reviewBooking.cleanerName || 'Cleaner'} />
                ) : (
                  <span>{getInitials(reviewBooking?.cleanerName)}</span>
                )}
              </div>

              <div>
                <strong>{reviewBooking?.cleanerName || 'Assigned cleaner'}</strong>
                <span>Professional cleaner</span>
              </div>
            </div>

            {!reviewBooking?.reviewId ? (
              <>
                <div className="payment-success-stars" role="radiogroup" aria-label="Rate your cleaner">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`payment-star-button${value <= rating ? ' is-active' : ''}`}
                      onClick={() => handleStarSelect(value)}
                      aria-label={`${value} star${value > 1 ? 's' : ''}`}
                    >
                      {value <= rating ? <AiFillStar size={30} /> : <AiOutlineStar size={30} />}
                    </button>
                  ))}
                </div>

                {reviewFeedback && (
                  <p className={`payment-review-feedback is-${reviewFeedback.type}`}>
                    {reviewFeedback.message}
                  </p>
                )}

                <textarea
                  className="payment-success-textarea"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tell us about your cleaner..."
                  maxLength={500}
                />

                <div className="payment-success-actions">
                  <button type="button" className="payment-review-skip" onClick={handleCloseRatingModal}>
                    Maybe later
                  </button>
                  <button
                    type="button"
                    className="payment-review-submit"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="payment-review-feedback is-success">
                  You already rated this cleaner. Thank you for your feedback.
                </p>
                <div className="payment-success-actions">
                  <button type="button" className="payment-review-submit" onClick={handleCloseRatingModal}>
                    Close
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )} */}
    </div>
  );
};

export default PaymentMethodPage;
