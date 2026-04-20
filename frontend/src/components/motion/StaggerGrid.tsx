import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Children } from 'react';
import { cn } from '../../lib/utils';

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

const container = (stagger: number) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: 0.04 },
  },
});

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

export function StaggerGrid({ children, className, stagger = 0.05 }: StaggerGridProps) {
  return (
    <motion.div
      className={cn('', className)}
      variants={container(stagger)}
      initial="hidden"
      animate="show"
    >
      {Children.map(children, (child, i) => (
        <motion.div key={i} variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
