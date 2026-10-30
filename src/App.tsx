import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';

declare const __FOCUS_SCOPE_VERSION__: string;
import { useEffect, useRef, useState } from 'react';

const name = (el: Element | null) =>
  `${el?.tagName.toLowerCase()}${el?.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''}`;

// Each pane reports focus/blur events and activeElement/hasFocus samples to the host log.
function useReport(pane: string) {
  useEffect(() => {
    const sample = (why: string) =>
      parent.postMessage(
        { pane, t: Math.round(performance.now()), msg: `${why} activeElement=${name(document.activeElement)} hasFocus=${document.hasFocus()}` },
        '*',
      );
    const onFocus = () => sample('window focus');
    const onBlur = () => sample('window blur');
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    const id = setInterval(() => sample('sample'), 250);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      clearInterval(id);
    };
  }, [pane]);
}

export function PaneA() {
  useReport('A');
  const [dialogEl, setDialogEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(true);
  // The app behaviour that triggers the bug: the popover closes when the window loses focus.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('blur', close);
    return () => window.removeEventListener('blur', close);
  }, [open]);
  return (
    <Dialog.Root defaultOpen modal>
      <Dialog.Portal>
        <Dialog.Content ref={setDialogEl} style={{ padding: 8, border: '1px solid #888', background: '#eef' }}>
          <Dialog.Title>Pane A (dialog)</Dialog.Title>
          <Dialog.Description>Popover portalled into the dialog content</Dialog.Description>
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger>popover</Popover.Trigger>
            <Popover.Portal container={dialogEl}>
              {/* No focus return to the trigger: the popover closes because the user left the frame. */}
              <Popover.Content className="pop" onCloseAutoFocus={(e) => e.preventDefault()}>
                <input autoFocus placeholder="A: popover input" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PaneB() {
  useReport('B');
  return (
    <div>
      <input placeholder="B: input" />
      <p>pane B</p>
    </div>
  );
}

export function Host() {
  const [log, setLog] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<{ text: string; color: string }>({
    text: "Waiting: click pane B's input",
    color: '#b36b00',
  });
  const preRef = useRef<HTMLPreElement>(null);
  // State derived from the panes' postMessage reports.
  const st = useRef({ clickedAt: 0, bug: false, has: { A: false, B: false } as Record<string, boolean> });
  const isPatched = new URLSearchParams(location.search).get('patched') === '1';
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const { pane, t, msg } = e.data ?? {};
      if (!pane) return;
      setLog((l) => [...l.slice(-199), `${t} ${pane}: ${msg}`]);
      const s = st.current;
      s.has[pane] = msg.includes('hasFocus=true');
      if (pane === 'B' && msg.startsWith('window focus') && !s.clickedAt) s.clickedAt = Date.now();
      if (!s.clickedAt) return;
      if (pane === 'A' && s.has.A && !s.has.B) s.bug = true; // A has focus while B does not
      if (s.bug) setVerdict({ text: 'BUG: pane A took focus back from pane B', color: '#c00' });
      else if (s.has.B && Date.now() - s.clickedAt >= 1500)
        setVerdict({ text: 'OK: pane B kept focus', color: '#080' });
      else setVerdict({ text: 'Checking: watching panes A and B...', color: '#b36b00' });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  useEffect(() => {
    if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight;
  }, [log]);
  return (
    <div>
      <p>
        @radix-ui/react-focus-scope {__FOCUS_SCOPE_VERSION__}, mode:{' '}
        {isPatched ? 'patched (focus() on the dialog ignored while the document has no focus)' : 'as shipped'}{' '}
        {isPatched ? <a href="/">Run as shipped</a> : <a href="/?patched=1">Run patched</a>}{' '}
        <button onClick={() => location.reload()}>Reset</button>
      </p>
      <div style={{ fontSize: 28, fontWeight: 700, color: verdict.color }}>{verdict.text}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <iframe id="a" title="A" src={`/?pane=a${isPatched ? '&patched=1' : ''}`} style={{ width: 320, height: 160 }} />
        <iframe id="b" title="B" src="/?pane=b" style={{ width: 320, height: 160 }} />
      </div>
      <pre ref={preRef} style={{ height: 300, overflow: 'auto' }}>{log.join('\n')}</pre>
    </div>
  );
}
