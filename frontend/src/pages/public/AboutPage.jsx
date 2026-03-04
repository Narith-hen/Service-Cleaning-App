import Navbar from "../components/Navbar";

export default function AboutPage({ embedded = false }) {
  return (
    <div className="bg-gray-50 font-sans text-gray-800">
      {!embedded && <Navbar />}

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?auto=format&fit=crop&q=80&w=1000"
              alt="Cleaning Team"
              className="rounded-3xl shadow-xl"
            />
          </div>

          <div>
            <h2 className="text-4xl font-black mb-6">
              About <span className="text-[#32c753]">Somaet</span>
            </h2>

            <p className="text-gray-600 text-lg mb-4">
             Somaet has been delivering professional cleaning services
              for over 10 years. We specialize in residential and commercial
              cleaning solutions that create healthier and happier environments.
            </p>

            <p className="text-gray-600 mb-6">
              Our trained team uses eco-friendly products and modern equipment
              to ensure every space is spotless, sanitized, and fresh.
            </p>

            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#32c753] text-white rounded-full flex items-center justify-center text-xs font-bold">
                  OK
                </div>
                Experienced and Certified Team
              </li>

              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#32c753] text-white rounded-full flex items-center justify-center text-xs font-bold">
                  OK
                </div>
                Eco-Friendly Products
              </li>

              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#32c753] text-white rounded-full flex items-center justify-center text-xs font-bold">
                  OK
                </div>
                100% Satisfaction Guarantee
              </li>
            </ul>

            <button className="mt-8 bg-[#32c753] text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transition">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {!embedded && (
        <footer className="bg-gray-900 text-gray-400 text-center py-8 text-sm">
          (c) 2026 CleaningPro. All rights reserved.
        </footer>
      )}
    </div>
  );
}
