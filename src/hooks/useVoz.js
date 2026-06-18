// src/hooks/useVoz.js
// ──────────────────────────────────────────────────────────────
// Hook personalizado para dictado por voz usando Web Speech API.
// Extrae el primer número reconocido del texto hablado.
// ──────────────────────────────────────────────────────────────
import { useState, useRef, useCallback } from "react";

export function useVoz() {
  const [escuchando, setEscuchando] = useState(false);
  const [soportado] = useState(() => "SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const reconRef = useRef(null);

  /**
   * Inicia el reconocimiento de voz y llama a `onResultado(numero)` con el primer
   * número entero detectado en el habla.
   * @param {function} onResultado – Callback que recibe el número como string
   */
  const iniciarDictado = useCallback((onResultado) => {
    if (!soportado) {
      alert("Tu navegador no soporta dictado por voz. Usa Chrome en Android.");
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recon = new SR();
    reconRef.current = recon;

    recon.lang = "es-MX";
    recon.continuous = false;
    recon.interimResults = false;
    recon.maxAlternatives = 1;

    recon.onstart = () => setEscuchando(true);
    recon.onend   = () => setEscuchando(false);

    recon.onresult = (event) => {
      const texto = event.results[0][0].transcript;
      // Extraer el primer número del texto hablado
      const match = texto.match(/\d+([.,]\d+)?/);
      if (match) {
        const numero = match[0].replace(",", ".");
        onResultado(numero);
      }
    };

    recon.onerror = (e) => {
      console.warn("Error de voz:", e.error);
      setEscuchando(false);
    };

    recon.start();
  }, [soportado]);

  const detenerDictado = useCallback(() => {
    reconRef.current?.stop();
    setEscuchando(false);
  }, []);

  return { escuchando, soportado, iniciarDictado, detenerDictado };
}
