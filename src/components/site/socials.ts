import { FaEnvelope, FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { SOCIAL_LINKS } from "@/lib/site";

// Social links with their icons (all open in a new tab), shared by the footer ("Follow us on") and the
// Contact page ("Easy Connect") so both always list the same ones.
export const SOCIALS = [
  { href: SOCIAL_LINKS.instagram, label: "Instagram", icon: FaInstagram },
  { href: SOCIAL_LINKS.tiktok, label: "TikTok", icon: FaTiktok },
  { href: SOCIAL_LINKS.facebook, label: "Facebook", icon: FaFacebookF },
  { href: SOCIAL_LINKS.email, label: "Email", icon: FaEnvelope },
  { href: SOCIAL_LINKS.whatsapp, label: "WhatsApp", icon: FaWhatsapp },
];
