import Editor from '@monaco-editor/react'

export default function MonacoEditor({
  value,
  language = 'javascript',
  onChange,
  onCursorChange,
  onMount,
  readOnly = false,
  theme = 'vs-dark',
  fontSize = 14,
}) {
  function handleEditorDidMount(editor, monaco) {
    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({ lineNumber: e.position.lineNumber, column: e.position.column })
      }
    })
    if (onMount) onMount(editor, monaco)
  }

  return (
    <Editor
      height="100%"
      theme={theme}
      language={language}
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        fontSize: Number(fontSize) || 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: true },
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        tabSize: 2,
        insertSpaces: true,
        padding: { top: 12, bottom: 12 },
      }}
      loading={
        <div className="flex items-center justify-center w-full h-full bg-[#1e1e1e]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500" />
        </div>
      }
    />
  )
}
