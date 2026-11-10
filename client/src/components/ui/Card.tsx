import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hover = false, className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-card text-card-foreground rounded-xl border border-border shadow-subtle p-5 transition-all duration-200',
          hover && 'hover:shadow-elevated hover:border-slate-300 dark:hover:border-slate-700',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={twMerge(clsx('flex flex-col space-y-1 mb-4', className))} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3
      className={twMerge(clsx('text-lg font-semibold tracking-tight text-foreground', className))}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={twMerge(clsx('text-xs text-muted-foreground', className))} {...props}>
      {children}
    </p>
  );
};
