import { useEffect, useRef } from 'react'

/**
 * CursorMarker – renders colored cursor decorations for remote users in Monaco.
 *
 * Usage: mount alongside <MonacoEditor> and pass the editor instance + cursor map.
 *
 * Props:
 *   editor   – Monaco editor instance (from onMount)
 *   monaco   – Monaco namespace  (from onMount)
 *   cursors  – { [userId]: { line, column, color, username } }
 *   currentUserId – skip rendering own cursor
 */
export default function CursorMarker({ editor, monaco, cursors = {}, currentUserId }) {
  const decorationsRef = useRef([])

  useEffect(() => {
    if (!editor || !monaco) return

    const newDecorations = Object.entries(cursors)
      .filter(([userId]) => userId !== currentUserId)
      .map(([userId, cursor]) => {
        const { line, column, color, username } = cursor
        return {
          range: new monaco.Range(line, column, line, column),
          options: {
            className: `cursor-${userId}`,
            beforeContentClassName: `cursor-before-${userId}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            // Render a blinking cursor line
            after: {
              content: ' ',
              inlineClassName: `cursor-label-${userId}`,
            },
          },
        }
      })

    // Apply decorations and track old IDs for cleanup
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    )

    // Inject dynamic CSS for each user's cursor color
    Object.entries(cursors).forEach(([userId, cursor]) => {
      if (userId === currentUserId) return
      const styleId = `cursor-style-${userId}`
      if (document.getElementById(styleId)) return
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .cursor-before-${userId}::before {
          content: '';
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background: ${cursor.color};
          margin-right: -2px;
          vertical-align: text-bottom;
          animation: cursor-blink 1s step-end infinite;
        }
        .cursor-label-${userId}::after {
          content: '${CSS.escape(cursor.username || userId)}';
          background: ${cursor.color};
          color: #fff;
          font-size: 10px;
          padding: 0 4px;
          border-radius: 3px;
          position: relative;
          top: -1.2em;
          pointer-events: none;
          white-space: nowrap;
        }
        @keyframes cursor-blink {
          50% { opacity: 0; }
        }
      `
      document.head.appendChild(style)
    })

    return () => {
      // Clean up decorations on unmount
      if (editor && decorationsRef.current.length) {
        editor.deltaDecorations(decorationsRef.current, [])
      }
    }
  }, [editor, monaco, cursors, currentUserId])

  // No DOM output — purely a side-effect component
  return null
}
