import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import logoImg from "@/assets/logo .png";

const Footer = () => {
  return (
    <footer className="gradient-primary text-primary-foreground">
      <div className="container-custom section-padding pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center mb-4 rounded-xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-white/30">
              <img src={logoImg} alt="Yash Industries" className="h-12 w-auto" />
            </div>
            <div className="flex items-center justify-center gap-3 text-primary-foreground">
              <a
                href="https://www.facebook.com/share/1aAsQiH5pe/"
                aria-label="Facebook"
                className="hover:opacity-80 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 320 512" className="w-4 h-4" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M279.14 288l14.22-92.66h-88.91V117.78c0-25.35 12.42-50.06 52.24-50.06H295V6.26S259.36 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
                  />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/yashindustriesbeed?igsh=MW5hbHd2dmJpZXh4Mw=="
                aria-label="Instagram"
                className="hover:opacity-80 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 448 512" className="w-4 h-4" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.2 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.5 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.9-26.9 26.9-14.9 0-26.9-12-26.9-26.9s12-26.9 26.9-26.9 26.9 12 26.9 26.9zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9S352.5 7.6 316.6 5.9C280.7 4.2 167.4 4.2 131.5 5.9 95.6 7.6 63.8 15.8 37.6 42.1S7.6 95.6 5.9 131.5C4.2 167.4 4.2 280.7 5.9 316.6c1.7 35.9 9.9 67.7 36.2 93.9s58 34.5 93.9 36.2c35.9 1.7 149.2 1.7 185.1 0 35.9-1.7 67.7-9.9 93.9-36.2s34.5-58 36.2-93.9c1.7-35.9 1.7-149.2 0-185.1zM398.8 388c-7.8 19.6-22.9 34.7-42.5 42.5-29.4 11.7-99.2 9-132.3 9s-102.9 2.6-132.3-9c-19.6-7.8-34.7-22.9-42.5-42.5-11.7-29.4-9-99.2-9-132.3s-2.6-102.9 9-132.3c7.8-19.6 22.9-34.7 42.5-42.5 29.4-11.7 99.2-9 132.3-9s102.9-2.6 132.3 9c19.6 7.8 34.7 22.9 42.5 42.5 11.7 29.4 9 99.2 9 132.3s2.6 102.9-9 132.3z"
                  />
                </svg>
              </a>
              <a
                href="https://x.com/YashIndustries9"
                aria-label="Twitter"
                className="hover:opacity-80 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 512 512" className="w-4 h-4" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M389.2 48h70.6L305.6 224.2 488 464H350.9L243.2 325.8 129.1 464H58.4l164.9-188.4L32 48h141.4l97.3 129.5L389.2 48z"
                  />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/vikas-tulshiram-tandale-53a999367/"
                aria-label="LinkedIn"
                className="hover:opacity-80 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 448 512" className="w-4 h-4" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.09 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-base mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Home", "About Us", "Products", "Gallery", "Contact"].map((label) => (
                <li key={label}>
                  <Link
                    to={
                      label === "Home"
                        ? "/"
                        : `/${label.toLowerCase().replace(" ", "-").replace("about-us", "about")}`
                    }
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-base mb-4">Products</h4>
            <ul className="space-y-2">
              {["Octagonal Pole", "Tubular Pole", "Conical Pole", "Decorative Pole", "High Mast Pole", "Street Light Pole"].map((name) => (
                <li key={name}>
                  <Link
                    to={`/products/${name.toLowerCase().replace(/ /g, "-")}`}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-base mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm opacity-80">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold text-primary-foreground">Office :</span>{" "}
                  Shop No.02, Sai Residency Near Natyagruh Canal Road Beed 431122
                  <br />
                  <span className="font-semibold text-primary-foreground">Plant/Company add:-</span>{" "}
                  Survey No. 73, Charhata Road, Palwan, Tq. and Dist. Beed .431122
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm opacity-80">
                <Phone className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <a href="tel:+919673064141" className="hover:opacity-100">+91 96730 64141</a>
                  <a href="tel:+919559434141" className="hover:opacity-100">+91 95594 34141</a>
                  <a href="tel:+919049874141" className="hover:opacity-100">+91 90498 74141</a>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm opacity-80">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:yashindustriesbeed@gmail.com" className="hover:opacity-100">yashindustriesbeed@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6 flex justify-center">
          <p className="text-center text-sm opacity-60">
            Copyright © 2026 All Rights Reserved By Yash Industries Designed By{" "}
            <a
              href="https://webakoof.com/"
              className="underline underline-offset-2 hover:opacity-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              Webakoof
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

