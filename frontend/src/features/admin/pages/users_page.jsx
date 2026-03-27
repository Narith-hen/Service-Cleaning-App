import React from 'react';
import { useTranslation } from '../../../contexts/translation_context';

const UsersPage = () => {
  const { ta } = useTranslation();

  return (
    <section>
      <h1 className="admin-page-title">{ta('Manage Users')}</h1>
      <p className="admin-page-subtitle">{ta('View and manage admin, cleaner, and customer accounts.')}</p>
    </section>
  );
};

export default UsersPage;
