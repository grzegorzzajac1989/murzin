import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";

export default function MicInput({ language, onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("SpeechRecognition API not supported");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === "PL" ? "pl-PL" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`mic-button${isListening ? " listening" : ""}`}
      title={isListening ? (language === "PL" ? "Nagrywanie..." : "Listening...") : (language === "PL" ? "Włącz mikrofon" : "Start microphone")}
      aria-label="Microphone"
    >
      <FaMicrophone size={20} />
    </button>
  );
}