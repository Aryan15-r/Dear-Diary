import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Extend window type for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleCredential?: (credential: string) => void;
  googleClientId?: string;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  isRegistering?: boolean;
  googleRegData?: { email: string; displayName: string } | null;
  onClearGoogleReg?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/60 backdrop-blur-xl border border-white/20 p-5 w-64 shadow-xl`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-full" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-semibold text-foreground">{testimonial.name}</p>
      <p className="text-xs text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-xs text-foreground/90">{testimonial.text}</p>
    </div>
  </div>
);

// Google Sign-In Button using real Google Identity Services
const GoogleSignInButton = ({
  clientId,
  onCredential,
}: {
  clientId: string;
  onCredential: (credential: string) => void;
}) => {
  const btnRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiError, setGsiError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setGsiError('not_configured');
      return;
    }

    const initGsi = () => {
      if (!window.google?.accounts?.id) {
        setGsiError('not_configured');
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => {
            onCredential(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setGsiReady(true);
      } catch {
        setGsiError('not_configured');
      }
    };

    // GSI script may already be loaded or still loading
    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', initGsi, { once: true });
      } else {
        setGsiError('not_configured');
      }
    }
  }, [clientId, onCredential]);

  useEffect(() => {
    if (gsiReady && btnRef.current && window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: btnRef.current.offsetWidth || 400,
        text: 'continue_with',
        logo_alignment: 'center',
      });
    }
  }, [gsiReady]);

  if (gsiError === 'not_configured') {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-3 px-4 rounded-2xl border border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/10 text-center">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Google Sign-In requires setup</p>
        <p className="text-xs text-amber-600 dark:text-amber-500">
          Add your <span className="font-mono font-bold">VITE_GOOGLE_CLIENT_ID</span> to{' '}
          <span className="font-mono">frontend/.env</span> to enable this.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center relative min-h-[44px]">
      <div ref={btnRef} className="flex justify-center w-full" />
      {!gsiReady && (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground animate-pulse">Loading Google Sign-In...</span>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome to Dear Diary</span>,
  description = "Access your private journal and continue your personal journey",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleCredential,
  googleClientId = '',
  onResetPassword,
  onCreateAccount,
  isRegistering = false,
  googleRegData,
  onClearGoogleReg,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans w-full bg-background text-foreground">
      {/* Left column: sign-in / register form */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-3xl md:text-4xl font-bold leading-tight tracking-tight text-foreground">{title}</h1>
            <p className="animate-element animate-delay-200 text-sm text-muted-foreground">{description}</p>

            <form className="space-y-4" onSubmit={onSignIn}>
              {isRegistering && (
                <div className="animate-element animate-delay-250">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Display Name</label>
                  <GlassInputWrapper>
                    <input name="displayName" type="text" defaultValue={googleRegData?.displayName || ''} placeholder="Alex" className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none" />
                  </GlassInputWrapper>
                </div>
              )}

              <div className="animate-element animate-delay-300">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Email Address</label>
                {googleRegData && isRegistering ? (
                  <div className="flex items-center w-full rounded-2xl border border-border bg-secondary/40 p-3.5">
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{googleRegData.email}</span>
                    <input type="hidden" name="email" value={googleRegData.email} />
                    <button type="button" onClick={onClearGoogleReg} className="text-xs font-semibold text-primary hover:underline pr-1 ml-2">Change</button>
                  </div>
                ) : (
                  <GlassInputWrapper>
                    <input name="email" type="email" required placeholder="Enter your email address" className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none" />
                  </GlassInputWrapper>
                )}
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" required minLength={8} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-transparent text-sm p-3.5 pr-12 rounded-2xl focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {isRegistering && (
                <div className="animate-element animate-delay-450">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Promo Code (Optional)</label>
                  <GlassInputWrapper>
                    <input name="promoCode" type="text" placeholder="e.g. JOURNAL-X79K" className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none font-mono uppercase" />
                  </GlassInputWrapper>
                </div>
              )}

              {!isRegistering && (
                <div className="animate-element animate-delay-500 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="rememberMe" className="rounded border-border text-primary focus:ring-primary" />
                    <span className="text-foreground/90 font-medium">Keep me signed in</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-primary font-medium transition-colors">Reset password</a>
                </div>
              )}

              <button type="submit" className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {!(isRegistering && googleRegData) && (
              <>
                <div className="animate-element animate-delay-700 relative flex items-center justify-center my-2">
                  <span className="w-full border-t border-border/60"></span>
                  <span className="px-3 text-xs text-muted-foreground bg-background absolute font-medium">Or continue with</span>
                </div>

                <div className="animate-element animate-delay-800">
                  {onGoogleCredential ? (
                    <GoogleSignInButton clientId={googleClientId} onCredential={onGoogleCredential} />
                  ) : null}
                </div>
              </>
            )}

            <p className="animate-element animate-delay-900 text-center text-xs text-muted-foreground mt-2">
              {isRegistering ? 'Already have an account? ' : 'New to Dear Diary? '}
              <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-primary font-semibold hover:underline transition-colors">
                {isRegistering ? 'Sign In' : 'Create Account'}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center shadow-2xl" style={{ backgroundImage: `url(${heroImageSrc})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent rounded-3xl" />
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
