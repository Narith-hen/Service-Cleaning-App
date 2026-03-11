import {
  FacebookFilled,
  InstagramFilled,
  TwitterCircleFilled,
  GithubFilled,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import logo from '../../../assets/Logo_somaet.png';
import '../../../styles/customer/footer.scss';

const Footer = () => {
  return (
    <footer className="customer-footer">
      <div className="footer-inner">
        <div className="footer-hero">
          
          <h3>Somaet</h3>
          <p>
            Professional home, office, and shop cleaning services. We make your space fresh, clean,
            and healthy.
          </p>
        </div>

        


        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            <li>Home Cleaning</li>
            <li>Office Cleaning</li>
            <li>Window Cleaning</li>
            <li>Deep Cleaning</li>
          </ul>
        </div>

        

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li>About Us</li>
            <li>Our Services</li>
            <li>Contact</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul className="contact-list">
            <li>
              <span className="contact-icon" aria-hidden="true">
                <MailOutlined />
              </span>
              info@somaet.com
            </li>
            <li>
              <span className="contact-icon" aria-hidden="true">
                <PhoneOutlined />
              </span>
              +855 97 298 6450
            </li>
            <li>
              <span className="contact-icon" aria-hidden="true">
                <EnvironmentOutlined />
              </span>
              39b Street 371, Phnom Penh
            </li>
          </ul>
        </div>

        

        
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>&copy; 2026 Somaet. All rights reserved.</span>
          <div className="footer-links">
            <button type="button">Privacy Policy</button>
            <button type="button">Terms of Service</button>
            <button type="button">Cookie Policy</button>
            <button type="button">Security</button>
          </div>
          <div className="footer-badges">
            <span className="badge-pill">GDPR</span>
            <span className="badge-pill">ISO 27001</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
