import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

interface Props {
  value: string;
  language: string;
  onChange: (value: string) => void;
  roomId: string;
  currentUser: string;
  remoteCursors?: { [userId: string]: any };
  users?: any[];
}

export default function CodeEditor({ value, language, onChange, roomId, currentUser, remoteCursors = {}, users = [] }: Props) {
  const socket = getSocket();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e: any) => {
      socket.emit("cursor-move", {
        roomId,
        position: e.position,
        username: currentUser
      });
    });
  };

  // Update remote cursors via Monaco decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const newDecorations: any[] = [];

    // Dynamically inject CSS classes for each connected user color
    const styleId = "remote-cursors-styles";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    let cssRules = "";

    Object.values(remoteCursors).forEach((cursorData) => {
      // Find user color
      const user = users.find(u => u.id === cursorData.userId);
      const color = user?.color || "#FF6B6B";
      const className = `cursor-${cursorData.userId.replace(/[^a-zA-Z0-9]/g, "")}`;

      cssRules += `
        .${className} {
          border-left: 2px solid ${color} !important;
          position: relative;
        }
        .${className}::after {
          content: '${cursorData.username}';
          position: absolute;
          top: -15px;
          left: -2px;
          background: ${color};
          color: #000;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 4px;
          border-bottom-left-radius: 0;
          white-space: nowrap;
          pointer-events: none;
          z-index: 50;
        }
      `;

      newDecorations.push({
        range: new monacoRef.current.Range(
          cursorData.position.lineNumber,
          cursorData.position.column,
          cursorData.position.lineNumber,
          cursorData.position.column
        ),
        options: {
          className: className,
          stickiness: 1, // TrackAfter
        }
      });
    });

    styleEl.innerHTML = cssRules;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

  }, [remoteCursors, users]);

  return (
    <div className="flex-1 h-full rounded-lg overflow-hidden border border-gray-700">
      <Editor
        height="100%"
        language={language}
        value={value}
        theme="vs-dark"
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          padding: { top: 16 }
        }}
      />
    </div>
  );
}
