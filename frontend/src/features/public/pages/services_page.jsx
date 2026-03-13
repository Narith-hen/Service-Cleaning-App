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
      {isCustomerArea ? (
        <section
          className="relative isolate overflow-hidden py-16 md:py-24"
          style={{
            backgroundImage: `url(${welcomeServiceImage}), url(${homeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div
            className={`absolute inset-0 ${
              darkMode
                ? 'bg-gradient-to-r from-[#020817f2] via-[#0b1220d9] to-[#0b12208a]'
                : 'bg-gradient-to-r from-[#111827de] via-[#1f2937c9] to-[#11182778]'
            }`}
          />
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#0080004d] blur-3xl" />
          <div className="absolute right-6 top-20 h-44 w-44 rounded-full bg-[#38bdf84d] blur-3xl" />
          <div className="absolute bottom-10 right-20 h-36 w-36 rounded-full bg-[#22c55e33] blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 md:px-10">
            <div className="mx-auto max-w-3xl p-7 text-center md:p-10">
              <h1 className="mt-3 mb-3 text-4xl font-black leading-tight text-white md:text-5xl" style={{ fontSize: '48px', height: '50px' }}>
                Explore Our <span className="text-[#32c753]">Cleaning Services</span>
              </h1>
              <p className="mx-auto max-w-xl text-slate-100/95">
                Choose the service that matches your home or business needs. We provide
                reliable, high-quality cleaning with friendly support.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section
        >
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 md:grid-cols-2 md:px-10">
            <div>

              <h1 className={`mt-3 text-4xl font-black leading-tight md:text-5xl ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Explore Our <span className="text-[#008000]">Cleaning Services</span>
              </h1>
              <p className={`mt-5 max-w-xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Choose the service that matches your home or business needs. We provide
                reliable, high-quality cleaning with friendly support.
              </p>
            
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
      )}

      <ServicesContent embedded darkMode={darkMode} useApiServices />
    </div>
  );
};

export default ServicesPage;
