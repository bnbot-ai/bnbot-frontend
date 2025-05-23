'use client';
import cn from '@/utils/cn';
import { StaticImageData } from 'next/image';
import { useState } from 'react';
import xLogo from '@/assets/images/logo-x-white.png';

interface AvatarProps {
  image: string | StaticImageData;
  alt: string;
  className?: string;
  size?: SizeNames;
  shape?: ShapeNames;
  width?: number;
  height?: number;
}

type ShapeNames = 'rounded' | 'circle';
type SizeNames = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

const sizes: Record<SizeNames, string[]> = {
  xl: [
    'border-white border-[5px] h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 3xl:h-40 3xl:w-40 3xl:border-8 shadow-large',
  ],
  lg: ['border-white border-4 h-20 w-20 lg:h-24 lg:w-24'],
  md: ['border-white h-10 w-10 drop-shadow-main border-3'],
  sm: ['border-white h-8 w-8 border-2 shadow-card'],
  xs: ['h-6 w-6'],
};

const shapes: Record<ShapeNames, string[]> = {
  rounded: ['h-16 w-16 rounded-lg bg-white/20 p-2 backdrop-blur-[40px]'],
  circle: ['rounded-full'],
};

function Avatar({
  image,
  alt,
  className,
  size = 'md',
  shape = 'circle',
  width = 100,
  height = 100,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClassNames = sizes[size];

  const handleImageError = () => {
    setImageError(true);
  };

  const imageSrc = imageError || !image ? xLogo : image;

  return (
    <figure
      className={cn(
        'relative shrink-0 overflow-hidden',
        className,
        shapes[shape],
        shape === 'circle' && sizeClassNames,
      )}
    >
      <img
        src={typeof imageSrc === 'string' ? imageSrc : imageSrc.src}
        alt={alt}
        width={width}
        height={height}
        onError={handleImageError}
        draggable="false"
        className={cn(
          shape === 'circle' ? 'rounded-full' : 'rounded-[6px]',
          'object-cover'
        )}
      />
    </figure>
  );
}

export default Avatar;