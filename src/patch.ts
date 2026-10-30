// Verification only: the suggested guard, as a monkeypatch. Ignores focus() on the dialog content
// while the document has no focus.
const originalFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function focus(this: HTMLElement, options?: FocusOptions) {
  if (this.getAttribute('role') === 'dialog' && !document.hasFocus()) return;
  originalFocus.call(this, options);
};
