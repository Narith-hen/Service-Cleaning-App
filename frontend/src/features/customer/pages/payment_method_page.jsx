import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircleOutlined, CloseOutlined, CloudUploadOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import '../../../styles/customer/payment_method.scss';
import localQrImage from '../../../images/QR.png';
import CustomerRatingModal from '../components/customer_rating_modal';
import { downloadCleaningReceiptDocument } from '../utils/receipt_document';

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

export const CustomerPaymentExperience = ({
  bookingId: bookingIdProp = '',
  mode = 'page',
  onClose = null,
  onPaymentUpdated = null,
  onReviewSubmitted = null,
  backLabel = 'Back To History'
}) => {
  const navigate = useNavigate();
  const bookingId = bookingIdProp ? String(bookingIdProp) : null;
  const isModal = mode === 'modal';
  const fileInputRef = useRef(null);
  const ratingTransitionTimeoutRef = useRef(null);

  const [loadingFinalization, setLoadingFinalization] = useState(false);
  const [finalization, setFinalization] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [downloadingReceiptDocument, setDownloadingReceiptDocument] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const hasLoadedFinalizationRef = useRef(false);

  const amountDue = Number(finalization?.amount_due || 186.5);
  const paymentStatus = String(finalization?.payment_status || '').toLowerCase();
  const isReceiptSubmitted = paymentStatus === 'receipt_submitted';
  const isPaymentConfirmed = paymentStatus === 'completed' || paymentStatus === 'paid';
  const canSubmitReceipt = !isReceiptSubmitted && !isPaymentConfirmed;
  const canDownloadReceiptDocument = Boolean(
    bookingId && (isReceiptSubmitted || isPaymentConfirmed || finalization?.receipt_uploaded_at)
  );
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

  const initialReviewBooking = useMemo(() => {
    if (!bookingId) return null;

    return {
      booking_id: bookingId,
      service_name: finalization?.service_name || 'Cleaning Service'
    };
  }, [bookingId, finalization?.service_name]);

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

  useEffect(() => () => {
    if (ratingTransitionTimeoutRef.current) {
      window.clearTimeout(ratingTransitionTimeoutRef.current);
    }
  }, []);

  const handleOpenFileDialog = () => {
    if (isPaymentConfirmed) return;
    fileInputRef.current?.click();
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
  };

  const handleOpenRatingModal = () => {
    if (ratingTransitionTimeoutRef.current) {
      window.clearTimeout(ratingTransitionTimeoutRef.current);
      ratingTransitionTimeoutRef.current = null;
    }
    setShowCongratsModal(false);
    setShowRatingModal(true);
  };

  const handleCloseCongratsModal = () => {
    if (ratingTransitionTimeoutRef.current) {
      window.clearTimeout(ratingTransitionTimeoutRef.current);
      ratingTransitionTimeoutRef.current = null;
    }
    setShowCongratsModal(false);
  };

  const handleBack = () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }

    navigate('/customer/history');
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
      if (typeof onPaymentUpdated === 'function') {
        onPaymentUpdated({
          bookingId: String(bookingId),
          finalization: payload
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowCongratsModal(true);
      if (ratingTransitionTimeoutRef.current) {
        window.clearTimeout(ratingTransitionTimeoutRef.current);
      }
      ratingTransitionTimeoutRef.current = window.setTimeout(() => {
        ratingTransitionTimeoutRef.current = null;
        setShowCongratsModal(false);
        setShowRatingModal(true);
      }, 1800);
    } catch (error) {
      setStatusText(error?.response?.data?.message || 'Failed to submit receipt.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleDownloadReceiptDocument = async () => {
    if (!bookingId || !canDownloadReceiptDocument) return;

    setDownloadingReceiptDocument(true);
    try {
      let booking = null;

      try {
        const response = await api.get(`/bookings/${bookingId}`);
        booking = response?.data?.data || null;
      } catch {
        booking = null;
      }

      await downloadCleaningReceiptDocument({
        invoiceNumber,
        finalization,
        booking,
        receiptImageUrl: toAbsoluteFileUrl(finalization?.receipt_image_url || ''),
        generatedAt: new Date().toISOString()
      });
      setStatusText('');
    } catch (error) {
      setStatusText(error?.message || 'Could not download the receipt PDF.');
    } finally {
      setDownloadingReceiptDocument(false);
    }
  };

  return (
    <div className={`final-payment-page${isModal ? ' is-modal' : ''}`}>
      <div className="final-payment-card">
        {isModal && (
          <button
            type="button"
            className="final-payment-close"
            onClick={handleBack}
            aria-label="Close payment dialog"
          >
            <CloseOutlined />
          </button>
        )}

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

              {(finalization?.receipt_image_url || canDownloadReceiptDocument) && (
                <div className="receipt-actions-row">
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
                  {canDownloadReceiptDocument && (
                    <button
                      type="button"
                      className="receipt-link-button"
                      onClick={handleDownloadReceiptDocument}
                      disabled={downloadingReceiptDocument}
                    >
                      <DownloadOutlined />
                      {downloadingReceiptDocument ? 'Preparing PDF...' : 'Download receipt PDF'}
                    </button>
                  )}
                </div>
              )}
            </section>

            {canDownloadReceiptDocument && (
              <section className="receipt-document-panel">
                <div className="receipt-document-copy">
                  <span className="receipt-document-icon"><FileTextOutlined /></span>
                  <div>
                    <strong>Cleaning Service Receipt</strong>
                    <p>Download your service receipt as a PDF file for record keeping.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="receipt-document-button"
                  onClick={handleDownloadReceiptDocument}
                  disabled={downloadingReceiptDocument}
                >
                  <DownloadOutlined />
                  {downloadingReceiptDocument ? 'Preparing PDF...' : 'Download PDF Receipt'}
                </button>
              </section>
            )}

            <div className="payment-action-row">
              <button
                type="button"
                className="back-history-button"
                onClick={handleBack}
              >
                {isModal ? 'Back' : backLabel}
              </button>

              <button
                type="button"
                className="submit-payment-button"
                onClick={handleSubmitReceipt}
                disabled={!canSubmitReceipt || uploadingReceipt}
              >
                {uploadingReceipt ? 'Submitting...' : isPaymentConfirmed ? 'Payment Confirmed' : 'Submit'}
              </button>
            </div>

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

      {showCongratsModal && (
        <div className="payment-success-modal-backdrop" role="presentation">
          <section
            className="payment-success-modal payment-success-modal--celebration"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-congrats-title"
          >
            <button
              type="button"
              className="payment-success-close"
              onClick={handleCloseCongratsModal}
              aria-label="Close congratulations dialog"
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

            <p className="payment-success-kicker">Payment Submitted</p>
            <h2 id="payment-congrats-title">Congratulations!</h2>
            <p className="payment-success-copy">
              Your payment receipt for {finalization?.service_name || 'this cleaning service'} was submitted
              successfully.
            </p>
            <p className="payment-congrats-note">
              Opening the cleaner rating popup next so you can share your experience.
            </p>

            <div className="payment-success-actions payment-success-actions--center">
              <button
                type="button"
                className="payment-review-submit"
                onClick={handleOpenRatingModal}
              >
                Rate Cleaner
              </button>
            </div>
          </section>
        </div>
      )}

      <CustomerRatingModal
        open={showRatingModal}
        bookingId={bookingId}
        initialBooking={initialReviewBooking}
        fallbackServiceName={finalization?.service_name || 'Cleaning Service'}
        onClose={handleCloseRatingModal}
        onSubmitted={onReviewSubmitted}
      />
    </div>
  );
};

const PaymentMethodPage = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <CustomerPaymentExperience
      bookingId={bookingId}
      mode="page"
    />
  );
};

export default PaymentMethodPage;
