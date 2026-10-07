import { Compartment, EditorState, Prec } from '@codemirror/state';
import { EditorView, drawSelection, dropCursor, highlightSpecialChars, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage, insertNewlineContinueMarkupCommand, deleteMarkupBackward } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching } from '@codemirror/language';
import { searchKeymap } from '@codemirror/search';
import { tags } from '@lezer/highlight';

const highlighting = HighlightStyle.define([
  { tag: tags.heading, fontWeight: '700', color: '#354b3d' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.link, color: '#95533f', textDecoration: 'underline' },
  { tag: tags.url, color: '#65716b' },
  { tag: tags.monospace, color: '#8a4c39' },
  { tag: tags.quote, color: '#65716b', fontStyle: 'italic' },
  { tag: tags.processingInstruction, color: '#788474' },
]);

export const markdownBindings = [
  { key: 'Enter', run: insertNewlineContinueMarkupCommand({ nonTightLists: false }) },
  { key: 'Backspace', run: deleteMarkupBackward },
];

export function createMarkdownEditor(parent, { onChange, onSave, onFormat }) {
  const editable = new Compartment();
  let readOnly = false;
  const extensions = [
    markdown({ base: markdownLanguage, addKeymap: false }),
    Prec.high(keymap.of(markdownBindings)),
    history(), drawSelection(), dropCursor(), highlightSpecialChars(),
    indentOnInput(), bracketMatching(), syntaxHighlighting(highlighting),
    EditorView.lineWrapping,
    placeholder('Write your post in Markdown.'),
    EditorView.contentAttributes.of({ 'aria-label': 'Post Markdown', spellcheck: 'true', autocapitalize: 'sentences', lang: 'en-GB' }),
    EditorView.updateListener.of(update => { if (update.docChanged) onChange(); }),
    keymap.of([
      { key: 'Mod-s', run: () => { onSave(); return true; } },
      { key: 'Mod-b', run: () => { onFormat('bold'); return true; } },
      { key: 'Mod-i', run: () => { onFormat('italic'); return true; } },
      { key: 'Mod-k', run: () => { onFormat('link'); return true; } },
      ...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab,
    ]),
    EditorView.theme({
      '&': { backgroundColor: 'transparent', fontSize: '15px' },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': { fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace', lineHeight: '1.9' },
      '.cm-content': { padding: '0', minHeight: '350px', caretColor: '#1f2a28' },
      '.cm-line': { padding: '0' },
      '.cm-cursor': { borderLeftColor: '#1f2a28' },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#ead2ba' },
      '.cm-placeholder': { color: '#99a392', fontFamily: 'Georgia, serif', fontStyle: 'italic' },
      '.cm-panels': { backgroundColor: '#eceee5' },
    }),
  ];
  const editing = () => [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];
  const state = text => EditorState.create({ doc: text, extensions: [...extensions, editable.of(editing())] });
  const view = new EditorView({ state: state(''), parent });

  return {
    getText: () => view.state.doc.toString(),
    getSelection: () => view.state.selection.main,
    setText(text, resetHistory = false) {
      if (resetHistory || text !== view.state.doc.toString()) view.setState(state(text));
    },
    setReadOnly(value) {
      if (value === readOnly) return;
      readOnly = value;
      view.dispatch({ effects: editable.reconfigure(editing()) });
    },
    select(from, to) {
      view.dispatch({ selection: { anchor: from, head: to }, effects: EditorView.scrollIntoView(from, { y: 'center' }) });
      view.focus();
    },
    replaceSelection(text, selectionFrom, selectionTo) {
      const { from, to } = view.state.selection.main;
      view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: selectionFrom, head: selectionTo }, userEvent: 'input' });
      view.focus();
    },
    requestMeasure: () => view.requestMeasure(),
  };
}
