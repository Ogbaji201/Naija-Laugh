import {
  siX,
  siFacebook,
  siInstagram,
  siYoutube,
} from "simple-icons";

type BrandIconProps = {
  icon: typeof siX;
};

function BrandIcon({ icon }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="brand-icon"
    >
      <path d={icon.path} />
    </svg>
  );
}

export default function SocialIcons() {
  return (
    <div className="header-socials">

      <a
        href="#"
        aria-label="X"
        className="social-link"
      >
        <BrandIcon icon={siX} />
      </a>

      <a
        href="#"
        aria-label="Facebook"
        className="social-link"
      >
        <BrandIcon icon={siFacebook} />
      </a>

      <a
        href="#"
        aria-label="Instagram"
        className="social-link"
      >
        <BrandIcon icon={siInstagram} />
      </a>

      <a
        href="#"
        aria-label="YouTube"
        className="social-link"
      >
        <BrandIcon icon={siYoutube} />
      </a>

      <a
        href="#subscribe"
        className="subscribe-btn"
      >
        🔔 Subscribe
      </a>

    </div>
  );
}