import { useOutletContext } from 'react-router-dom';
import AboutContent from '../../../pages/public/AboutPage';

const CustomerAboutPage = () => {
  const { darkMode = false } = useOutletContext() || {};
  return <AboutContent embedded darkMode={darkMode} />;
};

export default CustomerAboutPage;
