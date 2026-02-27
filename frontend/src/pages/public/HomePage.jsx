import Navbar from "../components/Navbar";
import ServicesPage from "./ServicesPage";
import AboutPage from "./AboutPage";
import ContactPage from "./ContactPage";

export default function HomePage() {
  return (
    <div className="bg-gray-50 font-sans text-gray-800">
      <Navbar />

      <section id="home" className="bg-gradient-to-br from-teal-50 to-white pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <span className="bg-teal-100 text-teal-700 px-4 py-1 rounded-full text-sm font-semibold">
              Trusted Professional Cleaners
            </span>

            <h1 className="text-5xl md:text-6xl font-black mt-6 leading-tight">
              Sparkling Clean <br />
              Spaces Made <span className="text-teal-700">Simple</span>
            </h1>

            <p className="mt-6 text-gray-600 max-w-lg text-lg">
              We provide high-quality residential and commercial cleaning services.
            </p>
          </div>

          <div className="flex-1">
            <div className="rounded-[40px] overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=1000"
                alt="Cleaning"
                className="w-full h-[500px] object-cover"
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

      <footer className="bg-gray-900 text-gray-400 text-center py-8 text-sm">
        (c) 2026 CleaningPro. All rights reserved.
      </footer>
    </div>
  );
}