import { Link } from 'react-router-dom';
import {
  ArrowRightOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import logoSomaet from '../../../assets/Logo_somaet.png';
import '../../../styles/customer/footer.scss';

const serviceLinks = [
  { label: 'Residential Clean', path: '/customer/services' },
  { label: 'Commercial Mgmt', path: '/customer/services' },
  { label: 'HVAC Maintenance', path: '/customer/services' },
  { label: 'Sanitization Pro', path: '/customer/services' },
];

const quickLinks = [
  { label: 'My Home', path: '/customer/dashboard' },
  { label: 'Service', path: '/customer/services' },
  { label: 'About', path: '/customer/about' },
  { label: 'Contact', path: '/customer/contact' },
];

const Footer = () => {
  return (
    <footer className="customer-footer">
      <div className="footer-shell">
        <div className="footer-main">
          <section className="footer-brand-panel">
            <div className="footer-brand-row">
              <span className="footer-brand-mark" aria-hidden="true">
                <img src={logoSomaet} alt="Somaet logo" />
              </span>
              <h3>Somaet</h3>
            </div>

            <p>
              The ultimate operational ecosystem for high-end maintenance and premium cleaning
              management. Engineered cleanliness for the spaces that matter most.
            </p>

            <div className="footer-socials">
              <button type="button" aria-label="Website">
                <GlobalOutlined />
              </button>
              <button type="button" aria-label="Messages">
                <MessageOutlined />
              </button>
              <button type="button" aria-label="Share">
                <ShareAltOutlined />
              </button>
            </div>
          </section>

          <nav className="footer-column">
            <h4>Services</h4>
            <ul>
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className="footer-column footer-contact-column">
            <h4>Global HQ</h4>
            <ul className="footer-contact-list">
              <li>
                <span className="footer-icon" aria-hidden="true">
                  <EnvironmentOutlined />
                </span>
                <span>39b Street 371, Phnom Penh</span>
              </li>
              <li>
                <span className="footer-icon" aria-hidden="true">
                  <MailOutlined />
                </span>
                <a href="mailto:info@somaet.com" className="footer-link">
                  info@somaet.com
                </a>
              </li>
            </ul>

            <div className="footer-subscribe">
              <h5>Subscribe To Updates</h5>
              <div className="footer-subscribe-row">
                <input type="email" placeholder="Email address" aria-label="Email address" />
                <button type="button" aria-label="Subscribe">
                  <ArrowRightOutlined />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="footer-bottom-bar">
          <span>&copy; 2026 Somaet. All rights reserved.</span>
          <div className="footer-meta">
            <span>ISO 9001 Certified</span>
            <span>HIPAA Compliant</span>
            <span>Status: Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
