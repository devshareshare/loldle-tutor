"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, Play, BarChart3 } from "lucide-react";

const links = [
  { href: "/", label: "Learn", icon: BookOpen },
  { href: "/study", label: "Study", icon: GraduationCap },
  { href: "/test", label: "Test", icon: Play },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-1">
        <Link href="/" className="text-primary font-bold text-lg mr-6 tracking-wide">
          LoLdle Tutor
        </Link>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
