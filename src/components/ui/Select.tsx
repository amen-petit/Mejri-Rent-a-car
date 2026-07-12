"use client";

/**
 * Accessible custom <select> replacement. The native option list can't be
 * styled, so we render our own listbox popover that matches the editorial
 * system. Supports keyboard navigation (↑/↓/Home/End/Enter/Esc), click-outside
 * close, and aria-activedescendant for screen readers.
 *
 * The listbox is rendered in a PORTAL with fixed positioning (like DateField) so
 * it can never be clipped by an ancestor's `overflow-hidden` (e.g. the hero
 * section) or trapped behind a sibling's stacking context. It matches the
 * trigger's width, flips above when there isn't room below, and follows the
 * trigger on scroll/resize.
 */
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string };

export default function Select({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  align = "left",
  tone = "light",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel?: string;
  className?: string;
  align?: "left" | "right";
  /** "dark" restyles the control + popover for dark surfaces (e.g. the hero). */
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const selected = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  // Position the portalled listbox under (or above) the trigger, matched to its
  // width and clamped to the viewport, and keep it attached while open. Measures
  // the list's real height (rendered hidden until positioned) so a flipped-up
  // list sits flush above the field instead of floating with a gap.
  useEffect(() => {
    if (!open) {
      // Clear so a reopen re-measures before showing (no flash). Same pattern as
      // DateField; the lint heuristic misfires on this early-return reset.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoords(null);
      return;
    }
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(rect.width, vw - 16);
      const height = listRef.current?.offsetHeight ?? 256;
      let left = align === "right" ? rect.right - width : rect.left;
      left = Math.max(8, Math.min(left, vw - width - 8));
      // Prefer opening below; flip above when there isn't room in the viewport.
      let top = rect.bottom + gap;
      if (top + height > vh - 8) top = rect.top - gap - height;
      top = Math.max(8, Math.min(top, vh - height - 8));
      setCoords({ top, left, width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align]);

  // Close on outside click (accounting for the portalled listbox).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function openMenu() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(`${baseId}-opt-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, baseId]);

  function commit(i: number) {
    const opt = options[i];
    if (opt) onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const listbox = open
    ? createPortal(
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "fixed",
            top: coords?.top ?? 0,
            left: coords?.left ?? 0,
            width: coords?.width,
            // Rendered but invisible until measured + positioned (no flash, and
            // offsetHeight is readable for accurate flip-up placement).
            visibility: coords ? "visible" : "hidden",
          }}
          className={`z-[60] max-h-64 overflow-auto rounded-[var(--radius)] border p-1 ${
            dark
              ? "border-white/10 bg-[#1c1d24] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]"
              : "border-mist bg-paper shadow-md"
          }`}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={o.value}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-colors ${
                  dark
                    ? isActive
                      ? "bg-accent text-white"
                      : "text-white/80 hover:bg-white/[0.06]"
                    : isActive
                      ? "bg-ink text-paper"
                      : "text-ink hover:bg-ink/[0.04]"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && (
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 ${
                      dark ? "text-white" : isActive ? "text-paper" : "text-ink"
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>,
        document.body,
      )
    : null;

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined
        }
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
          dark
            ? "border-white/12 bg-white/[0.04] text-white hover:border-white/25 focus:border-accent focus:ring-accent/30"
            : "border-line bg-paper text-ink hover:border-ink focus:border-ink focus:ring-ink/10"
        }`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            dark ? "text-white/45" : "text-ash"
          } ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {listbox}
    </div>
  );
}
