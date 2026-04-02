import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function LoadingSkeleton({ className, type = "card" }: { className?: string, type?: "text" | "card" | "title" }) {
  return (
    <div 
      className={cn(
        "animate-shimmer",
        type === "card" && "rounded-[2px] h-32 w-full",
        type === "text" && "h-4 w-3/4 rounded-sm",
        type === "title" && "h-8 w-1/2 rounded-[2px]",
        className
      )}
      style={{
        background: "linear-gradient(90deg, #111114 25%, #1A1A1F 50%, #111114 75%)",
        backgroundSize: "200% 100%"
      }}
    />
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <LoadingSkeleton type="card" />
        </motion.div>
      ))}
    </div>
  );
}
