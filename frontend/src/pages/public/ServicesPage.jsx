
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import homeImage from "../../assets/home.png";
import officeImage from "../../assets/office.png";
import windowImage from "../../assets/window.png";
import shopImage from "../../assets/shop.png";
import moveImage from "../../assets/move.png";
import proImage from "../../assets/pro.png";

export default function ServicesPage({ embedded = false }) {
  const services = [
    {
      title: "Home Cleaning",
      description:
        "Keep your home fresh and healthy with routine dust, stain, and floor care.",
      image: homeImage
    },
    {
      title: "Office Cleaning",
      description:
        "Create a cleaner workspace that helps your team stay focused and productive.",
      image: officeImage
    },
    {
      title: "Window Cleaning",
      description:
        "Window cleaning is the process of washing and wiping windows using water, cleaning liquid.",
      image: windowImage
    },
    {
      title: "Move In/Out Cleaning",    
      description:
        "Detailed move-in and move-out service to leave every room spotless and ready.",
      image: moveImage
    },
    {
      title: "Shop Cleaning",
      description:
        "Shop cleaning is the process of removing dust, dirt, and trash from a shop to keep the environment clean and organized.make you happy",
      image: shopImage
    },
    {
      title: "Post-Construction Cleaning",
      description:
        "Post-construction cleaning is a specialized deep cleaning service performed after building",
      image: proImage
    }
  ];

  return (
    <div>
      {!embedded && <Navbar />}

      <div className="max-w-6xl mx-auto py-20 px-6">
        <h2 className="text-4xl font-black text-center mb-12">
          OUR SERVICES
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-gray-500">
          Professional cleaning packages with modern service quality. Hover cards to preview
          the interactive layout.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#32c753]/20"
            >
              <div className="relative overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute left-4 top-4 rounded-full bg-[#32c753] px-3 py-1 text-xs font-bold text-white">
                  0{index + 1}
                </span>
              </div>

              <div className="p-7">
                <h3 className="mb-3 text-xl font-extrabold text-slate-900 transition-colors duration-300 group-hover:text-[#32c753]">
                  {service.title}
                </h3>
                <p className="text-gray-500">{service.description}</p>
                <Link
                  to="/auth/register"
                  className="mt-6 inline-flex rounded-lg border border-[#32c753] px-4 py-2 text-sm font-bold text-[#32c753] transition-all duration-300 hover:bg-[#32c753] hover:text-white"
                >
                  Book Service
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
