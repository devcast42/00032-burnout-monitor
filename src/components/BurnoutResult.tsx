"use client";

type PredictionResult = {
    prediction: number;
    burnout_probability: number;
    status: string;
};

export default function BurnoutResult({
    result,
    onClose,
}: {
    result: PredictionResult;
    onClose: () => void;
}) {
    const probability = (result.burnout_probability * 100).toFixed(1);
    const isBurnout = result.prediction === 1;

    return (
        <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
                <div
                    className={`rounded-full px-6 py-3 text-lg font-bold ${isBurnout
                            ? "bg-red-900/50 text-red-200 border border-red-800"
                            : "bg-green-900/50 text-green-200 border border-green-800"
                        }`}
                >
                    {result.status}
                </div>
            </div>

            {/* Probability */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center space-y-3">
                <p className="text-sm text-zinc-400">Probabilidad de Burnout</p>
                <p
                    className={`text-5xl font-bold ${isBurnout ? "text-red-400" : "text-green-400"
                        }`}
                >
                    {probability}%
                </p>

                {/* Progress bar */}
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${isBurnout
                                ? "bg-gradient-to-r from-orange-500 to-red-500"
                                : "bg-gradient-to-r from-green-500 to-emerald-500"
                            }`}
                        style={{ width: `${probability}%` }}
                    />
                </div>
            </div>

            {/* Prediction value */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
                <p className="text-sm text-zinc-400">Predicción</p>
                <p className="text-lg font-semibold text-white">
                    {isBurnout ? "1 — Tiene Burnout" : "0 — No tiene Burnout"}
                </p>
            </div>

            <button
                onClick={onClose}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
            >
                Entendido
            </button>
        </div>
    );
}
