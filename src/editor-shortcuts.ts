import {useEffect, useLayoutEffect, useRef} from 'react';
import type {Tool} from './types';

const tools: Partial<Record<string, Tool>> = {
  v: 'select', n: 'nodes', h: 'pan', l: 'line', c: 'curve',
  d: 'dimension', g: 'guide', p: 'pen', t: 'trace', i: 'insert', x: 'remove',
};

type Shortcut = {kind: 'undo' | 'redo' | 'delete'} | {kind: 'tool'; tool: Tool};

export function editorShortcut(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'isComposing'>): Shortcut | undefined {
  if (event.isComposing || event.altKey) return;
  const key = event.key.toLowerCase();
  if (event.metaKey || event.ctrlKey) {
    if (key === 'z') return {kind: event.shiftKey ? 'redo' : 'undo'};
    if (key === 'y' && !event.shiftKey) return {kind: 'redo'};
    return;
  }
  if (key === 'delete' || key === 'backspace') return {kind: 'delete'};
  const tool = tools[key];
  if (tool) return {kind: 'tool', tool};
}

type EditorActions = {
  blocked: boolean;
  undo: () => void;
  redo: () => void;
  remove: () => void;
  selectTool: (tool: Tool) => void;
};

export function useEditorShortcuts(actions: EditorActions) {
  const current = useRef(actions);
  useLayoutEffect(() => { current.current = actions; }, [actions]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const actions = current.current;
      const target = event.target;
      if (actions.blocked || event.defaultPrevented ||
          document.querySelector('dialog[open]') ||
          (target instanceof HTMLElement && (target.isContentEditable || target.closest('input,textarea,select')))) return;
      const action = editorShortcut(event);
      if (!action) return;
      if (action.kind === 'tool') { actions.selectTool(action.tool); return; }

      event.preventDefault();
      const traceBack = document.querySelector<HTMLButtonElement>('#traceBack:not(:disabled)');
      if (traceBack && action.kind !== 'redo') {
        if (action.kind === 'undo') traceBack.click();
        return;
      }
      if (action.kind === 'delete') {
        if (!event.repeat) actions.remove();
      } else if (action.kind === 'undo') actions.undo();
      else actions.redo();
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
