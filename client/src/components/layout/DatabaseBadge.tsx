import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle2, RefreshCw, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

export const DatabaseBadge: React.FC = () => {
  const { dbStatus, refreshDbStatus } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isConnected = dbStatus?.isConnected || false;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDbStatus();
    setIsRefreshing(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none ${
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
        }`}
        title="Click to view database connection status & configuration details"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <Database className="w-3.5 h-3.5" />
        <span>{isConnected ? 'MongoDB: Connected' : 'Demo Mode (No MongoDB URI)'}</span>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Database & Storage Architecture"
        description="StudyOS full-stack MongoDB configuration state"
        maxWidth="lg"
      >
        <div className="space-y-4 text-sm">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {isConnected
                  ? `Active Connection: Connected to MongoDB Database "${dbStatus?.databaseName || 'studyos'}"`
                  : 'Operating in Development Demo Mode (In-Memory Repository)'}
              </p>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                {isConnected
                  ? `Host: ${dbStatus?.host || 'MongoDB Cluster'}. All study schedules, subjects, topics, and analytics are actively persisting to MongoDB via Mongoose ODM.`
                  : 'Notice: MONGODB_URI has not yet been supplied in server/.env. StudyOS has safely started in interactive Demo Mode with sample university data. The full MongoDB Mongoose models and data layers are built and will automatically activate as soon as your MongoDB URI is added.'}
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-xl border border-border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              How to Connect Your MongoDB Instance
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-foreground font-mono">
              <li>Open <code className="bg-card px-1.5 py-0.5 rounded border">server/.env</code> in your editor</li>
              <li>Set <code className="bg-card px-1.5 py-0.5 rounded border">MONGODB_URI=mongodb+srv://&lt;user&gt;:&lt;pass&gt;@cluster.../studyos</code></li>
              <li>Or for local MongoDB: <code className="bg-card px-1.5 py-0.5 rounded border">MONGODB_URI=mongodb://localhost:27017/studyos</code></li>
              <li>Restart or refresh the backend server</li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              State: <code className="font-mono">{dbStatus?.state || 'unconfigured'}</code>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Re-check Connection
              </Button>
              <Button size="sm" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
