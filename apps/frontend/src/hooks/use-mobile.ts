import { useEffect, useState } from 'react';

/**
 * 判断当前是否处于移动端视口
 */
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = `(max-width: ${breakpoint}px)`;
    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobile('matches' in event ? event.matches : mediaQuery.matches);
    };

    handleChange(mediaQuery);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return isMobile;
}
