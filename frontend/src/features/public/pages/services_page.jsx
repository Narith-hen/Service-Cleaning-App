import { Link } from 'react-router-dom';
import ServicesContent from '../../../pages/public/ServicesPage';
import homeImage from '../../../assets/image.png';
import welcomeServiceImage from '../../../assets/WelcomeService.png';

const ServicesPage = () => {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-[#32c753]/12 to-white py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 md:grid-cols-2 md:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
              Welcome
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
              Explore Our <span className="text-[#32c753]">Cleaning Services</span>
            </h1>
            <p className="mt-5 max-w-xl text-slate-600">
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
                className="rounded-lg border border-[#32c753] px-5 py-2.5 text-sm font-bold text-[#32c753] transition hover:bg-[#32c753] hover:text-white"
              >
                About Us
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl shadow-xl">
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

      <ServicesContent embedded />
    </div>
  );
};

export default ServicesPage;
