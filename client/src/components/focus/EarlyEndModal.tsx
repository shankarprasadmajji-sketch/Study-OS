import React from 'react';
import { AlertTriangle, X, Play } from 'lucide-react';
import { Button } from '../ui/Button.js';

interface EarlyEndModalProps {
  isOpen: boolean;
  minutesRemaining: number;
  onCancel: () => void;
  onConfirmEnd: () => void;
}

export const EarlyEndModal: React.FC<EarlyEndModalProps> = ({
  isOpen,
  minutesRemaining,
  onCancel,
  onConfirmEnd,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-7 relative text-foreground text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="early-end-title"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 id="early-end-title" className="text-base font-bold text-foreground mb-1.5">
          End Focus Session Early?
        </h3>

        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          You still have approximately <strong className="text-foreground">{minutesRemaining} minutes</strong> remaining in this interval.
          Ending early will release distraction blocking and restore normal browsing access.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button
            size="sm"
            onClick={onCancel}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            className="w-full sm:w-auto shadow-sm"
          >
            Keep Focusing
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={onConfirmEnd}
            className="w-full sm:w-auto"
          >
            End Session Early
          </Button>
        </div>
      </div>
    </div>
  );
};
