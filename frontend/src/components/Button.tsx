import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'lg', className = '', children, ...props }: ButtonProps) {
  const base = 'font-bold rounded-full transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none select-none';
  const sizes = {
    sm: 'py-2 px-5 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'w-full py-4 px-6 text-lg',
  };
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-red-50',
    ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
