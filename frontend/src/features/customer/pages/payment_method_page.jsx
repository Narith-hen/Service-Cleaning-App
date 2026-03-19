import React, { useMemo, useState } from 'react';

const qrCodePlaceholder = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SEVANOW-PAYMENT-12345';

const PaymentMethodPage = () => {
  const [showQR, setShowQR] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'Visa', cardNumber: '**** **** **** 4242', expiry: '12/25', default: true },
    { id: 2, type: 'Mastercard', cardNumber: '**** **** **** 8888', expiry: '08/24', default: false },
    { id: 3, type: 'ABA', account: '123 456 789', name: 'SEVANOW Co.', default: false }
  ]);

  const referenceCode = useMemo(() => `SEVANOW-${selectedAmount}-2026`, [selectedAmount]);

  const deleteMethod = (id) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
  };

  const setDefault = (id) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        default: method.id === id
      }))
    );
  };

  return (
    <div className="customer-simple-page">
      <section className="customer-simple-page__hero" data-customer-reveal>
        <span className="customer-simple-page__eyebrow">Billing Center</span>
        <h1>Payment Methods</h1>
        <p>
          Manage your saved cards and bank options, then use a quick QR flow whenever you need
          to top up or complete a payment.
        </p>
      </section>

      <div className="customer-simple-grid customer-simple-grid--two">
        <section
          className="customer-simple-card customer-simple-stack"
          data-customer-reveal
          data-customer-panel
          style={{ '--customer-reveal-delay': 1 }}
        >
          <div className="customer-simple-toolbar">
            <div>
              <h2>Saved Payment Methods</h2>
              <p className="customer-note">Choose a default payment source for faster checkout.</p>
            </div>
          </div>

          <div className="customer-list">
            {paymentMethods.map((method, index) => (
              <article
                key={method.id}
                className="customer-list-item"
                data-customer-reveal
                data-customer-card
                style={{ '--customer-reveal-delay': Math.min(index % 3, 2) }}
              >
                <div className="customer-list-item__meta">
                  <strong>{method.type}</strong>
                  {method.cardNumber && <span>{method.cardNumber} | Exp: {method.expiry}</span>}
                  {method.account && <span>Account: {method.account} | {method.name}</span>}
                  {method.default && <small>Default payment method</small>}
                </div>

                <div className="customer-inline-actions">
                  {!method.default && (
                    <button
                      type="button"
                      className="customer-secondary-button"
                      onClick={() => setDefault(method.id)}
                      data-customer-button
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    type="button"
                    className="customer-danger-button"
                    onClick={() => deleteMethod(method.id)}
                    data-customer-button
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="customer-simple-card customer-simple-stack"
          data-customer-reveal
          data-customer-panel
          style={{ '--customer-reveal-delay': 2 }}
        >
          <div>
            <h2>Add New Method</h2>
            <p className="customer-note">Switch between card, QR, and ABA payment options.</p>
          </div>

          <div className="customer-chip-row">
            <button type="button" className="customer-chip-button active" data-customer-button>
              Credit Card
            </button>
            <button
              type="button"
              className={`customer-chip-button ${showQR ? 'active' : ''}`}
              onClick={() => setShowQR((prev) => !prev)}
              data-customer-button
            >
              QR Code
            </button>
            <button type="button" className="customer-chip-button" data-customer-button>
              ABA
            </button>
          </div>

          {showQR && (
            <div className="customer-qr-box" data-customer-reveal style={{ '--customer-reveal-delay': 1 }}>
              <div>
                <h3>Scan QR Code to Pay</h3>
                <p className="customer-note">Choose an amount and scan with your banking app.</p>
              </div>

              <label className="customer-field-group" style={{ width: '100%', maxWidth: '240px' }}>
                <span>Select Amount</span>
                <select value={selectedAmount} onChange={(event) => setSelectedAmount(Number(event.target.value))}>
                  <option value={20}>$20</option>
                  <option value={50}>$50</option>
                  <option value={100}>$100</option>
                  <option value={200}>$200</option>
                </select>
              </label>

              <img src={qrCodePlaceholder} alt="Payment QR Code" />

              <div>
                <p className="customer-note">Scan to pay ${selectedAmount}</p>
                <p className="customer-note">Reference: {referenceCode}</p>
              </div>

              <div className="customer-simple-card" style={{ width: '100%', maxWidth: '340px', padding: '14px 16px' }}>
                <strong style={{ color: '#15803d' }}>Demo payment ready</strong>
                <p className="customer-note" style={{ marginTop: '6px' }}>
                  This QR payment area is displayed for demo flow and animation preview.
                </p>
              </div>
            </div>
          )}

          <div className="customer-inline-actions">
            <button type="button" className="customer-primary-button" data-customer-button>
              Add Money
            </button>
            <button type="button" className="customer-secondary-button" data-customer-button>
              Payment History
            </button>
          </div>
        </section>
      </div>

      <p className="customer-note" data-customer-reveal style={{ '--customer-reveal-delay': 2, marginTop: '18px' }}>
        Demo note: QR payment scanning is represented here for interface testing and motion polish.
      </p>
    </div>
  );
};

export default PaymentMethodPage;
