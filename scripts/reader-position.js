const READER_STATE_KEYS = ["activeSection", "activeChapter", "activeDomain", "activeTopic", "activeBranch", "activeDetail"];

export function matchesReaderState(state, position) {
  return Boolean(position) && READER_STATE_KEYS.every((key) => (
    (state[key] ?? null) === (position[key] ?? null)
  ));
}

function visibleReaderInset(reader) {
  const viewport = globalThis.window?.visualViewport;
  if (!viewport || viewport.scale <= 1) return 0;
  return Math.min(reader.clientHeight, Math.max(0, viewport.offsetTop - reader.getBoundingClientRect().top));
}

function linkRoute(link) {
  return link?.getAttribute?.("href")?.split("#")[1]?.replace(/^\/(en|es)\//, "/") ?? null;
}

function headingPositions(reader) {
  const top = reader.getBoundingClientRect().top;
  return Array.from(reader.querySelectorAll("h2, h3, h4"))
    .filter((heading) => heading.getClientRects().length > 0)
    .map((heading) => heading.getBoundingClientRect().top - top + reader.scrollTop);
}

export function captureReaderPosition(reader, language, trigger = null) {
  const scrollTop = reader.scrollTop;
  const maxScrollTop = Math.max(reader.scrollHeight - reader.clientHeight, 0);
  const visualInset = visibleReaderInset(reader);
  const readingTop = scrollTop + visualInset;
  const headings = headingPositions(reader);
  const index = headings.findLastIndex((top) => top <= readingTop);
  const end = headings[index + 1] ?? reader.scrollHeight;
  const anchor = index >= 0 && end > headings[index]
    ? { index, count: headings.length, fraction: (readingTop - headings[index]) / (end - headings[index]) }
    : null;

  return {
    language,
    scrollTop,
    visualInset,
    contentWidth: reader.clientWidth,
    scrollRatio: maxScrollTop > 0 ? scrollTop / maxScrollTop : 0,
    anchor,
    triggerRoute: linkRoute(trigger),
    triggerOccurrence: trigger && linkRoute(trigger)
      ? Array.from(reader.querySelectorAll("a[href]")).filter(link => linkRoute(link) === linkRoute(trigger)).indexOf(trigger)
      : 0,
    triggerOffset: trigger ? trigger.getBoundingClientRect().top - reader.getBoundingClientRect().top - visualInset : null
  };
}

export function restoreReaderPosition(reader, position, language, trigger = null) {
  const maxScrollTop = Math.max(reader.scrollHeight - reader.clientHeight, 0);
  const changedLanguage = position.language && position.language !== language;
  const visualInset = visibleReaderInset(reader);
  const resized = Number.isFinite(position.contentWidth) && position.contentWidth !== reader.clientWidth;
  let top = (position.scrollTop ?? maxScrollTop * (position.scrollRatio ?? 0))
    + (position.visualInset ?? 0) - visualInset;

  if (trigger && Number.isFinite(position.triggerOffset)) {
    top = trigger.getBoundingClientRect().top - reader.getBoundingClientRect().top
      + reader.scrollTop - visualInset - position.triggerOffset;
  } else if (changedLanguage || resized) {
    top = maxScrollTop * (position.scrollRatio ?? 0);
    const headings = headingPositions(reader);
    const anchor = position.anchor;
    if (position.scrollRatio === 0 && !position.visualInset) {
      top = 0;
    } else if (position.scrollRatio === 1) {
      top = maxScrollTop;
    } else if (anchor && anchor.count === headings.length && Number.isFinite(headings[anchor.index])) {
      const start = headings[anchor.index];
      const end = headings[anchor.index + 1] ?? reader.scrollHeight;
      top = start + anchor.fraction * (end - start) - visualInset;
    }
  }

  reader.scrollTop = Math.min(Math.max(top, 0), maxScrollTop);
  trigger?.focus({ preventScroll: true });
}

export function restoreReaderScroll(host, state, position) {
  if (!matchesReaderState(state, position)) {
    return false;
  }
  const reader = host.closest(".content-window");
  if (!reader) {
    return false;
  }
  const trigger = position.triggerRoute
    ? Array.from(reader.querySelectorAll("a[href]")).filter(link => linkRoute(link) === position.triggerRoute)[position.triggerOccurrence ?? 0]
    : null;
  restoreReaderPosition(reader, position, state.language, trigger);
  return true;
}

// A delayed typeset must not override a reader who has already started interacting.
export function guardReaderRestoration(reader) {
  const controller = new AbortController();
  let interacted = false;
  const cancel = () => { interacted = true; };
  for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) {
    reader?.addEventListener(type, cancel, { passive: true, signal: controller.signal });
  }
  return () => {
    controller.abort();
    return !interacted;
  };
}
