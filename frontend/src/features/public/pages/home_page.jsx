import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import homeImage from '../../../assets/image.png';
import narithImage from '../../../assets/narith.png';
import meyImage from '../../../assets/mey.JPG';
import molikaImage from '../../../assets/molika.png';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function PublicHomePage() {
  const { darkMode = false } = useOutletContext() || {};
  const [motionReady, setMotionReady] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const elements = document.querySelectorAll('.public-home-reveal');
    if (!elements.length) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      setMotionReady(false);
      return undefined;
    }

    try {
      const initialVisibleRect = window.innerHeight * 0.7;
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < initialVisibleRect && rect.bottom > 0) {
          element.classList.add('is-visible');
        }
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -8% 0px'
        }
      );

      elements.forEach((element) => {
        if (!element.classList.contains('is-visible')) {
          observer.observe(element);
        }
      });

      setMotionReady(true);

      return () => observer.disconnect();
    } catch (error) {
      console.error('Failed to initialize public home motion:', error);
      elements.forEach((element) => element.classList.add('is-visible'));
      setMotionReady(false);
      return undefined;
    }
  }, []);

  const testimonials = [
    {
      name: 'Hen Narith',
      role: 'Homeowner in Seattle',
      image: narithImage,
      quote:
        '"Somaet saved my weekend! I was overwhelmed with work and my apartment was a mess."'
    },
    {
      quote:
        '"The cleaners are so professional and detailed. They even got the pet hair out of my carpets."',
      name: 'Michael Chen',
      role: 'Regular Customer',
      image: molikaImage
    },
    {
      quote:
        '"I used them for a move-out clean and got my full security deposit back without stress."',
      name: 'Emma Thompson',
      role: 'New Resident',
      image: meyImage
    }
  ];

  const processSteps = [
    {
      number: '1',
      title: 'Book a Service',
      description: 'Choose your service, date, and time that fits your busy schedule.'
    },
    {
      number: '2',
      title: 'Cleaning Process',
      description: 'Our certified professional arrives and makes your home sparkle.'
    },
    {
      number: '3',
      title: 'Enjoy a Spotless Space',
      description: 'Step into a fresh, clean home and spend your time on what matters.'
    }
  ];

  const faqItems = [
    {
      question: 'What cleaning services do you offer?',
      answer:
        'We provide home cleaning, office cleaning, deep cleaning, move-in or move-out cleaning, and shop cleaning services.'
    },
    {
      question: 'Do you bring your own cleaning supplies?',
      answer:
        'Yes. Our cleaners arrive with standard supplies and equipment, so you do not need to prepare anything unless you prefer specific products.'
    },
    {
      question: 'Do I need to stay at home during the service?',
      answer:
        'No. Many customers give access instructions in advance, but you can stay if you prefer to be present while the cleaning is done.'
    },
    {
      question: 'How can I reschedule or cancel a booking?',
      answer:
        'You can manage your booking from your account dashboard or contact our support team if you need help changing the date and time.'
    },
    {
      question: 'How fast can I book a cleaning appointment?',
      answer:
        'You can book online in a few minutes, and available time slots depend on your location, service type, and cleaner availability.'
    }
  ];

  return (
    <div className={`public-home-page ${motionReady ? 'public-home-motion-ready' : ''} ${darkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-white text-gray-800'} font-sans`}>
      <section id="home" className={darkMode ? 'bg-[#111b2f]' : 'bg-[#f2f4f3]'}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:px-10 lg:px-16">
          <div className="public-home-reveal max-w-xl text-left">
            <motion.p
              variants={fadeUpVariant}
              className={`public-home-kicker text-2xs font-bold uppercase tracking-[0.25em] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
            >
              Professional Cleaning
            </motion.p>
            <motion.h1
              variants={fadeUpVariant}
              className={`mt-3 text-5xl font-black leading-[0.95] md:text-6xl ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
            >
              Professional <br />
              Cleaning for a <br />
              <span className="text-[#32c753]">Spotless Home</span>
            </motion.h1>

            <motion.p
              variants={fadeUpVariant}
              className={`mt-6 text-base leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}
            >
              Experience the joy of a pristine living space with our eco-friendly, expert
              cleaning services tailored to your specific needs.
            </motion.p>

            <motion.div variants={fadeUpVariant} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth/register"
                className="inline-flex rounded-xl bg-[#32c753] px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-[#2dae48] hover:shadow-lg"
              >
                Book Your Clean Now
              </Link>
              <Link
                to="/about"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                See How It Works
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUpVariant}
              className={`mt-7 flex items-center gap-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <div className="flex -space-x-2">
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffb38b]" />
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffd1b8]" />
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffe7da]" />
              </div>
              <p>Trusted by 2,000+ local homeowners</p>
            </motion.div>
          </div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="overflow-hidden rounded-3xl bg-[#d9dfd0] p-2 shadow-2xl">
              <img
                src={homeImage}
                alt="Cleaning"
                className="h-[340px] w-full rounded-2xl object-cover md:h-[420px]"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-5 left-5 rounded-2xl bg-white px-4 py-3 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#32c753]/15 text-[#32c753]">
                  OK
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">100% Satisfaction</p>
                  <p className="text-xs text-slate-500">Money-back guarantee</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f2f4f3] py-20">
        <div className="mx-auto max-w-7xl px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#32c753]">
              Process
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">
              Clean Home in 3 Simple Steps
            </h2>
          </motion.div>

          <motion.div
            className="relative mt-14 grid gap-12 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {processSteps.map((step, index) => (
              <motion.article
                key={step.number}
                variants={fadeUpVariant}
                className="relative text-center"
              >
                {index < processSteps.length - 1 && (
                  <div className="absolute left-[68%] top-[44px] hidden items-center gap-2 md:flex lg:left-[72%]">
                    <div className="h-px w-12 bg-[#9be06f]" />
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-5 w-5 text-[#76cf65]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </div>
                )}

                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#cfeec4] bg-[radial-gradient(circle_at_35%_30%,#f5fff1_0%,#ebf9e4_58%,#dff1d7_100%)] shadow-[inset_0_0_0_10px_rgba(255,255,255,0.5)]">
                  <span className="text-[34px] font-black leading-none text-[#1f9a29]">
                    {step.number}
                  </span>
                </div>
                <h3 className="mx-auto mt-5 max-w-[16rem] text-[clamp(1.9rem,2.7vw,2.7rem)] font-black leading-[1.02] text-slate-900">
                  {step.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-slate-500">
                  {step.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f2f4f3] py-20">
        <div className="mx-auto max-w-7xl px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#32c753]">
                Testimonials
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-900">
                What Our Customers Are Saying
              </h2>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <button className="h-10 w-10 rounded-full border border-slate-300 text-slate-500">
                {'<'}
              </button>
              <button className="h-10 w-10 rounded-full border border-slate-300 text-slate-500">
                {'>'}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {testimonials.map((item) => (
              <motion.article key={item.name} variants={fadeUpVariant} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-[#32c753]/30"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = homeImage;
                      }}
                    />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d39a6f] text-xl font-bold text-white">
                      {item.name?.charAt(0)}
                    </span>
                  )}
                  <div className="text-left">
                    <p className="font-extrabold text-slate-900">{item.name}</p>
                    <p className="text-2xl font-extrabold tracking-wider text-[#f4b400]">*****</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-slate-600">{item.quote}</p>
              </motion.article>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mx-auto mt-14 max-w-5xl rounded-[28px] bg-gradient-to-r from-[#146f27] via-[#128227] to-[#0b1f3c] px-8 py-12 text-center text-white shadow-2xl"
          >
            <h3 className="text-4xl font-black">Ready to Come Home to a Clean House?</h3>
            <p className="mt-3 text-sm text-emerald-100">
              Join thousands of happy customers and book your first cleaning today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth/register"
                className="rounded-xl bg-[#008000] px-6 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(0,128,0,0.45)] transition hover:brightness-95"
              >
                Book Now - 20% Off First Clean
              </Link>
              <Link
                to="/contact"
                className="rounded-xl bg-white/15 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/25"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

        <section className="bg-[#f2f4f3] py-20">
              <div className="mx-auto max-w-4xl px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#32c753]">
                    FAQ
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">
                    Frequently Asked Questions
                  </h2>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                    Everything customers usually ask before booking a cleaning service with us.
                  </p>
                </motion.div>
      
                <motion.div
                  className="mt-12 space-y-4"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                >
                  {faqItems.map((item, index) => {
                    const isOpen = openFaqIndex === index;
      
                    return (
                      <motion.article
                        key={item.question}
                        variants={fadeUpVariant}
                        className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                          isOpen
                            ? "border-[#9be06f] shadow-[0_20px_50px_rgba(50,199,83,0.12)]"
                            : "border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                          className="flex min-h-[72px] w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
                        >
                          <span className="text-base font-semibold text-slate-900">
                            {item.question}
                          </span>
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.25"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 px-5 pb-4 pt-2">
                            <p className="max-w-3xl text-sm leading-6 text-slate-500">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </motion.article>
                    );
                  })}
                </motion.div>
              </div>
            </section>
    </div>
  );
}
