'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const homeHref = isDashboard ? '/dashboard' : '/';
  const homeLabel = isDashboard ? 'Dashboard' : 'Home';

  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link 
        href={homeHref}
        className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">{homeLabel}</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
          {item.href ? (
            <Link 
              href={item.href}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
