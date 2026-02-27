import React, { useState } from 'react';

const PaymentMethodPage = () => {
  const [showQR, setShowQR] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(50);
  
  const paymentMethods = [
    { id: 1, type: 'Visa', cardNumber: '**** **** **** 4242', expiry: '12/25', default: true },
    { id: 2, type: 'Mastercard', cardNumber: '**** **** **** 8888', expiry: '08/24', default: false },
    { id: 3, type: 'ABA', account: '123 456 789', name: 'SEVANOW Co.', default: false }
  ];

  const deleteMethod = (id) => {
    // Delete logic
  };

  const setDefault = (id) => {
    // Set default logic
  };

  // Sample QR code (you can replace with actual QR image)
  const qrCodePlaceholder = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SEVANOW-PAYMENT-12345';

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Payment Methods</h1>
      
      {/* Payment Methods List */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Saved Payment Methods</h3>
        {paymentMethods.map(method => (
          <div key={method.id} style={{ 
            border: '1px solid #ddd', 
            padding: '15px', 
            marginBottom: '10px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: method.default ? '#f0f9ff' : 'white'
          }}>
            <div>
              <strong>{method.type}</strong><br />
              {method.cardNumber && <span>{method.cardNumber} | Exp: {method.expiry}</span>}
              {method.account && <span>Account: {method.account} - {method.name}</span>}
              {method.default && <span style={{ color: 'green', marginLeft: '10px' }}>✓ Default</span>}
            </div>
            <div>
              {!method.default && (
                <button onClick={() => setDefault(method.id)} style={{ marginRight: '10px' }}>
                  Set Default
                </button>
              )}
              <button onClick={() => deleteMethod(method.id)} style={{ color: 'red' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Method */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Add New Payment Method</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button style={{ padding: '10px 20px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '5px' }}>
            Credit Card
          </button>
          <button 
            style={{ padding: '10px 20px', background: showQR ? '#007bff' : '#f0f0f0', color: showQR ? 'white' : 'black', border: '1px solid #ddd', borderRadius: '5px' }}
            onClick={() => setShowQR(!showQR)}
          >
            QR Code
          </button>
          <button style={{ padding: '10px 20px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '5px' }}>
            ABA
          </button>
        </div>

        {/* QR Code Payment Section */}
        {showQR && (
          <div style={{ 
            border: '2px dashed #007bff', 
            padding: '30px', 
            borderRadius: '10px',
            textAlign: 'center',
            backgroundColor: '#f8f9ff'
          }}>
            <h4 style={{ marginBottom: '20px' }}>Scan QR Code to Pay</h4>
            
            {/* Amount Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label>Select Amount: </label>
              <select 
                value={selectedAmount} 
                onChange={(e) => setSelectedAmount(e.target.value)}
                style={{ padding: '5px', marginLeft: '10px' }}
              >
                <option value={20}>$20</option>
                <option value={50}>$50</option>
                <option value={100}>$100</option>
                <option value={200}>$200</option>
              </select>
            </div>

            {/* QR Code Image */}
            <div style={{ marginBottom: '20px' }}>
              <img 
                src={qrCodePlaceholder} 
                alt="Payment QR Code"
                style={{ width: '150px', height: '150px', border: '1px solid #ddd' }}
              />
            </div>

            <p style={{ color: '#666', marginBottom: '10px' }}>
              Scan with your banking app to pay ${selectedAmount}
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Reference: SEVANOW-{Date.now()}
            </p>

            {/* Payment Status (for demo) */}
            <div style={{ 
              marginTop: '20px', 
              padding: '10px', 
              backgroundColor: '#e6f7e6', 
              borderRadius: '5px',
              color: '#28a745'
            }}>
              ✅ Demo: QR payment successful!
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '30px' }}>
        <button style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px' }}>
          Add Money
        </button>
        <button style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          Payment History
        </button>
      </div>

      {/* Demo Note */}
      <p style={{ marginTop: '30px', color: '#666', fontStyle: 'italic' }}>
        Note: This is a demo interface. QR code scanning is simulated for demonstration.
      </p>
    </div>
  );
};

export default PaymentMethodPage;