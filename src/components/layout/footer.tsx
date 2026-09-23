import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { BRAND } from "@/lib/constants";
import { BrandMark } from "@/components/layout/brand-mark";
import { SERVICE_NAV_GROUPS } from "@/lib/navigation";
import { NewsletterForm } from "./newsletter-form";
import { CookiePreferencesButton } from "@/components/consent/cookie-consent";

type FooterProps = { siteName?: string; siteLogo?: string; siteEmail?: string; sitePhone?: string; siteWhatsapp?: string; siteAddress?: string; siteTagline?: string };

export function Footer({ siteName = BRAND.name, siteLogo = "", siteEmail = BRAND.email, sitePhone = "+62 813-9300-5035", siteWhatsapp = BRAND.whatsapp, siteAddress = BRAND.address, siteTagline = BRAND.tagline }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white">
      {/* Newsletter Section */}
      <div className="border-b border-dark-700">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Dapatkan Update & Penawaran Terbaru
              </h3>
              <p className="mt-2 text-slate-300">
                Berlangganan newsletter kami untuk tips bisnis dan promo eksklusif
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex" aria-label={siteName}>
              <BrandMark siteLogo={siteLogo} siteName={siteName} tagline={siteTagline} logoClassName="h-12 w-12" className="[&>span:nth-child(2)>span:first-child]:text-white [&>span:nth-child(2)>span:last-child]:text-dark-400" />
            </Link>
            <p className="mt-4 max-w-sm text-dark-300">
              {BRAND.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${siteWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-dark-700 px-4 py-2 text-sm text-dark-200 transition-colors hover:bg-primary hover:text-white"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
              <a
                href={`mailto:${siteEmail}`}
                className="inline-flex items-center gap-2 rounded-full bg-dark-700 px-4 py-2 text-sm text-dark-200 transition-colors hover:bg-primary hover:text-white"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Layanan</h3>
            <ul className="space-y-3">
              {SERVICE_NAV_GROUPS.map((group) => (
                <li key={group.slug}>
                  <Link
                    href={group.items[0]?.href || "/services"}
                    className="text-dark-300 transition-colors hover:text-primary"
                  >
                    {group.category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold">Perusahaan</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-dark-300 transition-colors hover:text-primary"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-dark-300 transition-colors hover:text-primary"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-dark-300 transition-colors hover:text-primary"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-dark-300 transition-colors hover:text-primary"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-dark-300 transition-colors hover:text-primary"
                >
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold">Hubungi Kami</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-dark-300">{siteAddress}</span>
              </li>
              <li>
                <a
                  href={`https://wa.me/${siteWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-dark-300 transition-colors hover:text-primary"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{sitePhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteEmail}`}
                  className="flex items-center gap-3 text-dark-300 transition-colors hover:text-primary"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <span>{siteEmail}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-dark-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 lg:flex-row lg:px-6">
          <p className="text-sm text-dark-400">
            © {currentYear} {siteName}. Hak cipta dilindungi.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-dark-400 sm:gap-6">
            <Link href="/privacy" className="hover:text-primary">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Syarat & Ketentuan
            </Link>
            <Link href="/refund-policy" className="hover:text-primary">
              Pengembalian
            </Link>
            <Link href="/shipping-policy" className="hover:text-primary">
              Pengiriman
            </Link>
            <Link href="/cookies" className="hover:text-primary">Kebijakan Cookie</Link>
            <CookiePreferencesButton className="hover:text-primary" />
          </div>
        </div>
      </div>
    </footer>
  );
}
