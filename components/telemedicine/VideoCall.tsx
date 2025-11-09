// components/telemedicine/VideoCall.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertCircle } from "lucide-react";

interface VideoCallProps {
  roomUrl: string;
  displayName: string; // The user's name to display in the call
}

export function VideoCall({ roomUrl, displayName }: VideoCallProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const [callState, setCallState] = useState<"loading" | "joined" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!videoContainerRef.current) return;

    const frame = DailyIframe.createFrame(videoContainerRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        position: "absolute",
        width: "100%",
        height: "100%",
        border: "0",
      },
    });
    callFrameRef.current = frame;

    const handleJoined = () => setCallState("joined");
    const handleError = (e: unknown) => {
      const message = e instanceof Error ? e.message : (e && typeof e === 'object' && 'errorMsg' in e ? String((e as any).errorMsg) : 'An unknown error occurred.');
      console.error("Daily.co error:", message);
      setErrorMessage(message);
      setCallState("error");
    };
    const handleLeft = () => {
      // Could redirect or show a "Call ended" message
      console.log("Left the call");
    };

    frame.on("joined-meeting", handleJoined);
    frame.on("error", handleError);
    frame.on("left-meeting", handleLeft);

    frame.join({ url: roomUrl, userName: displayName }).catch(handleError);

    return () => {
      frame.off("joined-meeting", handleJoined);
      frame.off("error", handleError);
      frame.off("left-meeting", handleLeft);
      callFrameRef.current?.destroy();
    };
  }, [roomUrl, displayName]);

  return (
    <div
      ref={videoContainerRef}
      className="relative h-full w-full min-h-[500px] rounded-lg bg-black"
    >
      {callState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <LoadingSpinner className="text-white" />
          <p className="mt-4">Joining your secure consultation...</p>
        </div>
      )}
      {callState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-red-900/50 p-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="mt-4 font-semibold">Could not join the call</p>
          <p className="mt-2 text-sm text-red-200">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
