"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [roomId, setRoomId] = useState("");

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("http://localhost:4000/api/rooms", {
        method: "POST"
      });
      const data = await res.json();
      router.push(`/room/${data.roomId}`);
    } catch (err) {
      console.error(err);
      // Fallback if backend is not running yet
      const fallbackId = Math.random().toString(36).substring(2, 8);
      router.push(`/room/${fallbackId}`);
    }
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Auth Header */}
      <div className="absolute top-4 right-4">
        <SignedOut>
          <div className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer">
            <SignInButton mode="modal" />
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            CollabCode
          </h1>
          <p className="text-gray-400">Real-time collaborative code editor</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={createRoom}
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-lg"
          >
            {isCreating ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            )}
            <span>Create New Room</span>
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-800"></div>
          </div>

          <form onSubmit={joinRoom} className="space-y-3">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
            <button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
