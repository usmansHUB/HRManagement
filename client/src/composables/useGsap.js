import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export const useGsap = () => {
  /**
   * Animates a page content wrapper on route enter
   * @param {HTMLElement} el 
   */
  const animatePageIn = (el) => {
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' }
    );
  };

  /**
   * Animates sidebar navigation links with stagger effect
   * @param {string} parentSelector 
   */
  const animateSidebarLinks = (parentSelector) => {
    const targets = `${parentSelector} .nav-link`;
    gsap.fromTo(
      targets,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.06,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.1,
      }
    );
  };

  /**
   * Animates a text element to count up to a number
   * @param {HTMLElement} el Element to display count
   * @param {number} targetValue Target integer
   */
  const animateCountUp = (el, targetValue) => {
    if (!el) return;
    const num = parseInt(targetValue) || 0;
    const counter = { val: 0 };

    gsap.to(counter, {
      val: num,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 95%', // triggers when card is near viewport bottom
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        el.innerText = Math.round(counter.val).toLocaleString();
      },
    });
  };

  /**
   * Standard fade-in utility on scroll
   * @param {HTMLElement|string} el 
   * @param {number} delay 
   */
  const animateFadeInScroll = (el, delay = 0) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
      }
    );
  };

  /**
   * Clip-path text reveal animation on scroll
   * @param {HTMLElement|string} el Heading element to reveal
   */
  const animateTextReveal = (el) => {
    if (!el) return;
    
    // We create a clip path mask effect by sliding text up from a hidden container
    gsap.fromTo(
      el,
      { 
        y: '100%', 
        skewY: 6 
      },
      {
        y: '0%',
        skewY: 0,
        duration: 1.1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        }
      }
    );
  };

  /**
   * Parallax scroll translations for grid cards
   * @param {string} cardsSelector Selector matching cards list
   */
  const animateCardParallax = (cardsSelector) => {
    const cards = document.querySelectorAll(cardsSelector);
    cards.forEach((card, idx) => {
      // Alternate movement direction/speed based on index
      const speed = (idx % 2 === 0) ? -40 : 40;
      
      gsap.fromTo(
        card,
        { y: 0 },
        {
          y: speed,
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1, // continuous scroll interpolation
          }
        }
      );
    });
  };

  /**
   * Staggered fade and slide for table rows when data mounts
   * @param {string} rowSelector Selector for rows (e.g. tbody tr)
   */
  const animateRowStagger = (rowSelector) => {
    const rows = document.querySelectorAll(rowSelector);
    if (rows.length === 0) return;
    
    gsap.fromTo(
      rows,
      { opacity: 0, x: -10 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.05,
        duration: 0.45,
        ease: 'power2.out',
      }
    );
  };
  
  /**
   * Dynamic magnetic pull physics for buttons/interactive elements
   * @param {HTMLElement|string} target Selector or element
   */
  const animateMagnetic = (target) => {
    const elements = typeof target === 'string' ? document.querySelectorAll(target) : [target];
    elements.forEach((el) => {
      if (!el) return;
      
      const handleMouseMove = (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(el, {
          x: x * 0.35,
          y: y * 0.35,
          duration: 0.3,
          ease: 'power2.out',
        });
      };
      
      const handleMouseLeave = () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.35)',
        });
      };
      
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
      
      // Store cleanup function on element for later removal
      el._magneticCleanup = () => {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
        delete el._magneticCleanup;
      };
    });
  };

  // Cleanup all magnetic button event listeners
  const killMagneticListeners = (selector) => {
    const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector];
    elements.forEach((el) => {
      if (el && typeof el._magneticCleanup === 'function') {
        el._magneticCleanup();
      }
    });
  };

  // Clean up ScrollTrigger instances on view unmount
  const killScrollTriggers = () => {
    const allTriggers = ScrollTrigger.getAll();
    allTriggers.forEach((trigger) => trigger.kill());
  };

  return {
    animatePageIn,
    animateSidebarLinks,
    animateCountUp,
    animateFadeInScroll,
    animateTextReveal,
    animateCardParallax,
    animateRowStagger,
    animateMagnetic,
    killScrollTriggers,
    killMagneticListeners,
  };
};
