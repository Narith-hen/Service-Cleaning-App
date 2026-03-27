import React from 'react';
import { useTranslation } from '../../../contexts/translation_context';

const PaymentsPage = () => {
  const { ta } = useTranslation();

  return (
    <section>
      <h1 className="admin-page-title">{ta('Manage Payments')}</h1>
      <p className="admin-page-subtitle">{ta('Track transactions, payouts, and payment statuses.')}</p>
    </section>
  );
};

export default PaymentsPage;


