
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import api from "../../services/api";
import homeImage from "../../assets/Homes .png";
import DeepImage from "../../assets/Deep.png";
import ConditioningImage from "../../assets/co.png";
import CarpetImage from "../../assets/Carpet.png";
import FloorImage from "../../assets/Floor Buffing.png";
import officeImage from "../../assets/office.png";
import windowImage from "../../assets/window.png";
import moveImage from "../../assets/move.png";
import shopImage from "../../assets/shop.png";
import proImage from "../../assets/pro.png";

const fallbackServices = [
  {
    id: "fallback-1",
    title: " Homes & Offices",
    description: "Our regular cleaning services keep your space looking its best, week in and week out. Whether it’s your home, office, or commercial site, we deliver a dependable, high-standard clean that saves you time and stress - without cutting corners. Tailored to your schedule - weekly, fortnightly, or monthly Same trusted team for every visit Fully insured and background-checked cleaners Affordable, reliable, and thorough",
    image: homeImage,
    status: "active",
  },
  {
    id: "fallback-2",
    title: "Homes & Businesses",
    description: "Our deep cleaning service goes far beyond surface-level tidying. We target the grime, bacteria, and buildup that regular cleaning leaves behind delivering a thorough, top-to-bottom reset for your space. Ideal for move-ins, end-of-lease, post-renovation, or periodic hygiene overhauls. Floor-to-ceiling cleaning of all rooms and surfaces Disinfection of high-touch points and hidden zones Professional-grade tools and non-toxic solutions Trusted by homeowners, tenants, landlords, and businesses a cleaner workspace that helps your team stay focused and productive.",
    image: DeepImage,
    status: "active",
  },
  {
    id: "fallback-3",
    title: "Air Conditioning Cleaning",
    description: "Dusty filters and mouldy ducts don’t just affect your air con’s performance; they impact your health. Our professional air conditioning cleaning services remove hidden contaminants, boost energy efficiency, and improve air quality in your home or workplace. Reduces allergens, mould spores, and odours Lowers energy bills by improving system efficiency Extends the life of your unit Keeps your air fresh, healthy, and breathable",
    image: ConditioningImage,
    status: "active",
  },
  {
    id: "fallback-4",
    title: "Carpet Cleaning ",
    description: "Tired of dirty, stained, or smelly carpets? Our professional carpet cleaning service gives your floors a complete refresh. We use hot water extraction and high-powered vacuums to pull out years of dirt, dust, and bacteria - without leaving them soaked or damaged. Eco-friendly, non-toxic chemicals Quick drying times (2–4 hours average) Safe for kids, pets, and allergy sufferers Affordable rates and fixed quotes move-in and move-out service to leave every room spotless and ready.",
    image: CarpetImage,
    status: "active",
  },
  {
    id: "fallback-5",
    title: "Floor Buffing ",
    description: "Shop We provide expert floor buffing and pressure washing services that leave your spaces looking polished, professional, and deeply clean. Whether it’s commercial flooring that needs a high-gloss finish or outdoor surfaces covered in grime, we’ve got the equipment and expertise to get it done right. - Industrial-grade equipment for superior shine and grime removal - Experienced professionals trained in surface-specific care - Suitable for tile, concrete, stone, vinyl, and more - Safe, eco-friendly products and methods is the process of removing dust, dirt, and trash from a shop to keep the environment clean and organized.make you happy",
    image: FloorImage,
    status: "active",
  },
 
];

const fallbackImages = [homeImage, officeImage, windowImage, moveImage, shopImage, proImage];
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const apiHost = rawApiBaseUrl.endsWith("/api") ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) return imageUrl;
  return `${apiHost}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};

const truncateWords = (text, wordLimit = 25) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};

const mapServiceFromApi = (item, index) => ({
  id: String(item?.service_id || item?.id || `${item?.name || "service"}-${index}`),
  title: String(item?.name || "Untitled Service"),
  description: String(item?.description || "Professional cleaning service."),
  image: toAbsoluteImageUrl(item?.images?.[0]?.image_url || item?.image || "") || fallbackImages[index % fallbackImages.length],
  status: String(item?.status || "active").toLowerCase(),
});

export default function ServicesPage({ embedded = false, darkMode = false, useApiServices = false }) {
  const [services, setServices] = useState(fallbackServices);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      if (!useApiServices) {
        setServices(fallbackServices);
        setServicesError("");
        setIsLoadingServices(false);
        return;
      }

      setIsLoadingServices(true);
      setServicesError("");

      try {
        const response = await api.get("/services", { params: { page: 1, limit: 200 } });
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        const mappedRows = rows.map(mapServiceFromApi);

        if (!isMounted) return;
        setServices(mappedRows);
      } catch (error) {
        if (!isMounted) return;
        setServices([]);
        setServicesError(error?.response?.data?.message || "Could not load services from database.");
      } finally {
        if (isMounted) setIsLoadingServices(false);
      }
    };

    loadServices();
    return () => {
      isMounted = false;
    };
  }, [useApiServices]);

  const bookServicePath = useApiServices ? "/customer/bookings" : "/auth/register";
  const orderedServices = useMemo(() => {
    const activeServices = [];
    const inactiveServices = [];

    services.forEach((service) => {
      if (service.status === "inactive") {
        inactiveServices.push(service);
      } else {
        activeServices.push(service);
      }
    });

    return [...activeServices, ...inactiveServices];
  }, [services]);

  return (
    <div className={darkMode ? "bg-[#0b1220] text-slate-100" : "bg-[#f2f4f3] text-slate-800"}>
      {!embedded && <Navbar />}

      <div className="max-w-6xl mx-auto pt-20 pb-24 px-6">
        <h2 className={`text-4xl font-black text-center mb-1 ${darkMode ? "text-slate-100" : "text-slate-900"}`} style={{ fontSize: '32px', color: '#008000', fontWeight: 600, letterSpacing: '0.02em'
        }}>
          OUR SERVICES
        </h2>
        <p className={`mx-auto mb-5 max-w-2xl text-center leading-relaxed ${darkMode ? "text-slate-300" : "text-gray-500"}`}>
          Professional cleaning packages with modern service quality. Hover cards to preview
          the interactive layout.
        </p>

        {isLoadingServices ? (
          <div className={`mx-auto max-w-2xl text-center ${darkMode ? "text-slate-300" : "text-gray-500"}`}>
            Loading services...
          </div>
        ) : orderedServices.length === 0 ? (
          <div className={`mx-auto max-w-3xl text-center ${darkMode ? "text-slate-300" : "text-gray-500"}`}>
            {servicesError || "No services available right now."}
          </div>
        ) : (
          <div className="mt-2 grid md:grid-cols-3 gap-8 lg:gap-10">
            {orderedServices.map((service) => {
              const isInactive = service.status === "inactive";
              const statusText = isInactive ? "Inactive" : "Active";
              const statusBadgeClass = isInactive ? "bg-[#ef4444]" : "bg-[#22c55e]";

              return (
                <div
                  key={service.id}
                  className={`group relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl ${
                    darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
                    
                    {/* Status Badge */}
                    <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white ${statusBadgeClass} shadow-lg`}>
                      {statusText}
                    </span>
                    
                    {/* Service Icon Overlay */}
                    <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <h3 className={`mb-3 text-xl font-extrabold transition-colors duration-300 group-hover:text-[#32c753] ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                      {service.title}
                    </h3>
                    <div className={`mb-6 h-1 w-12 rounded-full bg-[#32c753] transition-all duration-300 group-hover:w-20`} />
                    <p className={`mb-6 line-clamp-3 leading-relaxed ${darkMode ? "text-slate-300" : "text-gray-500"}`}>
                      {truncateWords(service.description, 25)}
                    </p>
                    <div className="flex items-center justify-center">
                      <Link
                        to={bookServicePath}
                        state={{
                          service: {
                            service_id: service.id,
                            id: service.id,
                            title: service.title,
                            name: service.title,
                            description: service.description,
                            image: service.image
                          }
                        }}
                        className={`inline-flex items-center gap-2 rounded-[24px] border border-[#32c753] px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#32c753] hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32c753]/40 ${
                          darkMode ? "text-[#7ce892]" : "text-[#32c753]"
                        }`}
                      >
                        <span>Book Now</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


