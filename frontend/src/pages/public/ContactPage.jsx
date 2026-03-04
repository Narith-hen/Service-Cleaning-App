import Navbar from "../components/Navbar";

const contactItems = [
  {
    label: "Phone",
    value: "+1 (555) 123-4567",
    detail: "Mon-Sun, 8:00 AM - 8:00 PM",
  },
  {
    label: "Email",
    value: "support@somaet.com",
    detail: "Fast response within 24 hours",
  },
  {
    label: "Office",
    value: "123 Cleaning Street",
    detail: "San Francisco, CA 94105",
  },
];

export default function ContactPage({ embedded = false }) {
  return (
    <div className="bg-slate-50 text-slate-800">
      {!embedded && <Navbar />}

      <section className="relative overflow-hidden bg-gradient-to-b from-[#32c753]/15 via-white to-white pb-20 pt-24">
        <div className="absolute -left-16 top-20 h-52 w-52 rounded-full bg-[#32c753]/15 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="inline-block rounded-full bg-[#32c753]/10 px-4 py-1 text-sm font-semibold text-[#2dae48]">
              Contact Somaet
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Let&apos;s Make Your Space Sparkle
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Tell us what you need and our team will get back to you quickly with the
              best cleaning plan for your home or business.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-2">
              {contactItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-[#2dae48]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </div>
              ))}

              <div className="rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                  Why Choose Us
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  <li>Professional and vetted cleaners</li>
                  <li>Flexible scheduling options</li>
                  <li>Eco-friendly cleaning products</li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
                <h3 className="text-2xl font-extrabold text-slate-900">Send Us a Message</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Fill in the form and we will contact you shortly.
                </p>

                <form className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="First name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#32c753] focus:bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#32c753] focus:bg-white"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#32c753] focus:bg-white"
                  />

                  <input
                    type="text"
                    placeholder="Subject"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#32c753] focus:bg-white"
                  />

                  <textarea
                    placeholder="Your message"
                    rows="5"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#32c753] focus:bg-white"
                  ></textarea>

                  <button className="w-full rounded-xl bg-[#32c753] py-3 font-bold text-white transition hover:bg-[#2dae48]">
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
