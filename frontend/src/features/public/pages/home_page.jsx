import { Link, useOutletContext } from 'react-router-dom';
import homeImage from '../../../assets/image.png';
import narithImage from '../../../assets/narith.png';
import meyImage from '../../../assets/mey.JPG';
import molikaImage from '../../../assets/molika.png';


export default function PublicHomePage() {
  const { darkMode = false } = useOutletContext() || {};
  const testimonials = [
    {
      quote:
        '"PureClean saved my weekend! I was overwhelmed with work and my apartment was a mess."',
      name: 'Hen Narith',
      role: 'Homeowner in Seattle',
      image: narithImage
    },
    {
      quote:
        '"The cleaners are so professional and detailed. They even got the pet hair out of my carpets."',
      name: 'Lon Molika',
      role: 'Regular Customer',
      image: molikaImage
    },
    {
      quote:
        '"I used them for a move-out clean and got my full security deposit back without stress."',
      name: 'Van sievmey',
      role: 'New Resident',
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
      description: 'Our certified professional arrives and makes your home sparkle.'
    },
    {
      number: '3',
      title: 'Enjoy Life',
      description: 'Step into a fresh, clean home and spend your time on what matters.'
    }
  ];

  return (
    <div className={`${darkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-white text-gray-800'} font-sans`}>
      <section id="home" className={darkMode ? 'bg-[#111b2f]' : 'bg-[#f2f4f3]'}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:px-10 lg:px-16">
          <div className="max-w-xl text-left">
            <p className={`text-2xs font-bold uppercase tracking-[0.25em] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Professional Cleaning
            </p>
            <h1 className={`mt-3 text-5xl font-black leading-[0.95] md:text-6xl ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
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
                className="rounded-xl bg-[#32c753] px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-[#2dae48]"
              >
                Book Your Clean Now
              </Link>
              <Link
                to="/about"
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${darkMode ? 'border-slate-600 bg-slate-800 text-[#008000]' : 'border-slate-200 bg-white text-[#008000]'}`}
                style={{ color: '#008000' }}
              >
                See How It Works
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

          <div className="relative">
            <div className="overflow-hidden rounded-3xl bg-[#d9dfd0] p-2 shadow-2xl">
              <img
                src={homeImage}
                alt="Professional cleaning team"
                className="h-[340px] w-full rounded-2xl object-cover md:h-[420px]"
              />
            </div>
            <div className={`absolute -bottom-5 left-5 rounded-2xl px-4 py-3 shadow-xl ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
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

      <section className={`py-20 ${darkMode ? 'bg-[#111b2f]' : 'bg-[#f2f4f3]'}`}>
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#32c753]">
              Process
            </p>
            <h2 className={`mt-3 text-4xl font-black md:text-5xl ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
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
                <h3 className={`mt-6 text-2xl font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{step.title}</h3>
                <p className={`mx-auto mt-3 max-w-xs ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

     <section className={`py-24 ${darkMode ? 'bg-[#0f1a2b]' : 'bg-[#f9fafb]'}`}>
  <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
    {/* Header */}
    <div className="mb-12 flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#32c753]">
          Testimonials
        </p>
        <h2 className={`mt-3 text-4xl md:text-5xl font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          What Our Customers Are Saying
        </h2>
      </div>
    </div>

    {/* Testimonials Grid */}
    <div className="grid gap-8 md:grid-cols-3">
      {testimonials.map((item) => (
        <article
          key={item.name}
          className={`relative rounded-2xl p-6 shadow-lg transition hover:shadow-2xl ${
            darkMode ? 'bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-800 text-slate-100' : 'bg-white'
          }`}
        >
          <div className="mb-5 flex items-center gap-4">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#32c753]/40"
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
            <div>
              <p className="font-extrabold">{item.name}</p>
              <p className="text-xs text-slate-400">{item.role}</p>
            </div>
          </div>
          <p className="mt-3 text-sm md:text-base leading-relaxed">{item.quote}</p>
          <div className="mt-5 flex gap-1">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl">★</span>
              ))}
          </div>
        </article>
      ))}
    </div>

    Call to Action
   <div className="mx-auto mt-20 max-w-5xl rounded-[50px] bg-gradient-to-tr from-[#1c3a22] via-[#32c753] to-[#0b1f3c] px-12 py-20 text-center text-white shadow-2xl relative overflow-hidden">
  {/* Decorative Gradient Overlay */}
  <div className="absolute inset-0 -z-10 rounded-[50px] bg-gradient-to-tr from-[#32ff1a]/15 via-[#0b1f3c]/25 to-[#146f27]/15"></div>

  {/* Heading */}
  <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
    Ready to Come Home to Clean?
  </h3>

  {/* Subtitle */}
  <p className="mt-5 text-lg md:text-xl text-emerald-100 max-w-3xl mx-auto leading-relaxed">
    Join thousands of happy customers and book your first cleaning today. Experience a spotless home with ease.
  </p>

  {/* Buttons */}
  <div className="mt-12 flex flex-wrap justify-center gap-6">
    {/* Primary Button */}
    <Link
      to="/auth/register"
      className="relative inline-block rounded-3xl bg-gradient-to-r from-[#32ff1a] to-[#28cc1a] px-10 py-4 text-base md:text-lg font-extrabold text-[#114a1b] shadow-lg transition-transform duration-300 hover:scale-105 hover:brightness-110 hover:shadow-2xl"
    >
      Book Now - 20% Off First Clean
    </Link>

    {/* Secondary Button */}
    <Link
      to="/contact"
      className="rounded-3xl bg-white/20 px-10 py-4 text-base md:text-lg font-bold text-white backdrop-blur-sm transition hover:bg-white/30 hover:scale-105 hover:shadow-lg"
    >
      Contact Sales
    </Link>
  </div>

  {/* Subtle Glow Effect */}
  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#32ff1a]/20 rounded-full blur-3xl animate-pulse-slow"></div>
</div>
  </div>
</section>
    </div>
  );
}



