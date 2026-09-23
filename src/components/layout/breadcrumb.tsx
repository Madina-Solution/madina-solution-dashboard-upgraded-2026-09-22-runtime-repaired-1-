import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className = "" }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-sm text-dark-500 ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={index}>
              <li className="flex items-center gap-1.5">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 transition-colors hover:text-primary"
                  >
                    {index === 0 && <Home className="h-3.5 w-3.5" />}
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? "font-medium text-dark" : ""}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {index === 0 && <Home className="mr-1 inline h-3.5 w-3.5" />}
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true">
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
