"use client";

import { useEffect, useRef, useState, useCallback, FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Camera, Check, X } from "lucide-react";
import jsQR from "jsqr";
import styles from "./QrDeliveryScanner.module.css";

interface QrDeliveryScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { orderId: string; rawUrl?: string }) => void;
  targetOrderId?: string;
}

const spring = { type: "spring" as const, stiffness: 380, damping: 30 };

function playScanSuccessChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  } catch {
    // ignore audio restriction
  }
}

export function extractOrderId(scannedText: string): string {
  if (!scannedText) return "";

  // Try matching /client/pickup/:id
  const matchUrl = scannedText.match(/\/client\/pickup\/([^/?#]+)/i);
  if (matchUrl && matchUrl[1]) {
    return decodeURIComponent(matchUrl[1]);
  }

  // Try parsing JSON if ticket
  try {
    const parsed = JSON.parse(scannedText);
    if (parsed && typeof parsed.id === "string") {
      return parsed.id;
    }
  } catch {
    // Not JSON
  }

  // Raw ID fallback
  return scannedText.trim();
}

export default function QrDeliveryScanner({
  isOpen,
  onClose,
  onSuccess,
  targetOrderId,
}: QrDeliveryScannerProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{ orderId: string } | null>(null);
  const [manualCode, setManualCode] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleRecognizedCode = useCallback(
    (rawData: string) => {
      const extracted = extractOrderId(rawData);
      if (!extracted) return;

      playScanSuccessChime();
      stopCamera();
      setScannedResult({ orderId: extracted });

      setTimeout(() => {
        onSuccess({ orderId: extracted, rawUrl: rawData });
      }, 1000);
    },
    [stopCamera, onSuccess],
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scanLoopRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      scanLoopRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data) {
      handleRecognizedCode(code.data);
      return;
    }

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  }, [handleRecognizedCode]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Cámara no disponible en este dispositivo");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        scanLoopRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo acceder a la cámara";
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [scanFrame]);

  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setManualCode("");
      void startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleRecognizedCode(manualCode.trim());
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={styles.scannerModal}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        aria-label="Escanear QR de entrega"
      >
        {/* Cabecera limpia */}
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>Entrega en mostrador</p>
            <h1 className={styles.title}>Escanear código QR</h1>
            <p className={styles.subtitle}>
              Apunta la cámara al código QR del estudiante para validar la entrega
            </p>
          </div>

          <motion.button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Cerrar escáner"
            whileHover={reduce ? undefined : { scale: 1.05 }}
            whileTap={reduce ? undefined : { scale: 0.94 }}
          >
            <X />
          </motion.button>
        </header>

        {/* Visor central de cámara */}
        <div className={styles.viewportContainer}>
          <div className={styles.viewportCard}>
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={styles.video}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Guía sutil de escaneo */}
            {cameraActive && !scannedResult && (
              <div className={styles.cameraGuide} />
            )}

            {/* Error de cámara */}
            {cameraError && !scannedResult && (
              <div className={styles.cameraError}>
                <Camera className={styles.cameraErrorIcon} />
                <p className={styles.cameraErrorTitle}>Cámara no disponible</p>
                <p className={styles.cameraErrorMsg}>{cameraError}</p>
              </div>
            )}

            {/* Pantalla de confirmación al validar */}
            <AnimatePresence>
              {scannedResult && (
                <motion.div
                  className={styles.verifiedOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={spring}
                  >
                    <Check className={styles.verifiedIcon} />
                  </motion.div>
                  <h2 className={styles.verifiedTitle}>¡QR Validado!</h2>
                  <p className={styles.verifiedMeta}>
                    Pedido #{scannedResult.orderId.replace(/^[^\d]*/, "") || scannedResult.orderId} confirmado
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Acciones inferiores reales */}
        <footer className={styles.actions}>
          {targetOrderId ? (
            <motion.button
              type="button"
              onClick={() => handleRecognizedCode(targetOrderId)}
              className={styles.confirmBtn}
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              transition={spring}
            >
              <Check style={{ width: 20, height: 20 }} />
              <span>Confirmar entrega de pedido #{targetOrderId.replace(/^[^\d]*/, "") || targetOrderId}</span>
            </motion.button>
          ) : (
            <form onSubmit={handleManualSubmit} className={styles.manualForm}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="O ingresa el ID del pedido manualmente..."
                className={styles.manualInput}
              />
              <button type="submit" className={styles.manualBtn}>
                Validar
              </button>
            </form>
          )}
        </footer>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
