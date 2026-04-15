"use client";

import { useEffect } from "react";

export default function MotionProvider() {
  useEffect(() => {
    const selectors = "[data-reveal]";
    const observed = new WeakSet<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-reveal-visible", "true");
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    const registerTargets = () => {
      document.querySelectorAll(selectors).forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        observer.observe(el);
      });
    };

    registerTargets();

    const domWatcher = new MutationObserver(() => {
      registerTargets();
    });

    domWatcher.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      domWatcher.disconnect();
    };
  }, []);

  return null;
}
