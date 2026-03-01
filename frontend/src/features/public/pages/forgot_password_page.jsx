import React, { useState } from 'react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle password reset logic
    setSubmitted(true);
  };

  return (
    <div className="forgot-password-page">
      <div className="container">
        <h1 className="roboto roboto-700">Reset Password</h1>
        {!submitted ? (
          <>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <button type="submit" className="roboto roboto-500">Send Reset Link</button>
            </form>
          </>
        ) : (
          <p>If an account exists with {email}, you'll receive a password reset link shortly.</p>
        )}
        <a href="/auth/login">Back to Login</a>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; // <-- THIS IS CRITICAL!