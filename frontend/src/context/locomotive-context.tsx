"use client"


import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
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
  const [isReady, setIsReady] = useState(false)

  // Initialize the scroll instance
  useEffect(() => {
    // Only initialize locomotive scroll if it hasn't been initialized yet
    if (!scrollRef.current) {
      // Wait for the DOM to be fully rendered
      const initScroll = () => {
        try {
          const container = document.querySelector("[data-scroll-container]");
          
          if (container) {
            // Using type assertion to handle the conflicting types
            const locomotiveOptions = {
              el: container as HTMLElement,
              smooth: true,
              smartphone: {
                smooth: false,  // Disable smooth scrolling on mobile for better performance
              },
              tablet: {
                smooth: true,
                breakpoint: 1024,
              },
              lerp: 0.1,  // Linear interpolation - lower is smoother
              multiplier: 1,  // Scroll speed multiplier
              firefoxMultiplier: 50, // Firefox needs a higher multiplier
              touchMultiplier: 2,  // Speed on touch devices
            };

            // Create the locomotive scroll instance
            scrollRef.current = new LocomotiveScroll(locomotiveOptions);
            setIsReady(true);
          }
        } catch (error) {
          console.error("Failed to initialize Locomotive Scroll:", error);
        }
      };

      // Short timeout to ensure DOM is ready
      const timer = setTimeout(initScroll, 200);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    // Clean up on unmount
    return () => {
      if (scrollRef.current) {
        scrollRef.current.destroy();
        scrollRef.current = null;
      }
    };
  }, []);

  // Handle route changes
  useEffect(() => {
    if (scrollRef.current && isReady) {
      // Scroll to top when route changes
      window.scrollTo(0, 0);
      
      // Wait for content to render before updating
      const timer = setTimeout(() => {
        try {
          scrollRef.current?.update();
        } catch (error) {
          console.error("Failed to update Locomotive Scroll:", error);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [pathname, isReady]);

  return (
    <LocomotiveContext.Provider value={{ scroll: scrollRef.current }}>
      {children}
    </LocomotiveContext.Provider>
  );
};

export const useLocomotiveScroll = () => {
  return useContext(LocomotiveContext)
}