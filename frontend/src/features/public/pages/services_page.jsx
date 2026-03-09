import { Link, useLocation, useOutletContext } from 'react-router-dom';
import ServicesContent from '../../../pages/public/ServicesPage';
import homeImage from '../../../assets/image.png';
import welcomeServiceImage from '../../../assets/WelcomeService.png';

const ServicesPage = () => {
  const location = useLocation();
  const { darkMode = false } = useOutletContext() || {};
  const isCustomerArea = location.pathname.startsWith('/customer');

  return (
    <div className={darkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#f2f4f3] text-slate-800'}>
      <section
        className={`py-14 ${
          darkMode
            ? 'bg-gradient-to-br from-[#0f2036] via-[#111b2f] to-[#0b1220]'
            : 'bg-gradient-to-br from-[#32c753]/12 to-white'
        }`}
      >
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 md:grid-cols-2 md:px-10">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.25em] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Welcome
            </p>
            <h1 className={`mt-3 text-4xl font-black leading-tight md:text-5xl ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Explore Our <span className="text-[#32c753]">Cleaning Services</span>
            </h1>
            <p className={`mt-5 max-w-xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Choose the service that matches your home or business needs. We provide
              reliable, high-quality cleaning with friendly support.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="rounded-lg bg-[#32c753] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2dae48]"
              >
                Get a Quote
              </Link>
              <Link
                to="/about"
                className={`rounded-lg border px-5 py-2.5 text-sm font-bold transition ${
                  darkMode
                    ? 'border-[#32c753] text-[#7ce892] hover:bg-[#32c753] hover:text-white'
                    : 'border-[#32c753] text-[#32c753] hover:bg-[#32c753] hover:text-white'
                }`}
              >
                About Us
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
            <img
              src={welcomeServiceImage}
              alt="Professional cleaning team"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = homeImage;
              }}
              className="h-[320px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <ServicesContent embedded darkMode={darkMode} useApiServices={isCustomerArea} />
    </div>
  );
};

export default ServicesPage;
