// {{COMPONENT_NAME}} Component
// {{DESCRIPTION}}

import React from 'react';
import { cn } from '@/utils/cn';

interface {{COMPONENT_NAME}}Props {
  className?: string;
  children?: React.ReactNode;
  // Add your component props here
}

const {{COMPONENT_NAME}}: React.FC<{{COMPONENT_NAME}}Props> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        // Default styles
        'relative',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default {{COMPONENT_NAME}};