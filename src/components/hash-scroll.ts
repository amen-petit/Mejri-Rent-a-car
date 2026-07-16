"use client";

/**
 * Same-page anchor scrolling (e.g. "/#how"). Next's <Link> treats a click to
 * the CURRENT url (pathname + hash) as a no-op: once the hash is already in
 * the address bar from an earlier click, clicking the same link again does
 * nothing — even if the visitor has since scrolled elsewhere on the page —
 * because the URL itself never changed while scrolling.
 *
 * These helpers bypass that by scrolling manually whenever we're already on
 * the target page, and leave genuine cross-page navigation (an actual
 * pathname change) to Next's own <Link>, whose mount-time hash scrolling
 * already works correctly in that case.
 */
import type { MouseEvent } from "react";

/** True when a click to `hash` needs manual handling (already on that page). */
export function isSamePageHashClick(currentPathname: string, targetPath = "/") {
  return currentPathname === targetPath;
}

/** Scrolls to `hash` and syncs the address bar without adding a history entry. */
export function performHashScroll(hash: string, targetPath = "/") {
  document.getElementById(hash)?.scrollIntoView({ block: "start" });
  if (window.location.hash !== `#${hash}`) {
    window.history.replaceState(null, "", `${targetPath}#${hash}`);
  }
}

/** Click handler for the common case: scroll immediately, same tick. */
export function scrollToHashOnSamePage(
  event: MouseEvent<HTMLAnchorElement>,
  currentPathname: string,
  hash: string,
  targetPath = "/",
) {
  if (!isSamePageHashClick(currentPathname, targetPath)) return;
  event.preventDefault();
  performHashScroll(hash, targetPath);
}
