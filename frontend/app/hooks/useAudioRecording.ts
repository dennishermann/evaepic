import { useState, useRef, useEffect } from "react";
import { useButton } from "@react-aria/button";

export function useAudioRecording(onTranscription?: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const voiceButtonRef = useRef<HTMLButtonElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        // Here you would typically send the audio to a speech-to-text service
        console.log("Audio recorded:", audioBlob);
        // For now, we'll just simulate transcription
        if (onTranscription) {
          onTranscription(" [Voice input recorded]");
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied. Please enable microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Cleanup media recorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    };
  }, [mediaRecorder, isRecording]);

  const { buttonProps: voiceButtonProps } = useButton(
    {
      onPress: () => {
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      },
      "aria-label": isRecording ? "Stop recording" : "Start voice input",
    },
    voiceButtonRef
  );

  return {
    isRecording,
    voiceButtonRef,
    voiceButtonProps,
    startRecording,
    stopRecording,
  };
}
