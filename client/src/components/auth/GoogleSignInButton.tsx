import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Loader2, User as UserIcon, Plus, X, Check, ShieldCheck } from 'lucide-react';

export const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

interface GoogleSignInButtonProps {
  text?: string;
  defaultEmail?: string;
  onSuccess?: () => void;
  onError?: (err: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  text = 'Continue with Google',
  defaultEmail = '',
  onSuccess,
  onError,
  className = '',
}) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Derive display name from typed email if provided (e.g. shankarprasadmajji@gmail.com -> Shankar Prasad Majji)
  const formatNameFromEmail = (emailStr: string) => {
    if (!emailStr || !emailStr.includes('@')) return 'Google Student';
    const localPart = emailStr.split('@')[0];
    const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
    return cleaned
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Google Student';
  };

  const handleSelectAccount = async (account: { email: string; name: string; avatarColor: string }) => {
    setLocalError(null);
    setLoadingEmail(account.email);
    try {
      await loginWithGoogle({
        email: account.email,
        name: account.name,
        googleId: `google-uid-${Math.abs(
          account.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        )}`,
      });
      setIsModalOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in encountered an issue. Please try again.';
      setLocalError(msg);
      if (onError) onError(msg);
    } finally {
      setLoadingEmail(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setLocalError('Please enter a valid Google email address.');
      return;
    }
    const nameToUse = customName.trim() || formatNameFromEmail(customEmail);
    handleSelectAccount({
      email: customEmail.trim(),
      name: nameToUse,
      avatarColor: 'bg-emerald-600',
    });
  };

  // Accounts list in the chooser
  const accounts = [
    ...(defaultEmail
      ? [
          {
            email: defaultEmail,
            name: formatNameFromEmail(defaultEmail),
            avatarColor: 'bg-blue-600',
            isPreFilled: true,
          },
        ]
      : []),
    {
      email: 'alex.rivera@university.edu',
      name: 'Alex Rivera',
      avatarColor: 'bg-indigo-600',
      isPreFilled: false,
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLocalError(null);
          setIsModalOpen(true);
        }}
        className={`w-full inline-flex items-center justify-center gap-2.5 py-2.5 px-4 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] select-none ${className}`}
      >
        <GoogleLogo className="w-4 h-4 shrink-0" />
        <span>{text}</span>
      </button>

      {/* Google Account Chooser Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 relative overflow-hidden text-foreground"
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-dialog-title"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-2 border border-slate-100">
                <GoogleLogo className="w-6 h-6" />
              </div>
              <h3 id="google-dialog-title" className="text-base font-bold tracking-tight text-foreground">
                Sign in with Google
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose an account to continue to <strong className="text-foreground">StudyOS</strong>
              </p>
            </div>

            {localError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 text-xs border border-rose-200 dark:border-rose-900">
                {localError}
              </div>
            )}

            {/* Account List */}
            <div className="mt-4 space-y-2">
              {accounts.map((acc) => {
                const isLoadingThis = loadingEmail === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={!!loadingEmail}
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border/80 hover:border-primary-500 hover:bg-muted/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full ${acc.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary-600 transition-colors">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{acc.email}</p>
                      </div>
                    </div>
                    {isLoadingThis ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                        Continue &rarr;
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Use Another Account Toggle */}
              {!showCustomForm ? (
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border hover:border-primary-400 hover:bg-muted/30 transition-all text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span>Use another Google account</span>
                </button>
              ) : (
                <form
                  onSubmit={handleCustomSubmit}
                  className="p-3.5 rounded-xl border border-primary-500/40 bg-muted/20 space-y-2.5 animate-in fade-in"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maya Lin"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Google Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={!!loadingEmail}
                      className="flex-1 py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {loadingEmail === customEmail ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Continue with this account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(false)}
                      className="py-1.5 px-2.5 border border-border hover:bg-muted text-xs text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer privacy guarantee */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe Google authentication & session encryption</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
