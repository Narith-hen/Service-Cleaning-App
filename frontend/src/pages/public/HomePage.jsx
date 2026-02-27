import Navbar from "../components/Navbar";
import ServicesPage from "./ServicesPage";
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";
import homeImage from "../../assets/image.png";

export default function HomePage() {
  return (
    <div className="bg-gray-50 font-sans text-gray-800">
      <Navbar />

      <section id="home" className="bg-gradient-to-br from-[#32c753]/10 to-white pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-start gap-16">
          <div className="flex-1">
            <span className="bg-[#32c753]/15 text-[#32c753] px-6 py-1 rounded-full text-sm font-semibold ">
              Trusted Professional Cleaners
            </span>

            <h1 className="text-5xl md:text-6xl font-black mt-6 leading-tight">
              Sparkling Clean <br />
              Spaces Made <span className="text-[#32c753]">Simple</span>
            </h1>

            <p className="mt-6 text-gray-600 max-w-lg text-lg">
              We provide high-quality residential and commercial cleaning services.
            </p>
          </div>

          <div className="flex-1 md:-mt-30">
            <div className="rounded-[40px] overflow-hidden shadow-2xl">
              <img
                src={homeImage}
                alt="Cleaning"
                className="w-full h-[600px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="services">
        <ServicesPage embedded />
      </section>

      <section id="about">
        <AboutPage embedded />
      </section>

      <section id="contact">
        <ContactPage embedded />
      </section>

      <footer className="bg-gray-900 text-gray-400 py-10">
  <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 text-sm">
    
    {/* Company Info */}
    <div>
      <h3 className="text-white text-lg font-semibold mb-3">CleaningPro</h3>
      <p>
        Professional home, office, and shop cleaning services. 
        We make your space fresh, clean, and healthy.
      </p>
    </div>

    {/* Services */}
    <div>
      <h4 className="text-white font-semibold mb-3">Services</h4>
      <ul className="space-y-2">
        <li>Home Cleaning</li>
        <li>Office Cleaning</li>
        <li>Window Cleaning</li>
        <li>Deep Cleaning</li>
      </ul>
    </div>

    {/* Quick Links */}
    <div>
      <h4 className="text-white font-semibold mb-3">Quick Links</h4>
      <ul className="space-y-2">
        <li>About Us</li>
        <li>Our Services</li>
        <li>Contact</li>
        <li>Privacy Policy</li>
      </ul>
    </div>

    {/* Contact */}
    <div>
      <h4 className="text-white font-semibold mb-3">Contact</h4>
      <ul className="space-y-2">
        <li>Email: info@cleaningpro.com</li>
        <li>Phone: +123 456 7890</li>
        <li>Location: Your City, Country</li>
      </ul>
    </div>

  </div>

  {/* Bottom Bar */}
  <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
    © 2026 CleaningPro. All rights reserved.
  </div>
</footer>
    </div>
  );
}
