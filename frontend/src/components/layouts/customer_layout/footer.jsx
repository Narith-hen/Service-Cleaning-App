const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">Somaet</h3>
          <p>
            Professional home, office, and shop cleaning services.
            We make your space fresh, clean, and healthy.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Services</h4>
          <ul className="space-y-2">
            <li>Home Cleaning</li>
            <li>Office Cleaning</li>
            <li>Window Cleaning</li>
            <li>Deep Cleaning</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li>About Us</li>
            <li>Our Services</li>
            <li>Contact</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <ul className="space-y-2">
            <li>Email: info@somaet.com</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Location: San Francisco, CA</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
        &copy; 2026 Somaet. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
