import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CloudUploadOutlined } from '@ant-design/icons';
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

const PaymentMethodPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const fileInputRef = useRef(null);

  const [loadingFinalization, setLoadingFinalization] = useState(false);
  const [finalization, setFinalization] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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
    </div>
  );
};

export default PaymentMethodPage;
