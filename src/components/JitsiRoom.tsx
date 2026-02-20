"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";

type JitsiRoomProps = {
 roomName: string;
 displayName: string;
 onCallEnd?: () => void;
 onRecordingReady?: (blob: Blob) => void;
};

export default function JitsiRoom({
 roomName,
 displayName,
 onCallEnd,
 onRecordingReady,
}: JitsiRoomProps) {
 const [isRecording, setIsRecording] = useState(false);
 const [recordingTime, setRecordingTime] = useState(0);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const chunksRef = useRef<Blob[]>([]);
 const timerRef = useRef<NodeJS.Timeout | null>(null);
 const streamRef = useRef<MediaStream | null>(null);

 const stopRecording = useCallback(() => {
  if (
   mediaRecorderRef.current &&
   mediaRecorderRef.current.state !== "inactive"
  ) {
   mediaRecorderRef.current.stop();
  }
  if (timerRef.current) {
   clearInterval(timerRef.current);
   timerRef.current = null;
  }
  if (streamRef.current) {
   streamRef.current.getTracks().forEach((track) => track.stop());
   streamRef.current = null;
  }
  setIsRecording(false);
  setRecordingTime(0);
 }, []);

 const startRecording = useCallback(async () => {
  try {
   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
   streamRef.current = stream;
   const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
   chunksRef.current = [];

   recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunksRef.current.push(e.data);
   };

   recorder.onstop = () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (onRecordingReady) onRecordingReady(blob);
    chunksRef.current = [];
   };

   recorder.start(1000); // collect chunks every second
   mediaRecorderRef.current = recorder;
   setIsRecording(true);

   timerRef.current = setInterval(() => {
    setRecordingTime((prev) => prev + 1);
   }, 1000);
  } catch (err) {
   console.error("Error al iniciar grabación:", err);
  }
 }, [onRecordingReady]);

 useEffect(() => {
  return () => {
   stopRecording();
  };
 }, [stopRecording]);

 const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
   .toString()
   .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
 };

 return (
  <div className="flex flex-col gap-4">
   {/* Recording controls */}
   <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
    {isRecording ? (
     <>
      <span className="flex items-center gap-2 text-sm font-medium text-red-600">
       <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
       Grabando {formatTime(recordingTime)}
      </span>
      <button
       onClick={stopRecording}
       className="ml-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
      >
       Detener grabación
      </button>
     </>
    ) : (
     <>
      <span className="text-sm text-zinc-600">
       Graba la sesión para transcripción automática
      </span>
      <button
       onClick={startRecording}
       className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
       Iniciar grabación
      </button>
     </>
    )}
   </div>

   {/* Jitsi Meeting */}
   <div className="overflow-hidden rounded-xl border border-zinc-200">
    <JitsiMeeting
     domain="meet.jit.si"
     roomName={roomName}
     configOverwrite={{
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      prejoinPageEnabled: false,
      disableDeepLinking: true,
     }}
     interfaceConfigOverwrite={{
      MOBILE_APP_PROMO: false,
      TOOLBAR_BUTTONS: [
       "microphone",
       "camera",
       "closedcaptions",
       "desktop",
       "fullscreen",
       "hangup",
       "chat",
       "settings",
       "videoquality",
       "tileview",
      ],
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
     }}
     userInfo={{ displayName, email: "" }}
     getIFrameRef={(iframeRef) => {
      if (iframeRef) {
       iframeRef.style.height = "600px";
       iframeRef.style.width = "100%";
      }
     }}
     onReadyToClose={() => {
      if (isRecording) stopRecording();
      if (onCallEnd) onCallEnd();
     }}
    />
   </div>
  </div>
 );
}
