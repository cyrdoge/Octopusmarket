/**
 * src/components/layout/market-footer.tsx
 * Market footer — minimal, professional web3-style footer
 */

import { OctopusBrand } from "@/components/octopus-market/octopus-brand";
import { Twitter, MessageCircle, Github } from "lucide-react";

type FooterLink = {
  label: string;
  href: string;
};

const productLinks: FooterLink[] = [
  { label: "Predictions", href: "/predictions" },
  { label: "Explore", href: "/explore" },
  { label: "List My AI", href: "/list-my-ai" },
];

const resourceLinks: FooterLink[] = [
  { label: "Docs", href: "/docs" },
  { label: "Whitepaper", href: "/whitepaper" },
];

const legalLinks: FooterLink[] = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

const socialLinks = [
  { label: "Twitter", href: "https://twitter.com/octopusmarket", icon: Twitter },
  { label: "Discord", href: "https://discord.gg/octopusmarket", icon: MessageCircle },
  { label: "GitHub", href: "https://github.com/octopusmarket", icon: Github },
];

export function MarketFooter() {
  return (
    <footer className="border-t border-orange-100 bg-white dark:border-white/10 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <OctopusBrand compact />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Predict, trade, and launch AI on-chain.
            </p>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Resources" links={resourceLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-orange-100 pt-6 sm:flex-row dark:border-white/10">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} Octopus Market. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${social.label} (opens in a new tab)`}
                className="text-zinc-500 transition-colors hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400"
              >
                <social.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-sm text-zinc-500 transition-colors hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
