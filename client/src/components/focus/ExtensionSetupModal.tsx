import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ExternalLink,
  RefreshCw,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { checkExtensionStatus, ExtensionStatus } from '../../services/focusExtension.js';

interface ExtensionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: ExtensionStatus) => void;
}

export const ExtensionSetupModal: React.FC<ExtensionSetupModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const extensionFolderPath = 'c:\\Users\\Shankar\\STUDY PLANNER\\extension';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(extensionFolderPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsChecking(true);
    setTestResult(null);
    try {
      const status = await checkExtensionStatus();
      onStatusChange(status);
      if (status.isAvailable) {
        setTestResult({
          connected: true,
          message: `Connected successfully! Extension v${status.version || '1.0.0'} is active and ready to enforce website blocking.`,
        });
      } else {
        setTestResult({
          connected: false,
          message:
            'Extension not yet detected. Make sure you loaded the unpacked folder in chrome://extensions and refreshed this page.',
        });
      }
    } catch {
      setTestResult({
        connected: false,
        message: 'Could not connect to extension. Please ensure it is enabled in your browser.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden text-foreground"
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="setup-modal-title" className="text-lg font-bold text-foreground">
                Connect Distraction Blocker
              </h2>
              <Badge variant="info" size="sm">
                Manifest V3
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Real website blocking is enforced natively through the StudyOS Chrome companion extension. Follow these 3 quick steps to activate it.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 mb-6 text-xs text-foreground">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Open Extensions Page & Enable Developer Mode
              </p>
              <p className="text-muted-foreground leading-relaxed">
                In Chrome, Edge, or Brave, open a new tab and go to{' '}
                <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-primary-600 dark:text-primary-400">
                  chrome://extensions
                </code>{' '}
                (or <code className="px-1.5 py-0.5 bg-muted rounded font-mono">edge://extensions</code>).
                Toggle <strong className="text-foreground">Developer mode</strong> in the top-right corner to <strong>ON</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div className="space-y-1.5 flex-1">
              <p className="font-semibold text-foreground">
                Click "Load Unpacked" & Select Extension Folder
              </p>
              <p className="text-muted-foreground">
                Click the <strong className="text-foreground">Load unpacked</strong> button and select the extension directory:
              </p>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border font-mono text-[11px] text-muted-foreground">
                <FolderOpen className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <span className="truncate flex-1">{extensionFolderPath}</span>
                <button
                  type="button"
                  onClick={handleCopyPath}
                  className="p-1 hover:text-foreground transition-colors shrink-0"
                  title="Copy path"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Verify Connection</p>
              <p className="text-muted-foreground leading-relaxed">
                Once loaded, click <strong className="text-foreground">Test Connection</strong> below to confirm StudyOS has paired with the blocker.
              </p>
            </div>
          </div>
        </div>

        {/* Test Connection Feedback */}
        {testResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 mb-6 ${
              testResult.connected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}
          >
            {testResult.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{testResult.connected ? 'Connected!' : 'Detection Pending'}</p>
              <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleTestConnection}
            isLoading={isChecking}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Test Connection
          </Button>
        </div>
      </div>
    </div>
  );
};
