import Navbar from "../components/Navbar";
import grabLogo from "../../assets/grab.png";
import tada from "../../assets/tada.png";
import passApp from "../../assets/passApp.png";
import redbus from "../../assets/redbus.png";
import easybook from "../../assets/easybook.png";
import agoda from "../../assets/agoda.webp";
import ravel from "../../assets/ravel.png";
import book from "../../assets/book.png";
import vet from "../../assets/vet.png";
import larryta from "../../assets/larryta.png";
import "../../styles/public/Aboutpage.css";

export default function AboutPage({ embedded = false, darkMode = false }) {
  const partnerLogos = [
    { src: grabLogo, name: "Grab" },
    { src: tada, name: "tada" },
    { src: passApp, name: "passApp" },
    { src: redbus, name: "redbus" },
    { src: easybook, name: "easybook" },
    { src: agoda, name: "agoda" },
    { src: ravel, name: "Travel Book" },
    { src: book, name: "Book Cambodia" },
    { src: vet, name: "Virak Buntham Cambodia" },
    { src: larryta, name: "Larryta Cambodia" },
  ];

  const valuesSectionClassName = `about-values-section${darkMode ? " about-values-section-dark" : ""}`;
  const valuesCardClassName = `about-values-card${darkMode ? " about-values-card-dark" : ""}`;
  const valuesTextClassName = `about-values-text${darkMode ? " about-values-text-dark" : ""}`;

  return (
    <div className={`${darkMode ? "bg-[#0b1220] text-slate-100" : "bg-slate-50 text-slate-800"} font-sans`}>
      {!embedded && <Navbar />}

      <section className={`${darkMode ? "bg-[#111b2f]" : "bg-white"} py-20 md:py-24`} data-customer-reveal={embedded ? '' : undefined}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-2 md:gap-14 md:px-8">
          <div className="relative" data-customer-reveal={embedded ? '' : undefined} style={embedded ? { '--customer-reveal-delay': 1 } : undefined}>
            <div className="absolute -left-4 -top-4 h-20 w-20 rounded-2xl bg-emerald-100 blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?auto=format&fit=crop&q=80&w=1000"
              alt="Cleaning Team"
              className="relative z-10 rounded-3xl border border-slate-100 shadow-2xl"
            />
            <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg">
              10+ Years Experience
            </div>
          </div>

          <div data-customer-reveal={embedded ? '' : undefined} style={embedded ? { '--customer-reveal-delay': 2 } : undefined}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              About Company
            </p>
            <h2 className={`mb-6 text-4xl font-black leading-tight md:text-5xl ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
              About <span className="text-[#32c753]">Somaet</span>
            </h2>

            <p className={`mb-4 text-lg ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              Somaet has been delivering professional cleaning services for over 10
              years. We specialize in residential and commercial cleaning solutions
              that create healthier and happier environments.
            </p>

            <p className={`mb-7 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              Our trained team uses eco-friendly products and modern equipment to
              ensure every space is spotless, sanitized, and fresh.
            </p>

            <ul className="space-y-3">
              <li className={`flex items-center gap-3 rounded-xl px-3 py-2 ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50"}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  OK
                </span>
                Experienced and Certified Team
              </li>

              <li className={`flex items-center gap-3 rounded-xl px-3 py-2 ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50"}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  OK
                </span>
                Eco-Friendly Products
              </li>

              <li className={`flex items-center gap-3 rounded-xl px-3 py-2 ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50"}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  OK
                </span>
                100% Satisfaction Guarantee
              </li>
            </ul>

            <button className="mt-8 rounded-full bg-emerald-500 px-8 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600" data-customer-button={embedded ? '' : undefined}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      <section className={valuesSectionClassName} data-customer-reveal={embedded ? '' : undefined}>
        <div className="about-values-container">
          <div className={valuesCardClassName}>
            <div className="about-values-icon" aria-hidden="true">👁️</div>
            <h2>OUR VISION</h2>
            <p className={valuesTextClassName}>
              To become the trusted leader in modern, sustainable cleaning by making
              healthier spaces accessible for every home and business.
            </p>
          </div>

          <div className={valuesCardClassName}>
            <div className="about-values-icon" aria-hidden="true">🚀</div>
            <h2>OUR MISSION</h2>
            <p className={valuesTextClassName}>
              Our mission is to deliver high-quality, eco-friendly cleaning services
              through trained professionals, reliable scheduling, and customer-first care.
            </p>
          </div>
        </div>
      </section>

      <section
        className={`py-20 md:py-24 ${
          darkMode
            ? "bg-gradient-to-br from-[#0b1220] via-[#111b2f] to-[#0f2036]"
            : "bg-gradient-to-br from-emerald-50 via-white to-slate-100"
        }`}
        data-customer-reveal={embedded ? '' : undefined}
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className={`overflow-hidden rounded-3xl border shadow-2xl ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`} data-customer-panel={embedded ? '' : undefined}>
            <div className="relative flex h-28 w-full items-end bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 pb-4 md:h-32">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/90">
                Our Partnerships
              </p>
            </div>

            <div className="p-8 text-center md:p-12">
              <h2 className={`mb-4 text-3xl font-black tracking-tight md:text-4xl ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                Clients We Are Proud Of
              </h2>

              <p className={`mx-auto mb-10 max-w-2xl md:text-lg ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                Trusted by respected businesses and organizations who rely on our
                professional cleaning services for excellence and reliability.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 md:gap-4">
                {partnerLogos.map((partner, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 ${
                      darkMode
                        ? "border-slate-700 bg-slate-800 shadow-[0_8px_18px_rgba(2,6,23,0.4)] hover:shadow-[0_16px_30px_rgba(2,6,23,0.6)]"
                        : "border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:shadow-[0_16px_30px_rgba(15,23,42,0.14)]"
                    }`}
                    data-customer-reveal={embedded ? '' : undefined}
                    data-customer-card={embedded ? '' : undefined}
                    style={embedded ? { '--customer-reveal-delay': Math.min(index % 5, 4) } : undefined}
                  >
                    <div className="flex h-[98px] items-center justify-center rounded-xl bg-white md:h-[110px]">
                      <img
                        src={partner.src}
                        alt={partner.name}
                        className="h-[72px] w-[170px] object-contain transition duration-300 group-hover:scale-105 md:h-[82px] md:w-[185px]"
                      />
                    </div>
                    <p className={`mt-3 text-center text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
                      {partner.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {!embedded && (
        <footer className="bg-gray-900 py-8 text-center text-sm text-gray-400">
          (c) 2026 CleaningPro. All rights reserved.
        </footer>
      )}
    </div>
  );
}
