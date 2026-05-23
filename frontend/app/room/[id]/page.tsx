"use client";

import { useEffect, useState, useRef, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import CodeEditor from "@/components/Editor";
import Output from "@/components/Output";
import { getSocket } from "@/lib/socket";

export default function RoomPage({ params }: { params: { id: string } }) {
  const roomId = params.id;
  const router = useRouter();
  const { user } = useUser();
  const [code, setCode] = useState("// Start coding...");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState<any[]>([]);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const isRemoteChange = useRef(false);
  
  // Use Clerk username or fallback to a temporary one (memoized to prevent infinite loops)
  const currentUser = useMemo(() => {
    return user?.firstName || user?.username || `Guest-${Math.floor(Math.random() * 1000)}`;
  }, [user?.id, user?.firstName, user?.username]);

  // Store cursors directly in a ref so Editor can access them
  const remoteCursors = useRef<{ [userId: string]: any }>({});
  const [cursorUpdateTick, setCursorUpdateTick] = useState(0); // to force re-render if needed

  useEffect(() => {
    const socket = getSocket();
    
    // Ensure the socket is connected (especially useful for React Strict Mode / Hot Reload)
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-room", { roomId, username: currentUser });

    socket.on("room-state", ({ code, users }) => {
      setCode(code);
      setUsers(users);
    });

    socket.on("code-update", ({ code, senderId }) => {
      if (senderId !== socket.id) {
        isRemoteChange.current = true;
        setCode(code);
      }
    });

    socket.on("cursor-update", (data) => {
      if (data.userId !== socket.id) {
        remoteCursors.current[data.userId] = data;
        setCursorUpdateTick(prev => prev + 1); // trigger a re-render so Editor gets new ref
      }
    });

    socket.on("users-update", (updatedUsers) => {
      setUsers(updatedUsers);
    });

    return () => {
      socket.off("room-state");
      socket.off("code-update");
      socket.off("cursor-update");
      socket.off("users-update");
      socket.disconnect();
    };
  }, [roomId, currentUser]);

  const handleCodeChange = (newCode: string) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    setCode(newCode);
    const socket = getSocket();
    socket.emit("code-change", { roomId, code: newCode });
  };

  const executeCode = async () => {
    setIsExecuting(true);
    setOutput("");
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.error && !data.output) {
        setError(data.error);
      } else {
        setOutput(data.output);
        if (data.error) setError(data.error);
      }
    } catch (err) {
      setError("Failed to connect to execution server");
    } finally {
      setIsExecuting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Room link copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            CollabCode
          </h1>
          <div className="px-3 py-1 bg-gray-800 rounded-md border border-gray-700 text-sm flex items-center space-x-2">
            <span className="text-gray-400">Room:</span>
            <span className="font-mono">{roomId}</span>
          </div>
          <button 
            onClick={copyLink}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 transition-colors rounded-md text-sm font-medium shadow-sm"
          >
            Copy Link
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2 mr-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900 shadow-sm transition-transform hover:scale-110 cursor-default"
                style={{ backgroundColor: user.color, color: "#fff" }}
                title={user.username}
              >
                {user.username[0].toUpperCase()}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-400">
            {users.length} connected
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden p-4 space-x-4">
        {/* Editor Panel (70%) */}
        <div className="w-2/3 flex flex-col space-y-4">
          <div className="flex justify-between items-center bg-gray-900 p-2 rounded-lg border border-gray-800">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors text-gray-200"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </select>
            
            <button
              onClick={executeCode}
              disabled={isExecuting}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors px-4 py-1.5 rounded-md text-sm font-semibold shadow-sm"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Run Code</span>
                </>
              )}
            </button>
          </div>
          
          <CodeEditor
            value={code}
            language={language}
            onChange={handleCodeChange}
            roomId={roomId}
            currentUser={currentUser}
            remoteCursors={remoteCursors.current}
            users={users}
          />
        </div>

        {/* Output Panel (30%) */}
        <div className="w-1/3 flex flex-col">
          <Output output={output} error={error} isLoading={isExecuting} />
        </div>
      </main>
    </div>
  );
}
