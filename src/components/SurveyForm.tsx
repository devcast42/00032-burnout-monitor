"use client";

import { useState, useEffect } from "react";

export default function SurveyForm({
  onSuccess,
  setFooterContent,
}: {
  onSuccess: () => void;
  setFooterContent?: (content: React.ReactNode) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Simular un envío rápido
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="py-4 text-center">
      <p className="text-sm text-zinc-400">
        El formulario se ha simplificado según lo solicitado.
      </p>
      {!setFooterContent && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Finalizar"}
        </button>
      )}
    </div>
  );
}
