import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-mindful-cta text-white hover:bg-mindful-ctaHover focus:ring-mindful-cta dark:bg-mindful-dark-cta dark:hover:bg-opacity-90",
    secondary: "bg-white text-mindful-text border border-slate-200 hover:bg-slate-50 focus:ring-slate-300 dark:bg-mindful-dark-card dark:border-slate-700 dark:text-mindful-dark-text dark:hover:bg-slate-800",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600 dark:bg-rose-900/80",
    ghost: "text-mindful-textLight hover:bg-slate-100 focus:ring-slate-300 dark:text-mindful-dark-textLight dark:hover:bg-slate-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};