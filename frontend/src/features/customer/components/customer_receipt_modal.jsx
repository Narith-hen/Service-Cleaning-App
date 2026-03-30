import React, { useEffect, useMemo, useState } from 'react';
import {
  CloseOutlined,
  DownloadOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import api from '../../../services/api';
import logoSomaet from '../../../assets/Logo_somaet.png';
import '../../../styles/customer/receipt_modal.scss';
import {
  buildCleaningReceiptModel,
  downloadCleaningReceiptDocument,
  formatReceiptCompactDateLabel,
  formatReceiptCurrency,
  formatReceiptDateLabel
} from '../utils/receipt_document';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteFileUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${apiHost}${url.startsWith('/') ? '' : '/'}${url}`;
};

const isMeaningfulValue = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return false;

  return !['not available', 'n/a', 'na'].includes(normalized.toLowerCase());
};

const splitAddressLines = (value) => {
  if (!isMeaningfulValue(value)) return [];

  const segments = String(value)
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length <= 2) return segments;

  return [
    segments.slice(0, -1).join(', '),
    segments[segments.length - 1]
  ];
};

const CustomerReceiptModal = ({
  open = false,
  bookingId = '',
  initialBooking = null,
  onClose = null
}) => {
  const [booking, setBooking] = useState(initialBooking);
  const [finalization, setFinalization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const generatedAt = useMemo(
    () => new Date().toISOString(),
    [open, bookingId]
  );

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setLoading(true);
    setError('');
    setBooking(initialBooking || null);
    setFinalization(null);

    const loadReceiptDetails = async () => {
      const bookingRequest = bookingId
        ? api.get(`/bookings/${bookingId}`)
        : Promise.resolve(null);
      const finalizationRequest = bookingId
        ? api.get(`/payments/booking/${bookingId}/finalization`)
        : Promise.resolve(null);

      const [bookingResult, finalizationResult] = await Promise.allSettled([
        bookingRequest,
        finalizationRequest
      ]);

      if (cancelled) return;

      const bookingData = bookingResult.status === 'fulfilled'
        ? bookingResult.value?.data?.data || null
        : null;
      const finalizationData = finalizationResult.status === 'fulfilled'
        ? finalizationResult.value?.data?.data || null
        : null;

      setBooking(bookingData || initialBooking || null);
      setFinalization(finalizationData || null);

      if (!bookingData && !finalizationData && !initialBooking) {
        setError('Could not load the receipt details right now.');
      }

      setLoading(false);
    };

    void loadReceiptDetails();

    return () => {
      cancelled = true;
    };
  }, [open, bookingId, initialBooking]);

  const receiptModel = useMemo(() => buildCleaningReceiptModel({
    invoiceNumber: finalization?.qr_reference || '',
    finalization,
    booking,
    receiptImageUrl: toAbsoluteFileUrl(finalization?.receipt_image_url || ''),
    generatedAt
  }), [finalization, booking, generatedAt]);

  const companyName = useMemo(
    () => receiptModel.cleanerName || 'Somaet Cleaning',
    [receiptModel.cleanerName]
  );

  const companyLines = useMemo(() => [
    isMeaningfulValue(receiptModel.cleanerPhone) ? receiptModel.cleanerPhone : 'Professional cleaning services',
    isMeaningfulValue(receiptModel.cleanerEmail) ? receiptModel.cleanerEmail : 'support@somaet.com'
  ], [receiptModel.cleanerEmail, receiptModel.cleanerPhone]);

  const billedLines = useMemo(() => [
    ...splitAddressLines(receiptModel.serviceLocation),
    isMeaningfulValue(receiptModel.customerPhone) ? receiptModel.customerPhone : '',
    isMeaningfulValue(receiptModel.customerEmail) ? receiptModel.customerEmail : ''
  ].filter(Boolean), [
    receiptModel.customerEmail,
    receiptModel.customerPhone,
    receiptModel.serviceLocation
  ]);

  const serviceDetailLines = useMemo(() => [
    `Service: ${receiptModel.serviceName}`,
    `Cleaner: ${receiptModel.cleanerName}`,
    receiptModel.bookingDate ? `Service date: ${formatReceiptDateLabel(receiptModel.bookingDate)}` : '',
    isMeaningfulValue(receiptModel.bookingTime) ? `Time slot: ${receiptModel.bookingTime}` : '',
    isMeaningfulValue(receiptModel.noteText) && !receiptModel.noteText.startsWith('Thank you for choosing Somaet')
      ? `Notes: ${receiptModel.noteText}`
      : ''
  ].filter(Boolean), [
    receiptModel.bookingDate,
    receiptModel.bookingTime,
    receiptModel.cleanerName,
    receiptModel.noteText,
    receiptModel.serviceName
  ]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCleaningReceiptDocument({
        invoiceNumber: receiptModel.receiptNumber,
        finalization,
        booking,
        receiptImageUrl: receiptModel.receiptImageUrl,
        generatedAt
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="customer-receipt-backdrop"
      role="presentation"
      onClick={() => typeof onClose === 'function' && onClose()}
    >
      <section
        className="customer-receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-receipt-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="customer-receipt-close"
          onClick={() => typeof onClose === 'function' && onClose()}
          aria-label="Close receipt preview"
        >
          <CloseOutlined />
        </button>

        {loading ? (
          <div className="customer-receipt-loading">
            <LoadingOutlined />
            <span>Loading receipt...</span>
          </div>
        ) : error ? (
          <div className="customer-receipt-error">{error}</div>
        ) : (
          <>
            <div className="customer-receipt-sheet">
              <header className="customer-receipt-sheet-top">
                <div className="customer-receipt-company">
                  <p className="customer-receipt-company-name">{companyName}</p>
                  {companyLines.map((line) => (
                    <p className="customer-receipt-company-line" key={line}>{line}</p>
                  ))}
                </div>

                <div className="customer-receipt-logo-box">
                  <img src={logoSomaet} alt="Somaet logo" />
                </div>
              </header>

              <div className="customer-receipt-sheet-overview">
                <section className="customer-receipt-billed">
                  <p className="customer-receipt-section-label">Billed To</p>
                  <p className="customer-receipt-billed-line is-primary">{receiptModel.customerName}</p>
                  {billedLines.map((line) => (
                    <p className="customer-receipt-billed-line" key={line}>{line}</p>
                  ))}
                </section>

                <section className="customer-receipt-title-block">
                  <h2 id="customer-receipt-title">Cleaning<br />Receipt</h2>
                  <div className="customer-receipt-meta-grid">
                    <span>Receipt #</span>
                    <strong>{receiptModel.receiptNumber}</strong>
                    <span>Receipt date</span>
                    <strong>{formatReceiptCompactDateLabel(receiptModel.paymentDate)}</strong>
                    <span>Status</span>
                    <strong>{receiptModel.receiptStatusLabel}</strong>
                  </div>
                </section>
              </div>

              <section className="customer-receipt-table-shell">
                <div className="customer-receipt-table-head">
                  <span>QTY Description</span>
                  <span>Qty</span>
                  <span>Unit Price</span>
                  <span>Amount</span>
                </div>

                <div className="customer-receipt-table-body">
                  {receiptModel.lineItems.map((item, index) => (
                    <div className="customer-receipt-line-item" key={`${item.title}-${index}`}>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </div>
                      <span>{item.qty}</span>
                      <span>{formatReceiptCurrency(item.unitPrice)}</span>
                      <span>{formatReceiptCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="customer-receipt-footer">
                <section className="customer-receipt-service-details">
                  <p className="customer-receipt-detail-label">Service Details</p>
                  {serviceDetailLines.map((line) => (
                    <p className="customer-receipt-detail-copy" key={line}>{line}</p>
                  ))}
                </section>

                <aside className="customer-receipt-totals">
                  <div className="customer-receipt-total-row">
                    <span>Subtotal</span>
                    <strong>{formatReceiptCurrency(receiptModel.subtotal)}</strong>
                  </div>
                  <div className="customer-receipt-total-row">
                    <span>Service Tax</span>
                    <strong>{formatReceiptCurrency(receiptModel.serviceTax)}</strong>
                  </div>
                  {Boolean(receiptModel.loyaltyDiscount) && (
                    <div className="customer-receipt-total-row is-discount">
                      <span>Loyalty Discount</span>
                      <strong>{formatReceiptCurrency(-Math.abs(receiptModel.loyaltyDiscount))}</strong>
                    </div>
                  )}
                  <div className="customer-receipt-total-row is-total">
                    <span>Total (USD)</span>
                    <strong>{formatReceiptCurrency(receiptModel.totalPaid)}</strong>
                  </div>

                  <button
                    type="button"
                    className="customer-receipt-download"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    <DownloadOutlined />
                    {downloading ? 'Preparing PDF...' : 'Download PDF'}
                  </button>
                </aside>
              </div>
            </div>

          </>
        )}
      </section>
    </div>
  );
};

export default CustomerReceiptModal;
