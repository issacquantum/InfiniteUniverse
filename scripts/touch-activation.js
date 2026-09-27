// Cancel delayed activations after a gesture without cancelling the gesture itself.
export function installTouchActivationGuard(root, now = () => performance.now()) {
  const pointers = new Set();
  let touch = null;
  const options = { capture: true, passive: true };
  root.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch") {
      touch = null;
      return;
    }
    pointers.add(event.pointerId);
    if (pointers.size === 1) {
      touch = { x: event.clientX, y: event.clientY, start: now(), blocked: false, ended: null };
    } else if (touch) {
      touch.blocked = true;
    }
  }, options);
  root.addEventListener("pointermove", event => {
    if (!touch || !pointers.has(event.pointerId)) return;
    if (Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 10) touch.blocked = true;
  }, options);
  const finish = event => {
    if (!pointers.delete(event.pointerId) || !touch) return;
    if (event.type === "pointercancel" || now() - touch.start >= 500) touch.blocked = true;
    touch.ended = now();
  };
  root.addEventListener("pointerup", finish, options);
  root.addEventListener("pointercancel", finish, options);
  root.addEventListener("contextmenu", () => {
    if (touch && pointers.size) touch.blocked = true;
  }, options);
  root.addEventListener("click", event => {
    if (!touch || event.detail === 0 || event.pointerType === "mouse") return;
    const recent = touch.ended === null || now() - touch.ended < 1000;
    if (!recent || (!touch.blocked && (touch.ended !== null || now() - touch.start < 500))) return;
    if (!event.target.closest?.("a[href], button, summary, [role='button'], [data-action], [data-gallery-trigger], canvas")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}
