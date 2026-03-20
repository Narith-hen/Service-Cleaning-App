import { useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import homeImage from '../../../assets/image.png';
import ctaBgImage from '../../../assets/WelcomeService.png';
import narithImage from '../../../assets/narith.png';
import meyImage from '../../../assets/mey.JPG';
import molikaImage from '../../../assets/molika.png';
import '../../../styles/public/home.scss';

export default function PublicHomePage() {
  const { darkMode = false } = useOutletContext() || {};

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elements = document.querySelectorAll('.public-home-reveal');

    if (prefersReducedMotion) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      quote:
        '"Somaet saved my weekend! I was overwhelmed with work and my apartment was a mess."',
      name: 'Hen Narith',
      role: 'Homeowner in Seattle',
      date: 'Feb 20, 2026',
      rating: '4.9',
      image: narithImage
    },
    {
      quote:
        '"The cleaners are so professional and detailed. They even got the pet hair out of my carpets."',
      name: 'Lon Molika',
      role: 'Regular Customer',
      date: 'Jan 31, 2026',
      rating: '4.8',
      image: molikaImage
    },
    {
      quote:
        '"I used them for a move-out clean and got my full security deposit back without stress."',
      name: 'Van sievmey',
      role: 'New Resident',
      date: 'Jan 17, 2026',
      rating: '5.0',
      image: meyImage
    }
  ];

  const processSteps = [
    {
      number: '1',
      title: 'Book Online',
      description: 'Choose your service, date, and time that fits your busy schedule.'
    },
    {
      number: '2',
      title: 'We Clean',
      description: 'Our certified professionals arrive and make your home sparkle.'
    },
    {
      number: '3',
      title: 'Enjoy Life',
      description: 'Step into a fresh, clean home and spend your time on what matters.'
    }
  ];

  return (
    <div className={`public-home-page ${darkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-white text-gray-800'} font-sans`}>
      <section id="home" className={darkMode ? 'bg-[#111b2f]' : 'bg-[#f2f4f3]'}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:px-10 lg:px-16">
          <div className="public-home-reveal max-w-xl text-left">
            <p className={`public-home-kicker text-2xs font-bold uppercase tracking-[0.25em] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Professional Cleaning
            </p>
            <h1 className={`public-home-title mt-3 text-5xl font-black leading-[0.95] md:text-6xl ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Professional <br />
              Cleaning for a <br />
              <span className="text-[#32c753]">Spotless Home</span>
            </h1>
            <p className={`mt-6 text-base leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
              Experience the joy of a pristine living space with our eco-friendly, expert
              cleaning services tailored to your specific needs.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth/register"
                className="public-home-primary-link rounded-xl bg-[#32c753] px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-[#2dae48]"
                style={{ borderRadius: '24px' }}
              >
                Book Now
              </Link>
            </div>

            <div className={`mt-7 flex items-center gap-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
              <div className="flex -space-x-2">
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffb38b]" />
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffd1b8]" />
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffe7da]" />
              </div>
              <p>Trusted by 2,000+ local homeowners</p>
            </div>
          </div>

          <div className="public-home-reveal public-home-delay-1 relative">
            <div className="public-home-media-card overflow-hidden rounded-3xl bg-[#d9dfd0] p-2 shadow-2xl">
              <img
                src={homeImage}
                alt="Professional cleaning team"
                className="public-home-media-image h-[340px] w-full rounded-2xl object-cover md:h-[420px]"
              />
            </div>
            <div className={`public-home-floating-card absolute -bottom-5 left-5 rounded-2xl px-4 py-3 shadow-xl ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#32c753]/15 text-[#32c753]">
                  OK
                </span>
                <div>
                  <p className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>100% Satisfaction</p>
                  <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Money-back guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`public-home-reveal public-home-delay-1 py-20 ${darkMode ? 'bg-[#111b2f]' : 'bg-[#f2f4f3]'}`}>
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#32c753]">
              Process
            </p>
            <h2 className={`mt-3 text-4xl font-black md:text-5xl ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Clean Home in 3 Simple Steps
            </h2>
          </div>

          <div className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-20 lg:gap-24">
            <div className="absolute left-1/2 top-7 hidden h-px w-[60%] -translate-x-1/2 bg-slate-200 md:block" />

            {processSteps.map((step, index) => (
              <article
                key={step.number}
                className="public-home-reveal public-home-process-card relative px-3 text-center"
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#32c753] text-2xl font-black text-white shadow-lg">
                  {step.number}
                </div>
                <h3 className={`mt-10 text-2xl font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{step.title}</h3>
                <p className={`mx-auto mt-3 max-w-xs ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`public-home-reveal public-home-delay-2 py-24 ${darkMode ? 'bg-[#0f1a2b]' : 'bg-[#f9fafb]'}`}>
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="mb-12 flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#32c753]">
                Testimonials
              </p>
              <h2 className={`mt-3 text-4xl font-extrabold md:text-5xl ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                What Our Customers Are Saying
              </h2>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <article
                key={item.name}
                className={`public-home-reveal public-home-testimonial-card relative flex h-full flex-col rounded-3xl border p-6 transition hover:shadow-xl ${
                  darkMode
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-slate-200 bg-white text-slate-900 shadow-lg'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-2 text-base font-bold">
                  <span className="text-yellow-500">{"\u2605"}</span>
                  <span className={darkMode ? 'text-indigo-300' : 'text-indigo-600'}>{item.rating}</span>
                </div>
                <p className={`mt-5 text-lg leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {item.quote}
                </p>
                <div className={`mt-6 border-t pt-5 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = homeImage;
                        }}
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d39a6f] text-sm font-bold text-white">
                        {item.name?.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0 text-left">
                      <p className="font-extrabold">{item.name}</p>
                      <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{item.role}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div
            className="public-home-reveal public-home-delay-3 public-home-cta relative mx-auto mt-20 max-w-5xl overflow-hidden rounded-[50px] bg-cover bg-center px-12 py-20 text-center text-white shadow-2xl"
            style={{
              backgroundImage: `linear-gradient(rgba(9, 22, 37, 0.72), rgba(15, 38, 28, 0.72)), url(${ctaBgImage})`
            }}
          >
            <h3 className="text-4xl font-extrabold tracking-tight drop-shadow-lg md:text-5xl">
              Ready to Come Home to a Clean House?
            </h3>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-emerald-100 md:text-xl">
              Join thousands of happy customers and book your first cleaning today. Experience a spotless home with ease.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <Link
                to="/auth/register"
                className="public-home-cta-button public-home-cta-button-primary relative inline-block rounded-3xl bg-[#008000] px-10 py-4 text-base font-extrabold text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:brightness-110 hover:shadow-2xl md:text-lg"
              >
                Book Now
              </Link>

              <Link
                to="/contact"
                className="public-home-cta-button public-home-cta-button-secondary rounded-3xl bg-white/20 px-10 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/30 hover:scale-105 hover:shadow-lg md:text-lg"
              >
                Contact Sales
              </Link>
            </div>

            <div className="public-home-cta-glow absolute -bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#32ff1a]/20 blur-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
