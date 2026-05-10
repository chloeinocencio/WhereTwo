import * as React from 'react';

export function Header({ className = '', children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={`px-4 py-3 min-h-[5rem] flex flex-col justify-start ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Header;
