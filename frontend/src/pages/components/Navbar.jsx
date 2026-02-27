import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { href: "/#home", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  const isSectionActive = (href) => {
    if (location.pathname !== "/") return false;
    const section = href.split("#")[1];
    if (!section) return false;
    if (!location.hash && section === "home") return true;
    return location.hash === `#${section}`;
  };

  const linkClass = (isActive) =>
    `relative px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-full
    ${
      isActive
        ? "text-white bg-[#32c753] shadow-md"
        : "text-slate-600 hover:text-[#32c753] hover:bg-[#32c753]/10"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="brand-font inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[#32c753]"
        >
          <span className="text-4xl leading-none">✨</span><span>Somaet</span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {links.map((link) => {
            const isActive = isSectionActive(link.href);
            return (
              <a key={link.href} href={link.href} className={linkClass(isActive)}>
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-full text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#32c753] shadow-md hover:scale-105 transition-transform duration-300"
          >
            Register
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-lg border border-slate-200"
        >
          <div className="space-y-1">
            <span className="block w-5 h-0.5 bg-slate-700"></span>
            <span className="block w-5 h-0.5 bg-slate-700"></span>
            <span className="block w-5 h-0.5 bg-slate-700"></span>
          </div>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-6 py-4 shadow-lg animate-fadeIn">
          <div className="flex flex-col gap-2">
            {links.map((link) => {
              const isActive = isSectionActive(link.href);
              return (
                <a key={link.href} href={link.href} className={linkClass(isActive)}>
                  {link.label}
                </a>
              );
            })}

            <Link
              to="/login"
              className="mt-2 px-4 py-2 rounded-full border border-slate-300 text-center font-semibold text-slate-700"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 rounded-full text-center font-semibold text-white bg-[#32c753]"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}


