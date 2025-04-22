"use client"

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import LocomotiveScroll from "locomotive-scroll"
import "locomotive-scroll/dist/locomotive-scroll.css"

interface LocomotiveContextType {
  scroll: LocomotiveScroll | null
}

const LocomotiveContext = createContext<LocomotiveContextType>({ scroll: null })

export const LocomotiveScrollProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation()
  const scrollRef = useRef<LocomotiveScroll | null>(null)

  useEffect(() => {
    // Wait for the DOM to be fully rendered
    const initScroll = () => {
      if (!scrollRef.current) {
        const container = document.querySelector("[data-scroll-container]");
        
        if (container) {
          // Using type assertion to handle the conflicting types
          const locomotiveOptions = {
            el: container as HTMLElement,
            smooth: true,
            smartphone: {
              smooth: true,
              breakpoint: 767,
            },
            tablet: {
              smooth: true,
              breakpoint: 1024,
            },
          } as any;  // Use type assertion here

          scrollRef.current = new LocomotiveScroll(locomotiveOptions);
        }
      }
    };

    // Short timeout to ensure DOM is ready
    const timer = setTimeout(initScroll, 50);
    
    return () => {
      clearTimeout(timer);
      if (scrollRef.current) {
        scrollRef.current.destroy();
        scrollRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      // Update scroll instance after route changes
      scrollRef.current.scrollTo(0, { duration: 0, disableLerp: true });
      
      // Update after some time to ensure content is rendered
      const timer = setTimeout(() => {
        scrollRef.current?.update();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <LocomotiveContext.Provider value={{ scroll: scrollRef.current }}>
      {children}
    </LocomotiveContext.Provider>
  );
};

export const useLocomotiveScroll = () => {
  return useContext(LocomotiveContext)
}