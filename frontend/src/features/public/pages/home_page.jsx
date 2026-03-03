import { Link } from 'react-router-dom';
import homeImage from '../../../assets/image.png';

export default function PublicHomePage() {
  const testimonials = [
    {
      quote:
        '"PureClean saved my weekend! I was overwhelmed with work and my apartment was a mess."',
      name: 'Sarah Jenkins',
      role: 'Homeowner in Seattle'
    },
    {
      quote:
        '"The cleaners are so professional and detailed. They even got the pet hair out of my carpets."',
      name: 'Michael Chen',
      role: 'Regular Customer'
    },
    {
      quote:
        '"I used them for a move-out clean and got my full security deposit back without stress."',
      name: 'Emma Thompson',
      role: 'New Resident'
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
      description: 'Our certified professional arrives and makes your home sparkle.'
    },
    {
      number: '3',
      title: 'Enjoy Life',
      description: 'Step into a fresh, clean home and spend your time on what matters.'
    }
  ];

  const pageCards = [
    {
      title: 'Services',
      description: 'See all cleaning packages for home, office, windows, and shops.',
      to: '/services',
      cta: 'View Services'
    },
    {
      title: 'About Us',
      description: 'Learn about our team, values, and cleaning quality standards.',
      to: '/about',
      cta: 'Read About Us'
    },
    {
      title: 'Contact Us',
      description: 'Get in touch for questions, quotes, and booking support.',
      to: '/contact',
      cta: 'Contact Now'
    }
  ];

  return (
    <div className="bg-white font-sans text-gray-800">
      <section id="home" className="bg-[#f2f4f3]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:px-10 lg:px-16">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
              Professional Cleaning
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[0.95] text-slate-900 md:text-6xl">
              Professional <br />
              Cleaning for a <br />
              <span className="text-[#32c753]">Spotless Home</span>
            </h1>
            <p className="mt-6 text-base leading-7 text-slate-500">
              Experience the joy of a pristine living space with our eco-friendly, expert
              cleaning services tailored to your specific needs.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth/register"
                className="rounded-xl bg-[#32c753] px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-[#2dae48]"
              >
                Book Your Clean Now
              </Link>
              <Link
                to="/about"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                See How It Works
              </Link>
            </div>

            <div className="mt-7 flex items-center gap-3 text-sm text-slate-500">
              <div className="flex -space-x-2">
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffb38b]" />
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffd1b8]" />
                <span className="h-5 w-5 rounded-full border border-white bg-[#ffe7da]" />
              </div>
              <p>Trusted by 2,000+ local homeowners</p>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl bg-[#d9dfd0] p-2 shadow-2xl">
              <img
                src={homeImage}
                alt="Professional cleaning team"
                className="h-[340px] w-full rounded-2xl object-cover md:h-[420px]"
              />
            </div>
            <div className="absolute -bottom-5 left-5 rounded-2xl bg-white px-4 py-3 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#32c753]/15 text-[#32c753]">
                  OK
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">100% Satisfaction</p>
                  <p className="text-xs text-slate-500">Money-back guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f2f4f3] py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#32c753]">
              Process
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">
              Clean Home in 3 Simple Steps
            </h2>
          </div>

          <div className="relative mt-14 grid gap-10 md:grid-cols-3">
            <div className="absolute left-1/2 top-7 hidden h-px w-[60%] -translate-x-1/2 bg-slate-200 md:block" />

            {processSteps.map((step) => (
              <article key={step.number} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#32c753] text-2xl font-black text-white shadow-lg">
                  {step.number}
                </div>
                <h3 className="mt-6 text-2xl font-extrabold text-slate-900">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-slate-500">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f2f4f3] py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="mb-10 flex items-center justify-between gap-4">
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
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-bold tracking-wider text-[#f4b400]">*****</p>
                <p className="mt-4 text-slate-600">{item.quote}</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-[#d39a6f]" />
                  <div>
                    <p className="font-extrabold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-5xl rounded-[28px] bg-gradient-to-r from-[#146f27] via-[#128227] to-[#0b1f3c] px-8 py-12 text-center text-white shadow-2xl">
            <h3 className="text-4xl font-black">Ready to Come Home to Clean?</h3>
            <p className="mt-3 text-sm text-emerald-100">
              Join thousands of happy customers and book your first cleaning today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth/register"
                className="rounded-xl bg-[#32ff1a] px-6 py-3 text-sm font-black text-[#114a1b] shadow-[0_0_25px_rgba(50,255,26,0.45)] transition hover:brightness-95"
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
          </div>
        </div>
      </section>
    </div>
  );
}
