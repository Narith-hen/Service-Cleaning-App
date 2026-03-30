import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CloudUploadOutlined } from '@ant-design/icons';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { FiX } from 'react-icons/fi';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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

const normalizeReviewBooking = (booking, bookingId) => ({
  id: String(bookingId || booking?.booking_id || booking?.id || ''),
  serviceName:
    booking?.serviceName ||
    booking?.service_name ||
    booking?.service?.name ||
    'Cleaning Service',
  cleanerName:
    booking?.cleanerName ||
    booking?.cleaner_display_name ||
    booking?.cleaner_name ||
    booking?.cleaner_company ||
    booking?.cleaner_username ||
    'Assigned cleaner',
  cleanerAvatar: toAbsoluteFileUrl(
    booking?.cleanerAvatar ||
    booking?.cleaner_avatar ||
    booking?.cleaner?.avatar ||
    ''
  ),
  cleanerId: booking?.cleanerId || booking?.cleaner_id || booking?.cleaner?.user_id || null,
  bookingDate: booking?.bookingDate || booking?.booking_date || '',
  reviewId: booking?.review_id ? Number(booking.review_id) : null,
  reviewRating: Number(booking?.reviewRating || booking?.rating) || 0,
  reviewComment: booking?.reviewComment || booking?.review_comment || ''
});

const PaymentMethodPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const fileInputRef = useRef(null);
  const reviewAutoPromptedRef = useRef(false);
  const isCleanerPortal = location.pathname.startsWith('/cleaner/');

  const [loadingFinalization, setLoadingFinalization] = useState(false);
  const [finalization, setFinalization] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [loadingReviewBooking, setLoadingReviewBooking] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const amountDue = Number(finalization?.amount_due || 186.5);
  const paymentStatus = String(finalization?.payment_status || '').toLowerCase();
  const isReceiptSubmitted = paymentStatus === 'receipt_submitted';
  const isPaymentConfirmed = paymentStatus === 'completed' || paymentStatus === 'paid';
  const isWaitingForReceipt =
    paymentStatus === 'awaiting_receipt'
    || paymentStatus === 'payment_required'
    || (!paymentStatus && String(finalization?.booking_status || '').toLowerCase() === 'payment_required');
  const canReviewService = !isCleanerPortal && (isReceiptSubmitted || isPaymentConfirmed);
  const canSubmitReceipt = !isCleanerPortal && !isReceiptSubmitted && !isPaymentConfirmed;
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

  const hasSubmittedReview = Boolean(reviewBooking?.reviewId);
  const reviewScoreLabel = reviewRating ? `${reviewRating.toFixed(1)} / 5` : '0.0 / 5';
  const paymentSummaryText = useMemo(() => {
    if (statusText) return statusText;
    if (isCleanerPortal) {
      if (isPaymentConfirmed) {
        return 'Payment confirmed successfully for this booking.';
      }
      if (isReceiptSubmitted) {
        return 'Customer submitted a receipt. Payment is waiting for confirmation.';
      }
      if (isWaitingForReceipt) {
        return 'Waiting for the customer to upload a payment receipt.';
      }
      return '';
    }
    if (hasSubmittedReview) {
      const ratedValue = Number(reviewBooking?.reviewRating || 0);
      return Number.isFinite(ratedValue) && ratedValue > 0
        ? `Payment confirmed and your ${ratedValue.toFixed(1)}/5 review is saved.`
        : 'Payment confirmed and your review is saved.';
    }
    if (isPaymentConfirmed) {
      return 'Payment confirmed successfully. Please rate your completed service.';
    }
    if (isReceiptSubmitted) {
      return 'Receipt submitted successfully. Waiting for cleaner confirmation.';
    }
    return '';
  }, [
    statusText,
    hasSubmittedReview,
    reviewBooking?.reviewRating,
    isPaymentConfirmed,
    isReceiptSubmitted,
    isCleanerPortal,
    isWaitingForReceipt
  ]);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;

    const loadFinalization = async () => {
      setLoadingFinalization(true);
      try {
        const response = await api.get(`/payments/booking/${bookingId}/finalization`);
        if (!cancelled) {
          const payload = response?.data?.data || null;
          setFinalization(payload);
          setStatusText('');
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
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useEffect(() => {
    reviewAutoPromptedRef.current = false;
    setReviewModalOpen(false);
    setReviewBooking(null);
    setReviewRating(0);
    setReviewComment('');
    setReviewFeedback(null);
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId || isCleanerPortal) return;

    let cancelled = false;

    const loadReviewBooking = async () => {
      setLoadingReviewBooking(true);
      try {
        const response = await api.get(`/bookings/history/${bookingId}`);
        if (cancelled) return;

        const booking = normalizeReviewBooking(response?.data?.data || null, bookingId);
        setReviewBooking(booking);
        setReviewRating(booking.reviewRating || 0);
        setReviewComment(booking.reviewComment || '');
      } catch {
        if (!cancelled) {
          setReviewBooking(normalizeReviewBooking(null, bookingId));
        }
      } finally {
        if (!cancelled) {
          setLoadingReviewBooking(false);
        }
      }
    };

    loadReviewBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId, isCleanerPortal]);

  useEffect(() => {
    if (isCleanerPortal || !bookingId || !isPaymentConfirmed || !reviewBooking || hasSubmittedReview || reviewAutoPromptedRef.current) {
      return;
    }

    reviewAutoPromptedRef.current = true;
    setReviewFeedback(null);
    setReviewModalOpen(true);
  }, [bookingId, isPaymentConfirmed, reviewBooking, hasSubmittedReview, isCleanerPortal]);

  const primaryButtonLabel = isCleanerPortal
    ? (isPaymentConfirmed ? 'Payment Confirmed' : 'Payment Pending')
    : (uploadingReceipt ? 'Submitting...' : isPaymentConfirmed ? 'Payment Confirmed' : 'Submit');

  const primaryButtonDisabled = isCleanerPortal
    ? true
    : (!canSubmitReceipt || uploadingReceipt);

  const backTarget = isCleanerPortal
    ? (bookingId ? `/cleaner/my-jobs?bookingId=${encodeURIComponent(String(bookingId))}` : '/cleaner/my-jobs')
    : '/customer/history';

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

  const handleOpenFileDialog = () => {
    if (isPaymentConfirmed) return;
    fileInputRef.current?.click();
  };

  const handleOpenReviewModal = () => {
    if (!canReviewService || hasSubmittedReview) return;
    reviewAutoPromptedRef.current = true;
    setReviewFeedback(null);
    setReviewRating(reviewBooking?.reviewRating || 0);
    setReviewComment(reviewBooking?.reviewComment || '');
    setReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    if (submittingReview) return;
    setReviewFeedback(null);
    setReviewRating(reviewBooking?.reviewRating || 0);
    setReviewComment(reviewBooking?.reviewComment || '');
    setReviewModalOpen(false);
  };

  const handleSelectReviewStar = (value) => {
    setReviewRating((current) => (current === value ? Math.max(0, value - 1) : value));
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
      setStatusText('Receipt submitted successfully. Waiting for cleaner confirmation.');
      setReceiptFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setStatusText(error?.response?.data?.message || 'Failed to submit receipt.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!bookingId) {
      setReviewFeedback({
        type: 'error',
        message: 'Missing booking reference. Please refresh and try again.'
      });
      return;
    }

    if (!reviewRating) {
      setReviewFeedback({
        type: 'error',
        message: 'Please select a star rating before you submit.'
      });
      return;
    }

    setSubmittingReview(true);
    setReviewFeedback(null);

    try {
      const response = await api.post('/reviews', {
        booking_id: Number(bookingId),
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        command: reviewComment.trim() || undefined,
        cleaner_id: reviewBooking?.cleanerId ? Number(reviewBooking.cleanerId) : undefined
      });

      const createdReview = response?.data?.data || {};
      setReviewBooking((current) => ({
        ...(current || normalizeReviewBooking(null, bookingId)),
        reviewId: Number(createdReview?.review_id || createdReview?.id || current?.reviewId || 1),
        reviewRating,
        reviewComment: reviewComment.trim()
      }));
      setStatusText('Payment confirmed successfully. Thank you for rating your cleaner.');
      setReviewFeedback({
        type: 'success',
        message: 'Your rating was submitted successfully.'
      });

      window.setTimeout(() => {
        setReviewModalOpen(false);
        setReviewFeedback(null);
      }, 900);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.map((item) => item.msg).join(', ')
          : null) ||
        'We could not submit your rating. Please try again.';

      setReviewFeedback({
        type: 'error',
        message
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="final-payment-page">
      <div className="final-payment-card">
        <header className="final-payment-header">
          <h1>{isCleanerPortal ? 'Payment Details' : 'Final Payment'}</h1>
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
              <h3>{isCleanerPortal ? 'Payment Receipt' : 'Upload Payment Receipt'}</h3>

              {!isCleanerPortal && (
                <>
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
                </>
              )}

              {isCleanerPortal && !finalization?.receipt_image_url && (
                <p className="receipt-selected">No receipt image available for this booking.</p>
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

            {paymentSummaryText && (
              <div className={`payment-status-panel ${isPaymentConfirmed ? 'is-success' : 'is-pending'}`}>
                <strong>{isPaymentConfirmed ? 'Payment Success' : 'Payment Update'}</strong>
                <p>{paymentSummaryText}</p>
              </div>
            )}

            <button
              type="button"
              className="submit-payment-button"
              onClick={isCleanerPortal ? undefined : handleSubmitReceipt}
              disabled={primaryButtonDisabled}
            >
              {primaryButtonLabel}
            </button>

            <button
              type="button"
              className="back-history-button"
              onClick={() => navigate(backTarget)}
            >
              {isCleanerPortal ? 'Back To My Jobs' : 'Back To History'}
            </button>

            {bookingId && canReviewService && !hasSubmittedReview && (
              <button
                type="button"
                className="back-history-button"
                onClick={handleOpenReviewModal}
              >
                Rate Service
              </button>
            )}

            {hasSubmittedReview && (
              <div className="payment-review-complete">
                <strong>Review Submitted</strong>
                <span>
                  {Number(reviewBooking?.reviewRating || 0).toFixed(1)}
                  /5 rating saved for this booking.
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {!isCleanerPortal && reviewModalOpen && (
        <div className="payment-rating-overlay" role="presentation">
          <section
            className="payment-rating-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-rating-title"
          >
            <button
              type="button"
              className="payment-rating-close"
              onClick={handleCloseReviewModal}
              aria-label="Close rating popup"
            >
              <FiX size={20} />
            </button>

            <div className="payment-rating-avatar">
              {reviewBooking?.cleanerAvatar ? (
                <img src={reviewBooking.cleanerAvatar} alt={reviewBooking.cleanerName} />
              ) : (
                <span>{getInitials(reviewBooking?.cleanerName)}</span>
              )}
            </div>

            <div className="payment-rating-eyebrow">Rate Your Cleaner</div>
            <h2 id="payment-rating-title">{reviewBooking?.cleanerName || 'Assigned cleaner'}</h2>
            <p className="payment-rating-service">
              {reviewBooking?.serviceName || finalization?.service_name || 'Cleaning Service'}
            </p>
            <p className="payment-rating-date">
              {formatPaymentDate(reviewBooking?.bookingDate || finalization?.cleaner_confirmed_at || finalization?.receipt_uploaded_at) || 'Completed service'}
            </p>

            <div className="payment-rating-stars" role="radiogroup" aria-label="Service rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`payment-rating-star${value <= reviewRating ? ' is-active' : ''}`}
                  onClick={() => handleSelectReviewStar(value)}
                  aria-checked={reviewRating === value}
                  role="radio"
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                >
                  {value <= reviewRating ? <AiFillStar size={32} /> : <AiOutlineStar size={32} />}
                </button>
              ))}
            </div>

            <div className="payment-rating-score">{reviewScoreLabel}</div>

            {reviewFeedback && (
              <div className={`payment-rating-feedback ${reviewFeedback.type}`}>
                {reviewFeedback.message}
              </div>
            )}

            <label className="payment-rating-label" htmlFor="payment-rating-comment">
              Feedback
            </label>
            <textarea
              id="payment-rating-comment"
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Tell us how the service went..."
              maxLength={1000}
              disabled={submittingReview}
            />

            <div className="payment-rating-meta">
              {loadingReviewBooking ? 'Loading booking details...' : `${reviewComment.length}/1000 characters`}
            </div>

            <div className="payment-rating-actions">
              <button
                type="button"
                className="payment-rating-secondary"
                onClick={handleCloseReviewModal}
                disabled={submittingReview}
              >
                Later
              </button>
              <button
                type="button"
                className="payment-rating-primary"
                onClick={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodPage;
