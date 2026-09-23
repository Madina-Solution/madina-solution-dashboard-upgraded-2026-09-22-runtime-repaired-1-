import * as React from "react";
import { Breadcrumb } from "./breadcrumb";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Action = {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
};

type Props = {
  title: string;
  description?: string;
  label?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: Action[];
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  label,
  breadcrumbs,
  actions,
  children,
  className = "",
}: Props) {
  return (
    <div className={`border-b border-dark-100 bg-white ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-16">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} className="mb-6" />
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {label && (
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                {label}
              </span>
            )}
            <h1 className="mt-2 text-3xl font-bold text-dark sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-lg text-dark-600">{description}</p>
            )}
          </div>

          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {actions.map((action, index) => {
                const buttonClass = "inline-flex items-center gap-2";
                if (action.href) {
                  return (
                    <a
                      key={index}
                      href={action.href}
                      className={buttonClass}
                    >
                      {action.icon}
                      {action.label}
                    </a>
                  );
                }
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={action.onClick}
                    className={buttonClass}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
