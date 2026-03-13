
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import api from "../../services/api";
import homeImage from "../../assets/home.png";
import officeImage from "../../assets/office.png";
import windowImage from "../../assets/window.png";
import shopImage from "../../assets/shop.png";
import moveImage from "../../assets/move.png";
import proImage from "../../assets/pro.png";

const fallbackServices = [
  {
    id: "fallback-1",
    title: "Home Cleaning",
    description: "Keep your home fresh and healthy with routine dust, stain, and floor care.",
    image: homeImage,
    status: "active",
  },
  {
    id: "fallback-2",
    title: "Office Cleaning",
    description: "Create a cleaner workspace that helps your team stay focused and productive.",
    image: officeImage,
    status: "active",
  },
  {
    id: "fallback-3",
    title: "Window Cleaning",
    description: "Window cleaning is the process of washing and wiping windows using water, cleaning liquid.",
    image: windowImage,
    status: "active",
  },
  {
    id: "fallback-4",
    title: "Move In/Out Cleaning",
    description: "Detailed move-in and move-out service to leave every room spotless and ready.",
    image: moveImage,
    status: "active",
  },
  {
    id: "fallback-5",
    title: "Shop Cleaning",
    description: "Shop cleaning is the process of removing dust, dirt, and trash from a shop to keep the environment clean and organized.make you happy",
    image: shopImage,
    status: "active",
  },
  {
    id: "fallback-6",
    title: "Post-Construction Cleaning",
    description: "Post-construction cleaning is a specialized deep cleaning service performed after building",
    image: proImage,
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
                    <div className="flex items-center justify-between">
                      <Link
                        to={bookServicePath}
                        state={{ service: { title: service.title, description: service.description, image: service.image } }}
                        className={`inline-flex items-center gap-2 rounded-lg border border-[#32c753] px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:bg-[#32c753] hover:text-white ${
                          darkMode ? "text-[#7ce892]" : "text-[#32c753]"
                        }`}
                      >
                        <span>Book Now</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                      <span className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                        View Details
                      </span>
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
