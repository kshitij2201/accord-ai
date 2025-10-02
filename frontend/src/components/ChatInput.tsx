import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  AlertCircle,
  Smile,
  Mic,
  MicOff,
  Paperclip,
  FileText,
  Image,
  X,
} from "lucide-react";

// ✅ Extend window for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendFile: (file: File, customPrompt?: string) => void;
  isLoading: boolean;
  error: string | null;
  isListening: boolean;
  onVoiceInput: (text: string) => void;
  setIsListening: (val: boolean) => void;
  setIsTyping: (val: boolean) => void; // ✅ typing detection prop
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendFile,
  isLoading,
  error,
  isListening,
  onVoiceInput,
  setIsListening,
  setIsTyping,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedFile) {
      onSendFile(selectedFile, message.trim() || undefined);
      setSelectedFile(null);
      setMessage("");
      setIsTyping(false); // reset typing after file send
    } else if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      setIsTyping(false); // reset typing after message send
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/tiff",
      ];

      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert("Please select a PDF, Word document, or image file.");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf")
      return <FileText size={16} className="text-red-600" />;
    if (file.type.includes("word") || file.type.includes("document"))
      return <FileText size={16} className="text-cyan-600" />;
    if (file.type.startsWith("image/"))
      return <Image size={16} className="text-green-600" />;
    return <FileText size={16} className="text-gray-600" />;
  };

  const getFileTypeDescription = (file: File) => {
    if (file.type === "application/pdf") return "PDF Document";
    if (file.type.includes("word") || file.type.includes("document"))
      return "Word Document";
    if (file.type.startsWith("image/")) return "Image (OCR)";
    return "Document";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any); // force type since it's a form event
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!isListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Speech recognition not supported in this browser.");
      setIsListening(false);
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; ++i)
        transcript += event.results[i][0].transcript;
      setMessage(transcript);
      setIsTyping(transcript.trim().length > 0); // ✅ typing from voice
      onVoiceInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, setIsListening, setIsTyping, onVoiceInput]);

  const handleMicClick = () => setIsListening(!isListening);
  const handleAttachClick = () => fileInputRef.current?.click();
  const canSubmit = (message.trim() || selectedFile) && !isLoading && !disabled;

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Character Count Display */}
        <div className="mb-2 text-xs font-semibold text-slate-500 text-right">
          {message.length} character{message.length !== 1 ? "s" : ""}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {selectedFile && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getFileIcon(selectedFile)}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-blue-800 block truncate">
                    {selectedFile.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                    <span>{getFileTypeDescription(selectedFile)}</span>
                    <span>•</span>
                    <span>
                      ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-blue-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {message.trim()
                ? "Custom prompt will be used with file content"
                : "File will be analyzed automatically"}
            </p>
          </div>
        )}

        <div className="relative">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            {/* Mic Button */}
            <button
              type="button"
              onClick={handleMicClick}
              disabled={disabled}
              className={`flex-shrink-0 w-12 h-12 rounded-xl ${
                isListening
                  ? "bg-red-100 text-red-600 animate-pulse shadow-lg"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 shadow-sm"
              } flex items-center justify-center transition-all duration-200 ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
              }`}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* File Upload */}
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={disabled}
              className={`flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600 shadow-sm flex items-center justify-center transition-all duration-200 ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
              }`}
              title="Upload Files"
            >
              <Paperclip size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Text Area */}
            <div className="flex-1 relative">
              <div className="relative bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-blue-500 focus-within:shadow-lg">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setIsTyping(e.target.value.trim().length > 0); // ✅ typing detect
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    disabled
                      ? "Upgrade to continue chatting..."
                      : selectedFile
                      ? "Add a custom prompt for the file (optional)..."
                      : "Type your message here..."
                  }
                  disabled={isLoading || disabled}
                  className="w-full resize-none rounded-2xl px-4 py-4 pr-12 text-sm leading-6 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] max-h-[120px] bg-transparent placeholder:text-slate-400 text-slate-800"
                  rows={1}
                />
                <button
                  type="button"
                  disabled={disabled}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                >
                  <Smile size={18} />
                </button>
              </div>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                canSubmit
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title={selectedFile ? "Send File" : "Send message"}
            >
              <Send
                size={20}
                className={`transition-transform duration-200 ${
                  canSubmit
                    ? "hover:translate-x-0.5 hover:-translate-y-0.5"
                    : ""
                }`}
              />
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-3 text-xs text-slate-500 text-center">
          <span className="hidden sm:inline">
            Press Enter to send • Shift+Enter for new line • Click 📎 to upload
            files • 🎤 for voice input
          </span>
          <span className="sm:hidden">
            Tap to send • 📎 files • 🎤 voice
          </span>
        </div>
      </div>
    </div>
  );
};
