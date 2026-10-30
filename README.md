# Radix FocusScope re-focuses its container while the document has no focus

Reproduction for [radix-ui/primitives#4261](https://github.com/radix-ui/primitives/issues/4261).
How to use it:

1. Open https://stackblitz.com/github/rolfheij-sil/radix-focus-scope-iframe-repro
2. Wait until the verdict says "Waiting" and pane A shows its popover input.
3. Click pane B's input.
4. Read the verdict. In `@radix-ui/react-focus-scope` 1.3.1 (as shipped) it turns to `BUG: pane A took
   focus back from pane B`. Click "Run patched" and repeat to see `OK: pane B kept focus`. "Reset"
   reloads the page so the popover reopens.

(Locally: `npm install && npm run dev`.)

Details below.

`@radix-ui/react-focus-scope` 1.3.1 (printed at the top of the page). Pane A (`/?pane=a`) is a modal
`Dialog` with a `Popover` portalled into the dialog content; the popover holds an `<input>` and closes
on the iframe's `window` `blur`. Its content has a 150 ms CSS exit animation, so Radix `Presence`
unmounts it ~150 ms after the blur (as in an app with `animate-out` menus). Pane B (`/?pane=b`) is a
plain `<input>`.

Note: `Popover.Content` needs `onCloseAutoFocus={(e) => e.preventDefault()}` (already set). Otherwise
Radix returns focus to the trigger, `activeElement` is no longer `body`, and the bug never fires.

## Steps

1. `npm install && npm run dev`, open the printed URL.
2. Wait until pane A shows its popover with the input focused (log: `A: sample activeElement=input hasFocus=true`).
3. Click pane B's input and watch the log for ~1 s.

## Expected

Pane A's document has lost focus, so it stays on `activeElement=body hasFocus=false`, and pane B keeps focus.

## Actual (1.3.1)

When the popover unmounts, the focused input is removed, `handleMutations` sees `activeElement === body`
and calls `focus()` on the dialog content although `document.hasFocus()` is `false`. Pane A takes
focus back from pane B: A's log shows `activeElement=div[role=dialog] hasFocus=true`, B's input loses focus.

Observed with Playwright Chromium (headless, 3 runs, versions as in `package.json`): +100 ms host
focus on B, A `body`/`hasFocus=false` (popover still animating out); +300 ms, +800 ms, +1500 ms host
focus on iframe A, A `div[role=dialog]` `hasFocus=true`, B `hasFocus=false`. Other browsers were not
tested.

`/?patched=1` loads `src/patch.ts` in pane A, which ignores `focus()` on the dialog while
`!document.hasFocus()` (the suggested guard). Then B keeps focus at every sample and A stays on `body`.
