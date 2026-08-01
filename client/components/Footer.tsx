import Link from "next/link";
import NewsletterSignup from "./NewsletterSignup";
import { CONTACT_LINKS, STORE } from "../lib/store";

export default function Footer() {
  return (
    <footer className="site-footer text-ink-50 pt-14 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <NewsletterSignup />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 md:grid-cols-3 gap-10">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Arsalah
          </h2>
          <p className="mt-3 text-ink-100/80">
            Your one-stop shop for quality products.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-white">Quick Links</h3>
          <ul className="space-y-2 text-ink-100/80">
            <li>
              <Link href="/" className="hover:text-brand-400 transition">
                Home
              </Link>
            </li>
            <li>
              <Link href="/#products" className="hover:text-brand-400 transition">
                Products
              </Link>
            </li>
            <li>
              <Link href="/category" className="hover:text-brand-400 transition">
                Categories
              </Link>
            </li>
            <li>
              <a
                href={CONTACT_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-400 transition"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-white">Contact</h3>

          <div className="space-y-2 text-ink-100/80">
            <p>
              <a
                href={CONTACT_LINKS.email}
                className="hover:text-brand-400 transition break-words"
              >
                {STORE.email}
              </a>
            </p>

            <p>
              <a
                href={CONTACT_LINKS.phone}
                className="hover:text-brand-400 transition"
              >
                {STORE.phone}
              </a>
            </p>

            <p>{STORE.country}</p>
          </div>

          {/* Same number as above — most customers here would rather message
              than call, so give it its own button. */}
          <a
            href={CONTACT_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm mt-4"
          >
            💬 Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-white/10 text-sm text-ink-100/60">
        © {new Date().getFullYear()} {STORE.name}. All rights reserved.
      </div>

      {/* The owner's own sign-off, reproduced as he wrote it, and the last
          thing on the page.

          The address and mailbox here are his and deliberately not the ones
          in lib/store.ts: arsalah.com was unregistered when this went in
          (checked against the Hostinger account, DNS, and the registrar —
          it was still available to buy), so the link resolves nowhere and
          the address cannot receive mail. He was shown all of that, offered
          arsalah.shop and the working gmail instead, and asked for it as
          written. Left alone on purpose — if it ever starts working, this
          comment is what is out of date, not the markup. */}
      <address className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pt-6 border-t border-white/10 not-italic text-sm text-ink-100/70 leading-relaxed">
        <span className="block">Best regards,</span>

        <span className="mt-2 block font-semibold text-white">Tariq Khan</span>
        <span className="block">Founder &amp; CEO</span>
        <span className="block">{STORE.name}</span>

        <span className="mt-3 block">
          <span aria-hidden="true">🌐</span>{" "}
          <a
            href="https://arsalah.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-400 transition break-words"
          >
            https://arsalah.com
          </a>
        </span>

        <span className="block">
          <span aria-hidden="true">📧</span>{" "}
          <a
            href="mailto:contact@arsalah.com"
            className="hover:text-brand-400 transition break-words"
          >
            contact@arsalah.com
          </a>
        </span>

        <span className="block">
          <span aria-hidden="true">📞</span>{" "}
          <a
            href="tel:+923112424058"
            className="hover:text-brand-400 transition"
          >
            +92 3112424058
          </a>
        </span>
      </address>
    </footer>
  );
}
