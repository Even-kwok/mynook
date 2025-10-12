/**
 * Hero Banner Carousel Component
 * 主页轮播横幅组件 - 支持自动播放、手动切换、多种过渡效果
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroBannerItem, TransitionEffect } from '../types';

export interface HeroBannerCarouselProps {
  banners: HeroBannerItem[];
  autoplay?: boolean;
  pauseOnHover?: boolean;
  showIndicators?: boolean;
  showControls?: boolean;
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({
  banners,
  autoplay = true,
  pauseOnHover = true,
  showIndicators = true,
  showControls = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentBanner = banners[currentIndex];
  const hasBanners = banners.length > 0;
  const hasMultipleBanners = banners.length > 1;

  // 清除定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 切换到下一个
  const goToNext = useCallback(() => {
    if (!hasMultipleBanners) return;
    setDirection('right');
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length, hasMultipleBanners]);

  // 切换到上一个
  const goToPrevious = useCallback(() => {
    if (!hasMultipleBanners) return;
    setDirection('left');
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length, hasMultipleBanners]);

  // 跳转到指定索引
  const goToIndex = useCallback((index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
  }, [currentIndex]);

  // 自动播放逻辑
  useEffect(() => {
    if (!autoplay || !hasMultipleBanners || isPaused || !currentBanner) return;

    const duration = (currentBanner.displayDuration || 5) * 1000;
    clearTimer();
    
    timerRef.current = setTimeout(() => {
      goToNext();
    }, duration);

    return clearTimer;
  }, [autoplay, hasMultipleBanners, isPaused, currentIndex, currentBanner, goToNext, clearTimer]);

  // 悬停暂停
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  // 触摸滑动支持
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  // 获取过渡动画变体
  const getTransitionVariants = (effect: TransitionEffect) => {
    switch (effect) {
      case 'fade':
        return {
          enter: { opacity: 0 },
          center: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'slide':
        return {
          enter: { x: direction === 'right' ? 1000 : -1000, opacity: 0 },
          center: { x: 0, opacity: 1 },
          exit: { x: direction === 'right' ? -1000 : 1000, opacity: 0 }
        };
      case 'zoom':
        return {
          enter: { scale: 0.8, opacity: 0 },
          center: { scale: 1, opacity: 1 },
          exit: { scale: 1.2, opacity: 0 }
        };
      default:
        return {
          enter: { opacity: 0 },
          center: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  if (!hasBanners) {
    // 显示默认横幅
    return (
      <section className="relative bg-cover bg-center w-full aspect-[4096/2341] flex-shrink-0"
        style={{ backgroundImage: `url('https://storage.googleapis.com/aistudio-hosting/templates/interior-japandi.png')` }}
      >
      </section>
    );
  }

  const transitionVariants = getTransitionVariants(currentBanner.transitionEffect);
  
  // 计算宽高比
  const aspectRatio = currentBanner.width && currentBanner.height 
    ? `${currentBanner.width}/${currentBanner.height}`
    : '4096/2341';

  return (
    <section
      className="relative overflow-hidden w-full flex-shrink-0"
      style={{ aspectRatio }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 背景轮播 */}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={transitionVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.8,
            ease: [0.32, 0.72, 0, 1]
          }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${currentBanner.src}')` }}
        />
      </AnimatePresence>

      {/* 左右控制按钮 */}
      {showControls && hasMultipleBanners && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            aria-label="Previous banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            aria-label="Next banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 指示器 */}
      {showIndicators && hasMultipleBanners && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* 暂停指示器 */}
      {isPaused && autoplay && hasMultipleBanners && (
        <div className="absolute top-24 right-4 z-20 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-sm text-white/80">
          Paused
        </div>
      )}
    </section>
  );
};

