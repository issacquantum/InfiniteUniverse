const READER_STATE_KEYS = ["activeSection", "activeDomain", "activeTopic", "activeBranch", "activeDetail"];

export function matchesReaderState(state, position) {
  return Boolean(position) && READER_STATE_KEYS.every((key) => (
    (state[key] ?? null) === (position[key] ?? null)
  ));
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
  const headings = headingPositions(reader);
  const index = headings.findLastIndex((top) => top <= scrollTop);
  const end = headings[index + 1] ?? reader.scrollHeight;
  const anchor = index >= 0 && end > headings[index]
    ? { index, count: headings.length, fraction: (scrollTop - headings[index]) / (end - headings[index]) }
    : null;

  return {
    language,
    scrollTop,
    scrollRatio: maxScrollTop > 0 ? scrollTop / maxScrollTop : 0,
    anchor,
    triggerOffset: trigger ? trigger.getBoundingClientRect().top - reader.getBoundingClientRect().top : null
  };
}

export function restoreReaderPosition(reader, position, language, trigger = null) {
  const maxScrollTop = Math.max(reader.scrollHeight - reader.clientHeight, 0);
  const changedLanguage = position.language && position.language !== language;
  let top = position.scrollTop ?? maxScrollTop * (position.scrollRatio ?? 0);

  if (changedLanguage) {
    top = maxScrollTop * (position.scrollRatio ?? 0);
    const headings = headingPositions(reader);
    const anchor = position.anchor;
    if (trigger && Number.isFinite(position.triggerOffset)) {
      top = trigger.getBoundingClientRect().top - reader.getBoundingClientRect().top
        + reader.scrollTop - position.triggerOffset;
    } else if (position.scrollRatio === 0) {
      top = 0;
    } else if (position.scrollRatio === 1) {
      top = maxScrollTop;
    } else if (anchor && anchor.count === headings.length && Number.isFinite(headings[anchor.index])) {
      const start = headings[anchor.index];
      const end = headings[anchor.index + 1] ?? reader.scrollHeight;
      top = start + anchor.fraction * (end - start);
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
  restoreReaderPosition(reader, position, state.language);
  return true;
}
