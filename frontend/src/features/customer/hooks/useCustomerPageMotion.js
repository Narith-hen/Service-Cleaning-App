import { useEffect, useState } from 'react';

const REVEAL_SELECTOR = '[data-customer-reveal]';
const VISIBLE_CLASS = 'customer-reveal-visible';

const observeRevealTarget = (observer, element) => {
  if (!(element instanceof HTMLElement)) return;
  observer.observe(element);
};

const collectRevealTargets = (root) => {
  if (!root) return [];
  return Array.from(root.querySelectorAll(REVEAL_SELECTOR));
};

const revealImmediately = (elements) => {
  elements.forEach((element) => element.classList.add(VISIBLE_CLASS));
};

const resetRevealState = (elements) => {
  elements.forEach((element) => element.classList.remove(VISIBLE_CLASS));
};

const useCustomerPageMotion = (scopeRef, enabled = true, deps = []) => {
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setMotionReady(false);
      return undefined;
    }

    const scope = scopeRef.current;
    if (!scope) {
      setMotionReady(false);
      return undefined;
    }

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let currentTargets = collectRevealTargets(scope);
    let scheduledRefresh = null;

    if (!currentTargets.length) {
      setMotionReady(false);
      return undefined;
    }

    if (reduceMotionQuery.matches) {
      revealImmediately(currentTargets);
      setMotionReady(false);
      return undefined;
    }

    setMotionReady(true);
    resetRevealState(currentTargets);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(VISIBLE_CLASS);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    const frame = window.requestAnimationFrame(() => {
      currentTargets.forEach((element) => observeRevealTarget(observer, element));
    });

    const refreshObservedTargets = (mutations) => {
      const nextTargets = collectRevealTargets(scope);
      if (!nextTargets.length) return;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches(REVEAL_SELECTOR)) {
            node.classList.remove(VISIBLE_CLASS);
            observeRevealTarget(observer, node);
          }

          node.querySelectorAll?.(REVEAL_SELECTOR).forEach((element) => {
            element.classList.remove(VISIBLE_CLASS);
            observeRevealTarget(observer, element);
          });
        });
      });

      currentTargets = nextTargets;
      scheduledRefresh = null;
    };

    const mutationObserver = new MutationObserver((mutations) => {
      if (scheduledRefresh != null) {
        window.cancelAnimationFrame(scheduledRefresh);
      }

      scheduledRefresh = window.requestAnimationFrame(() => {
        refreshObservedTargets(mutations);
      });
    });

    mutationObserver.observe(scope, {
      childList: true,
      subtree: true
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (scheduledRefresh != null) {
        window.cancelAnimationFrame(scheduledRefresh);
      }
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [enabled, scopeRef, ...deps]);

  return motionReady;
};

export default useCustomerPageMotion;
