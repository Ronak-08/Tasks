import { writable } from 'svelte/store';

function createBreakpointStore() {
  const { subscribe, set } = writable({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false
  });

  if (typeof window !== 'undefined') {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      set({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024 && width < 1200,
        isLargeDesktop: width >= 1200
      });
    };
    updateBreakpoints();

    window.addEventListener('resize', updateBreakpoints);

    return {
      subscribe,
      destroy: () => window.removeEventListener('resize', updateBreakpoints)
    };
  }

  return { subscribe };
}
export const breakpoints = createBreakpointStore();
