import React, { useRef } from 'react';
import { useInView } from 'framer-motion';
import { motion as m } from 'framer-motion'; 
interface ScrollAnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
}
export const ScrollAnimatedSection: React.FC<ScrollAnimatedSectionProps> = ({ children, className }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };
  return (
    <m.section
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </m.section>
  );
};
