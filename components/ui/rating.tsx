'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Rating({ value, max = 5, onChange, readOnly = false, size = 'md' }: RatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starSize = sizes[size];

  const handleStarClick = (rating: number) => {
    if (!readOnly && onChange) {
      // If clicking the same star twice, clear the rating
      onChange(rating === value ? 0 : rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        return (
          <Star
            key={i}
            className={`${starSize} ${
              starValue <= (readOnly ? value : hoverValue || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            } ${!readOnly ? 'cursor-pointer' : ''} transition-colors`}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
          />
        );
      })}
    </div>
  );
}
