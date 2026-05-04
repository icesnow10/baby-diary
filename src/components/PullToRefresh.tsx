import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useData } from "@/context/DataContext";

const THRESHOLD = 70;
const MAX = 110;

export default function PullToRefresh() {
  const { refresh } = useData();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const currentPull = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const isModalOpen = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      let el: Node | null = target;
      while (el) {
        if (el instanceof HTMLElement && (el.classList.contains("ant-modal-wrap") || el.closest?.(".ant-modal"))) {
          return true;
        }
        el = el.parentNode;
      }
      return false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (window.scrollY > 0) {
        startY.current = null;
        return;
      }
      if (isModalOpen(e.target)) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      if (window.scrollY > 0) {
        startY.current = null;
        currentPull.current = 0;
        setPull(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        currentPull.current = 0;
        setPull(0);
        return;
      }
      const damped = Math.min(MAX, Math.sqrt(delta) * 8);
      currentPull.current = damped;
      setPull(damped);
    };

    const onTouchEnd = async () => {
      const wasPulling = startY.current != null;
      startY.current = null;
      if (!wasPulling) return;
      const triggered = currentPull.current >= THRESHOLD;
      if (triggered && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setRefreshing(true);
        try {
          await refresh();
        } finally {
          isRefreshingRef.current = false;
          setRefreshing(false);
          currentPull.current = 0;
          setPull(0);
        }
      } else {
        currentPull.current = 0;
        setPull(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [refresh]);

  const visible = pull > 0 || refreshing;
  const translateY = refreshing ? 28 : Math.min(MAX, pull) - 32;
  const rotation = refreshing ? 0 : pull * 4;
  const opacity = refreshing ? 1 : Math.min(1, pull / THRESHOLD);

  return (
    <div
      className={`pullToRefreshIndicator${visible ? " visible" : ""}${refreshing ? " refreshing" : ""}`}
      style={{
        transform: `translate(-50%, ${translateY}px) rotate(${rotation}deg)`,
        opacity,
      }}
      aria-hidden={!visible}
    >
      <RefreshCw size={18} />
    </div>
  );
}
