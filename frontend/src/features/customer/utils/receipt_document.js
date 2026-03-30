import html2canvas from 'html2canvas';
import logoSomaet from '../../../assets/Logo_somaet.png';

const NOT_AVAILABLE_LABEL = 'Not available';
const PDF_PAGE_WIDTH = 595.28;
const PDF_PAGE_HEIGHT = 841.89;
const PDF_MARGIN = 24;
const RECEIPT_RENDER_WIDTH = 794;

const receiptPdfStyles = `
  .receipt-pdf-root {
    font-family: Arial, Helvetica, sans-serif;
    color: #1f2937;
    background: #ffffff;
  }
  .receipt-pdf-page {
    width: 100%;
    box-sizing: border-box;
    padding: 28px 34px 34px;
    background: #ffffff;
  }
  .receipt-pdf-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }
  .receipt-pdf-company {
    max-width: 52%;
  }
  .receipt-pdf-company-name {
    margin: 0;
    color: #111827;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.15;
  }
  .receipt-pdf-company-line {
    margin: 6px 0 0;
    color: #4b5563;
    font-size: 14px;
    line-height: 1.45;
  }
  .receipt-pdf-logo {
    width: 196px;
    min-height: 82px;
    box-sizing: border-box;
    border: 1.5px solid #cfd6df;
    border-radius: 8px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px;
  }
  .receipt-pdf-logo img {
    width: 100%;
    max-width: 138px;
    height: auto;
    object-fit: contain;
  }
  .receipt-pdf-overview {
    margin-top: 34px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 32px;
  }
  .receipt-pdf-billed {
    max-width: 52%;
  }
  .receipt-pdf-section-label {
    margin: 0 0 8px;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
  }
  .receipt-pdf-billed-line {
    margin: 0 0 6px;
    color: #4b5563;
    font-size: 14px;
    line-height: 1.5;
  }
  .receipt-pdf-billed-line.is-primary {
    color: #111827;
    font-size: 17px;
    font-weight: 700;
  }
  .receipt-pdf-title {
    min-width: 260px;
    text-align: right;
  }
  .receipt-pdf-title h1 {
    margin: 0;
    color: #374151;
    font-size: 30px;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .receipt-pdf-meta {
    width: 100%;
    margin-top: 26px;
    border-collapse: collapse;
  }
  .receipt-pdf-meta td {
    padding: 5px 0 5px 18px;
    color: #4b5563;
    font-size: 14px;
  }
  .receipt-pdf-meta td:first-child {
    padding-left: 0;
    font-weight: 700;
  }
  .receipt-pdf-meta td:last-child {
    color: #111827;
    font-weight: 700;
    text-align: right;
  }
  .receipt-pdf-table {
    width: 100%;
    margin-top: 30px;
    border-collapse: collapse;
  }
  .receipt-pdf-table thead th {
    padding: 9px 12px;
    background: #374151;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
  }
  .receipt-pdf-table thead th:nth-child(2),
  .receipt-pdf-table thead th:nth-child(3),
  .receipt-pdf-table thead th:nth-child(4) {
    text-align: right;
  }
  .receipt-pdf-table tbody td {
    padding: 12px 12px 10px;
    border-bottom: 1px solid #d6dbe4;
    color: #1f2937;
    font-size: 14px;
    line-height: 1.45;
    vertical-align: top;
  }
  .receipt-pdf-table tbody td:nth-child(2),
  .receipt-pdf-table tbody td:nth-child(3),
  .receipt-pdf-table tbody td:nth-child(4) {
    text-align: right;
    white-space: nowrap;
  }
  .receipt-pdf-description-title {
    display: block;
    color: #111827;
    font-weight: 700;
  }
  .receipt-pdf-description-copy {
    display: block;
    margin-top: 4px;
    color: #6b7280;
    font-size: 12px;
  }
  .receipt-pdf-footer {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 28px;
  }
  .receipt-pdf-details {
    max-width: 56%;
    min-height: 120px;
  }
  .receipt-pdf-detail-label {
    margin: 0 0 8px;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
  }
  .receipt-pdf-detail-copy {
    margin: 0 0 6px;
    color: #4b5563;
    font-size: 13px;
    line-height: 1.5;
  }
  .receipt-pdf-totals {
    width: 100%;
    max-width: 280px;
    margin-left: auto;
    border-collapse: collapse;
  }
  .receipt-pdf-totals td {
    padding: 6px 0;
    color: #4b5563;
    font-size: 14px;
  }
  .receipt-pdf-totals td:last-child {
    color: #111827;
    font-weight: 700;
    text-align: right;
  }
  .receipt-pdf-totals tr.is-total td {
    padding-top: 9px;
    border-top: 1.5px solid #9ca3af;
    color: #111827;
    font-weight: 800;
  }
  .receipt-pdf-note {
    margin-top: 28px;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.5;
  }
`;

export const formatReceiptDateLabel = (value, options = {}) => {
  if (!value) return NOT_AVAILABLE_LABEL;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(parsed);
};

export const formatReceiptCompactDateLabel = (value) => {
  if (!value) return NOT_AVAILABLE_LABEL;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const year = parsed.getFullYear();

  return `${month}-${day}-${year}`;
};

export const formatReceiptCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toFixed(2)}`;
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const isMeaningfulValue = (value) => {
  const normalized = String(value ?? '').trim();
  if (!normalized) return false;

  return !['not available', 'n/a', 'na'].includes(normalized.toLowerCase());
};

const firstMeaningfulValue = (values, fallback = '') => {
  const match = values.find((value) => isMeaningfulValue(value));
  return match ? String(match).trim() : fallback;
};

const splitAddressLines = (value) => {
  if (!isMeaningfulValue(value)) return [NOT_AVAILABLE_LABEL];

  const segments = String(value)
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length <= 2) {
    return segments.length ? segments : [String(value).trim()];
  }

  return [
    segments.slice(0, -1).join(', '),
    segments[segments.length - 1]
  ];
};

const toStatusLabel = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'Pending';
  return normalized
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

const buildReceiptNumber = (invoiceNumber, bookingId, paymentDate) => {
  if (invoiceNumber) return String(invoiceNumber);

  const parsedDate = paymentDate ? new Date(paymentDate) : new Date();
  const receiptYear = Number.isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();
  const paddedBookingId = String(bookingId || '0000').padStart(4, '0');
  return `PCC-${receiptYear}-${paddedBookingId}`;
};

const buildLineDescription = (booking, serviceName) => {
  const details = [];

  if (booking?.bedrooms) details.push(String(booking.bedrooms));
  if (booking?.floors) details.push(String(booking.floors));
  if (booking?.notes) details.push(String(booking.notes));

  if (!details.length) {
    return `Professional cleaning service completed for ${serviceName}.`;
  }

  return details.join(' • ');
};

const buildReceiptItemDescription = (booking, serviceName) => {
  const details = [];

  if (booking?.bedrooms) details.push(`Bedrooms: ${booking.bedrooms}`);
  if (booking?.floors) details.push(`Floors: ${booking.floors}`);
  if (booking?.notes) details.push(`Notes: ${booking.notes}`);

  if (!details.length) {
    return `Professional cleaning service completed for ${serviceName}.`;
  }

  return details.join(' | ');
};

export const buildCleaningReceiptModel = ({
  invoiceNumber = '',
  finalization = null,
  booking = null,
  receiptImageUrl = '',
  generatedAt = new Date().toISOString()
}) => {
  const amountDue = Number(
    finalization?.amount_due
    ?? booking?.negotiated_price
    ?? booking?.totalPrice
    ?? booking?.total_price
    ?? booking?.price
    ?? 0
  );
  const paymentDate = finalization?.cleaner_confirmed_at || finalization?.receipt_uploaded_at || generatedAt;
  const bookingId = finalization?.booking_id || booking?.booking_id || booking?.id || 'N/A';
  const serviceName =
    finalization?.service_name ||
    booking?.service_name ||
    booking?.serviceName ||
    'Cleaning Service';
  const paymentMethod = String(finalization?.payment_method || 'qr').toUpperCase();
  const paymentStatus = String(finalization?.payment_status || booking?.payment_status || booking?.paymentStatus || '');
  const receiptStatusLabel = ['completed', 'paid'].includes(paymentStatus.toLowerCase()) ? 'Completed' : 'Submitted';
  const receiptNumber = buildReceiptNumber(invoiceNumber, bookingId, paymentDate);
  const bookingDate = booking?.booking_date || booking?.bookingDate || null;
  const bookingTime = booking?.booking_time || booking?.bookingTime || NOT_AVAILABLE_LABEL;
  const serviceLocation = booking?.address || booking?.location || booking?.service_location || NOT_AVAILABLE_LABEL;
  const customerName = booking?.customer_full_name || booking?.customer_username || 'Customer';
  const customerEmail = booking?.customer_email || NOT_AVAILABLE_LABEL;
  const customerPhone = booking?.customer_phone || NOT_AVAILABLE_LABEL;
  const cleanerName =
    booking?.cleaner_company ||
    booking?.cleaner_display_name ||
    booking?.cleaner_username ||
    booking?.cleanerName ||
    'Somaet Cleaning';
  const cleanerEmail = booking?.cleaner_email || 'support@somaet.com';
  const cleanerPhone = booking?.cleaner_phone || 'Professional cleaning services';
  const qrReference = finalization?.qr_reference || `BOOKING-${bookingId}`;
  const subtotal = amountDue;
  const serviceTax = 0;
  const loyaltyDiscount = 0;
  const totalPaid = subtotal + serviceTax - loyaltyDiscount;
  const noteText =
    booking?.notes ||
    'Thank you for choosing Somaet. Please keep this receipt for your service and payment records.';

  return {
    invoiceNumber,
    receiptNumber,
    bookingId: String(bookingId),
    serviceName,
    paymentMethod,
    paymentStatus: toStatusLabel(paymentStatus),
    receiptStatusLabel,
    paymentDate,
    bookingDate,
    bookingTime,
    serviceLocation,
    customerName,
    customerEmail,
    customerPhone,
    cleanerName,
    cleanerEmail,
    cleanerPhone,
    qrReference,
    subtotal,
    serviceTax,
    loyaltyDiscount,
    totalPaid,
    amountDue,
    generatedAt,
    noteText,
    receiptImageUrl,
    lineItems: [
      {
        title: serviceName,
        description: buildReceiptItemDescription(booking, serviceName),
        qty: 1,
        unitPrice: subtotal,
        amount: subtotal
      }
    ]
  };
};

export const createCleaningReceiptDocumentHtml = (model) => {
  const uploadedReceiptMarkup = model.receiptImageUrl
    ? `<a href="${escapeHtml(model.receiptImageUrl)}">${escapeHtml(model.receiptImageUrl)}</a>`
    : 'Not attached';

  const itemsMarkup = model.lineItems.map((item) => `
      <tr>
        <td>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.description)}</small>
        </td>
        <td>${escapeHtml(String(item.qty))}</td>
        <td>${escapeHtml(formatReceiptCurrency(item.unitPrice))}</td>
        <td>${escapeHtml(formatReceiptCurrency(item.amount))}</td>
      </tr>
    `).join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Cleaning Service Receipt</title>
    <style>
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        margin: 24px;
        background: #ffffff;
      }
      .receipt-page {
        max-width: 960px;
        margin: 0 auto;
        border-bottom: 6px solid #22c55e;
        padding-bottom: 18px;
      }
      .receipt-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
      }
      .receipt-title {
        color: #22c55e;
        font-size: 30px;
        font-weight: 800;
        margin: 0;
      }
      .receipt-label {
        color: #7c8799;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        display: block;
      }
      .receipt-number {
        font-size: 28px;
        font-weight: 800;
        margin-top: 6px;
      }
      .receipt-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 999px;
        background: #eef2ff;
        color: #22c55e;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .receipt-head-meta {
        text-align: right;
      }
      .receipt-detail-grid {
        margin-top: 34px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
      }
      .receipt-detail-card h3 {
        margin: 0 0 14px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e2e8f0;
        color: #7c8799;
        font-size: 14px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .receipt-detail-card p {
        margin: 0 0 6px;
      }
      .receipt-location-box {
        display: flex;
        gap: 12px;
      }
      .receipt-location-icon {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: #dff2ff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #0f766e;
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0 10px;
        margin-top: 34px;
      }
      th {
        text-align: left;
        color: #7c8799;
        font-size: 14px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 0 10px 8px;
      }
      td {
        background: #f8fafc;
        padding: 16px 10px;
        vertical-align: top;
      }
      td strong {
        display: block;
        color: #22c55e;
        margin-bottom: 4px;
      }
      td small {
        color: #475569;
        display: block;
      }
      .receipt-bottom {
        margin-top: 40px;
        display: grid;
        grid-template-columns: 1.4fr 0.8fr;
        gap: 28px;
      }
      .receipt-note-box {
        border-left: 4px solid #22c55e;
        background: #f1f5f9;
        border-radius: 8px;
        padding: 18px 18px 16px;
      }
      .receipt-note-box h4 {
        margin: 0 0 10px;
        color: #22c55e;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .receipt-signature {
        margin-top: 18px;
        color: #22c55e;
        font-weight: 700;
      }
      .receipt-signature span {
        display: block;
        color: #7c8799;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .receipt-totals {
        display: grid;
        gap: 10px;
      }
      .receipt-total-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
      .receipt-total-row.discount strong {
        color: #16a34a;
      }
      .receipt-total-paid {
        margin-top: 10px;
      }
      .receipt-total-paid span {
        display: block;
        color: #0f172a;
        font-size: 13px;
        font-weight: 800;
      }
      .receipt-total-paid strong {
        color: #22c55e;
        font-size: 38px;
      }
      .receipt-proof {
        margin-top: 16px;
        color: #475569;
        font-size: 13px;
      }
      a {
        color: #0f766e;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <div class="receipt-page">
      <div class="receipt-head">
        <div>
          <h1 class="receipt-title">SERVICE RECEIPT</h1>
          <span class="receipt-label">Receipt Number</span>
          <div class="receipt-number">${escapeHtml(model.receiptNumber)}</div>
        </div>

        <div class="receipt-head-meta">
          <div class="receipt-status">&#10004; ${escapeHtml(model.receiptStatusLabel)}</div>
          <p>Date: ${escapeHtml(formatReceiptDateLabel(model.paymentDate))}</p>
        </div>
      </div>

      <div class="receipt-detail-grid">
        <section class="receipt-detail-card">
          <h3>Client Details</h3>
          <p><strong>${escapeHtml(model.customerName)}</strong></p>
          <p>${escapeHtml(model.serviceLocation)}</p>
          <p>${escapeHtml(model.customerPhone)}</p>
          <p>${escapeHtml(model.customerEmail)}</p>
        </section>

        <section class="receipt-detail-card">
          <h3>Service Location</h3>
          <div class="receipt-location-box">
            <span class="receipt-location-icon">&#9679;</span>
            <div>
              <p><strong>${escapeHtml(model.serviceLocation)}</strong></p>
              <p>Service Date: ${escapeHtml(formatReceiptDateLabel(model.bookingDate))}</p>
              <p>Cleaning Tech: ${escapeHtml(model.cleanerName)}</p>
            </div>
          </div>
        </section>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty/Hours</th>
            <th>Unit Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsMarkup}
        </tbody>
      </table>

      <div class="receipt-bottom">
        <div>
          <div class="receipt-note-box">
            <h4>Special Instructions & Notes</h4>
            <div>${escapeHtml(model.noteText)}</div>
          </div>
          <div class="receipt-signature">
            <span>Technician Signature</span>
            ${escapeHtml(model.cleanerName)}
          </div>
        </div>

        <aside class="receipt-totals">
          <div class="receipt-total-row"><span>Subtotal</span><strong>${escapeHtml(formatReceiptCurrency(model.subtotal))}</strong></div>
          <div class="receipt-total-row"><span>Service Tax</span><strong>${escapeHtml(formatReceiptCurrency(model.serviceTax))}</strong></div>
          <div class="receipt-total-row discount"><span>Loyalty Discount</span><strong>${escapeHtml(formatReceiptCurrency(-Math.abs(model.loyaltyDiscount)))}</strong></div>
          <div class="receipt-total-paid">
            <span>Total Paid</span>
            <strong>${escapeHtml(formatReceiptCurrency(model.totalPaid))}</strong>
          </div>
          <div class="receipt-proof">Uploaded Receipt: ${uploadedReceiptMarkup}</div>
        </aside>
      </div>
    </div>
  </body>
</html>`;
};

const buildSafeReceiptFileName = (receiptNumber, bookingId) => String(receiptNumber || bookingId || 'receipt')
  .replace(/[^a-zA-Z0-9-_]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const buildReceiptPdfMarkup = (model) => {
  const companyName = firstMeaningfulValue(
    [model.cleanerName, 'Somaet Cleaning'],
    'Somaet Cleaning'
  );
  const companyLines = [
    firstMeaningfulValue([model.cleanerPhone, 'Professional cleaning services'], 'Professional cleaning services'),
    firstMeaningfulValue([model.cleanerEmail, 'support@somaet.com'], 'support@somaet.com')
  ];
  const billedLines = [
    ...splitAddressLines(model.serviceLocation),
    isMeaningfulValue(model.customerPhone) ? model.customerPhone : '',
    isMeaningfulValue(model.customerEmail) ? model.customerEmail : ''
  ].filter(Boolean);
  const detailLines = [
    `Service: ${model.serviceName}`,
    `Cleaner: ${model.cleanerName}`,
    model.bookingDate ? `Service date: ${formatReceiptDateLabel(model.bookingDate)}` : '',
    isMeaningfulValue(model.bookingTime) ? `Time slot: ${model.bookingTime}` : '',
    isMeaningfulValue(model.noteText) && !model.noteText.startsWith('Thank you for choosing Somaet')
      ? `Notes: ${model.noteText}`
      : ''
  ].filter(Boolean);
  const rowsMarkup = model.lineItems.map((item) => `
    <tr>
      <td>
        <span class="receipt-pdf-description-title">${escapeHtml(item.title)}</span>
        <span class="receipt-pdf-description-copy">${escapeHtml(item.description)}</span>
      </td>
      <td>${escapeHtml(String(item.qty))}</td>
      <td>${escapeHtml(formatReceiptCurrency(item.unitPrice))}</td>
      <td>${escapeHtml(formatReceiptCurrency(item.amount))}</td>
    </tr>
  `).join('');
  const companyMarkup = companyLines.map((line) => (
    `<p class="receipt-pdf-company-line">${escapeHtml(line)}</p>`
  )).join('');
  const billedMarkup = billedLines.map((line, index) => (
    `<p class="receipt-pdf-billed-line${index === 0 ? ' is-primary' : ''}">${escapeHtml(line)}</p>`
  )).join('');
  const detailMarkup = detailLines.map((line) => (
    `<p class="receipt-pdf-detail-copy">${escapeHtml(line)}</p>`
  )).join('');

  return `
    <div class="receipt-pdf-root">
      <div class="receipt-pdf-page">
        <div class="receipt-pdf-top">
          <div class="receipt-pdf-company">
            <h2 class="receipt-pdf-company-name">${escapeHtml(companyName)}</h2>
            ${companyMarkup}
          </div>

          <div class="receipt-pdf-logo">
            <img src="${escapeHtml(logoSomaet)}" alt="Somaet logo" />
          </div>
        </div>

        <div class="receipt-pdf-overview">
          <div class="receipt-pdf-billed">
            <p class="receipt-pdf-section-label">Billed To</p>
            <p class="receipt-pdf-billed-line is-primary">${escapeHtml(model.customerName)}</p>
            ${billedMarkup}
          </div>

          <div class="receipt-pdf-title">
            <h1>CLEANING<br />RECEIPT</h1>
            <table class="receipt-pdf-meta" aria-hidden="true">
              <tbody>
                <tr>
                  <td>Receipt #</td>
                  <td>${escapeHtml(model.receiptNumber)}</td>
                </tr>
                <tr>
                  <td>Receipt date</td>
                  <td>${escapeHtml(formatReceiptCompactDateLabel(model.paymentDate))}</td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td>${escapeHtml(model.receiptStatusLabel)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <table class="receipt-pdf-table">
          <thead>
            <tr>
              <th>QTY Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsMarkup}
          </tbody>
        </table>

        <div class="receipt-pdf-footer">
          <div class="receipt-pdf-details">
            <p class="receipt-pdf-detail-label">Service Details</p>
            ${detailMarkup}
          </div>

          <table class="receipt-pdf-totals" aria-hidden="true">
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td>${escapeHtml(formatReceiptCurrency(model.subtotal))}</td>
              </tr>
              <tr>
                <td>Service Tax</td>
                <td>${escapeHtml(formatReceiptCurrency(model.serviceTax))}</td>
              </tr>
              ${model.loyaltyDiscount ? `
                <tr>
                  <td>Loyalty Discount</td>
                  <td>${escapeHtml(formatReceiptCurrency(-Math.abs(model.loyaltyDiscount)))}</td>
                </tr>
              ` : ''}
              <tr class="is-total">
                <td>Total (USD)</td>
                <td>${escapeHtml(formatReceiptCurrency(model.totalPaid))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="receipt-pdf-note">
          Thank you for choosing Somaet. Please keep this receipt for your service and payment records.
        </p>
      </div>
    </div>
  `;
};

const waitForImages = async (rootElement) => {
  const imageElements = Array.from(rootElement.querySelectorAll('img'));

  await Promise.all(imageElements.map((imageElement) => {
    if (imageElement.complete) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      imageElement.addEventListener('load', resolve, { once: true });
      imageElement.addEventListener('error', resolve, { once: true });
    });
  }));
};

const waitForNextPaint = () => new Promise((resolve) => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(resolve);
  });
});

const createPdfBlobFromCanvas = (canvas) => {
  const imageDataUrl = canvas.toDataURL('image/jpeg', 0.96);
  const base64Payload = imageDataUrl.split(',')[1] || '';
  const binaryString = window.atob(base64Payload);
  const imageBytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    imageBytes[index] = binaryString.charCodeAt(index);
  }

  const contentScale = Math.min(
    (PDF_PAGE_WIDTH - (PDF_MARGIN * 2)) / canvas.width,
    (PDF_PAGE_HEIGHT - (PDF_MARGIN * 2)) / canvas.height
  );
  const contentWidth = canvas.width * contentScale;
  const contentHeight = canvas.height * contentScale;
  const x = (PDF_PAGE_WIDTH - contentWidth) / 2;
  const y = PDF_PAGE_HEIGHT - PDF_MARGIN - contentHeight;
  const pageWidth = PDF_PAGE_WIDTH.toFixed(2);
  const pageHeight = PDF_PAGE_HEIGHT.toFixed(2);
  const contentStream = new TextEncoder().encode(
    `q
${contentWidth.toFixed(2)} 0 0 ${contentHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm
/Im0 Do
Q`
  );
  const textEncoder = new TextEncoder();
  const pdfParts = [];
  const objectOffsets = [0];
  let currentLength = 0;

  const appendBytes = (bytes) => {
    pdfParts.push(bytes);
    currentLength += bytes.length;
  };

  const appendText = (value) => {
    appendBytes(textEncoder.encode(value));
  };

  const appendObject = (objectId, bodyText) => {
    objectOffsets[objectId] = currentLength;
    appendText(`${objectId} 0 obj\n${bodyText}\nendobj\n`);
  };

  const appendStreamObject = (objectId, dictionaryText, streamBytes) => {
    objectOffsets[objectId] = currentLength;
    appendText(`${objectId} 0 obj\n${dictionaryText}\nstream\n`);
    appendBytes(streamBytes);
    appendText('\nendstream\nendobj\n');
  };

  appendText('%PDF-1.4\n');
  appendObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  appendObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  appendObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
  );
  appendStreamObject(
    4,
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>`,
    imageBytes
  );
  appendStreamObject(5, `<< /Length ${contentStream.length} >>`, contentStream);

  const crossReferenceOffset = currentLength;
  appendText(`xref\n0 ${objectOffsets.length}\n`);
  appendText('0000000000 65535 f \n');

  for (let objectId = 1; objectId < objectOffsets.length; objectId += 1) {
    appendText(`${String(objectOffsets[objectId]).padStart(10, '0')} 00000 n \n`);
  }

  appendText(`trailer\n<< /Size ${objectOffsets.length} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`);

  return new Blob(pdfParts, { type: 'application/pdf' });
};

const downloadBlobFile = (blob, fileName) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');

  downloadLink.href = blobUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(blobUrl);
};

export const downloadCleaningReceiptDocument = async ({
  invoiceNumber = '',
  finalization = null,
  booking = null,
  receiptImageUrl = '',
  generatedAt = new Date().toISOString()
}) => {
  const model = buildCleaningReceiptModel({
    invoiceNumber,
    finalization,
    booking,
    receiptImageUrl,
    generatedAt
  });

  if (!document?.body) {
    throw new Error('Receipt export is only available in the browser.');
  }

  const renderHost = document.createElement('div');
  renderHost.setAttribute('aria-hidden', 'true');
  renderHost.style.position = 'fixed';
  renderHost.style.left = '-20000px';
  renderHost.style.top = '0';
  renderHost.style.width = `${RECEIPT_RENDER_WIDTH}px`;
  renderHost.style.opacity = '0';
  renderHost.style.pointerEvents = 'none';
  renderHost.style.background = '#ffffff';
  renderHost.innerHTML = `<style>${receiptPdfStyles}</style>${buildReceiptPdfMarkup(model)}`;

  document.body.appendChild(renderHost);

  try {
    const receiptElement = renderHost.querySelector('.receipt-pdf-page');

    if (!receiptElement) {
      throw new Error('Could not prepare the receipt layout.');
    }

    await waitForImages(renderHost);
    await waitForNextPaint();

    const canvas = await html2canvas(receiptElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    });

    const pdfBlob = createPdfBlobFromCanvas(canvas);
    const safeReceiptNumber = buildSafeReceiptFileName(model.receiptNumber, model.bookingId) || 'receipt';
    downloadBlobFile(pdfBlob, `cleaning-service-receipt-${safeReceiptNumber}.pdf`);
  } finally {
    document.body.removeChild(renderHost);
  }
};
