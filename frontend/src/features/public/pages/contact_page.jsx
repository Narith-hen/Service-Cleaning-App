import { useOutletContext } from 'react-router-dom';
import ContactContent from '../../../pages/public/ContactPage';

const ContactPage = () => {
  const { darkMode = false } = useOutletContext() || {};
  return <ContactContent embedded darkMode={darkMode} />;
};

export default ContactPage;
