import { useOutletContext } from "react-router-dom";

const contactItems = [
  {
    label: "Email",
    value: "support@somaet.com",
    detail: "Fast response within 24 hours",
  },
  // {
  //   label: "Office",
  //   value: "123 Cleaning Street",
  //   detail: "San Francisco, CA 94105",
  // },
];

export default function ContactPage({ embedded = false }) {
  const { darkMode = false } = useOutletContext() || {};
  return (
    <div className={`${darkMode ? "bg-[#0b1220] text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      <section
        className={`relative overflow-hidden pb-20 pt-24 ${
          darkMode
            ? "bg-gradient-to-b from-[#10233c] via-[#111b2f] to-[#0b1220]"
            : "bg-gradient-to-b from-[#32c753]/15 via-white to-white"
        }`}
      >
        <div className="absolute -left-16 top-20 h-52 w-52 rounded-full bg-[#32c753]/15 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="inline-block rounded-full bg-[#32c753]/10 px-4 py-1 text-sm font-semibold text-[#2dae48]">
              Contact Somaet
            </p>
            <h2 className={`mt-4 text-4xl font-black tracking-tight md:text-5xl ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
              Let&apos;s Make Your Space Sparkle
            </h2>
            <p className={`mx-auto mt-4 max-w-2xl ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              Tell us what you need and our team will get back to you quickly with the
              best cleaning plan for your home or business.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-2">
              {contactItems.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-5 shadow-sm ${
                    darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-[#2dae48]">
                    {item.label}
                  </p>
                  <p className={`mt-1 text-lg font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{item.value}</p>
                  <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{item.detail}</p>
                </div>
              ))}

              {/* <div className="rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                  Why Choose Us
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  <li>Professional and vetted cleaners</li>
                  <li>Flexible scheduling options</li>
                  <li>Eco-friendly cleaning products</li>
                </ul>
              </div> */}
            </div>

            <div className="lg:col-span-3">
              <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] md:p-8 ${
                darkMode ? "border-slate-700 bg-slate-900" : "border-emerald-100 bg-white"
              }`}>
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#32c753]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-emerald-200/40 blur-3xl" />
                <h3 className={`relative text-2xl font-extrabold md:text-3xl ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                  Send Us a Message
                </h3>
                <p className={`relative mt-2 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Fill out the form and we will contact you shortly.
                </p>


                <form className="relative mt-10 space-y-6">

                    <div className="grid gap-6 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="First name"
                        className={`w-full rounded-xl border px-4 py-3 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#32c753] focus:ring-4 focus:ring-[#32c753]/15 ${
                          darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-800"
                        }`}
                      />

                      <input
                        type="text"
                        placeholder="Last name"
                        className={`w-full rounded-xl border px-4 py-3 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#32c753] focus:ring-4 focus:ring-[#32c753]/15 ${
                          darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-800"
                        }`}
                      />
                    </div>

                    <input
                      type="email"
                      placeholder="Email address"
                      className={`w-full rounded-xl border px-4 py-3 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#32c753] focus:ring-4 focus:ring-[#32c753]/15 ${
                        darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-800"
                      }`}
                    />

                    <input
                      type="text"
                      placeholder="Subject"
                      className={`w-full mt-4 rounded-xl border px-4 py-3 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#32c753] focus:ring-4 focus:ring-[#32c753]/15 ${
                        darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-800"
                      }`}
                    />

                    <textarea
                      placeholder="Your message"
                      rows="6"
                      className={`w-full mt-4 resize-none rounded-xl border px-4 py-3 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#32c753] focus:ring-4 focus:ring-[#32c753]/15 ${
                        darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-800"
                      }`}
                    ></textarea>

                    <button className="w-full mt-4 rounded-xl bg-gradient-to-r from-[#32c753] to-[#2dae48] py-3 font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                      Send Message
                    </button>

                  </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
