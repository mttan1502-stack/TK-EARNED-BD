import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdsterraAdBannerProps {
  placement?: 'top_bar' | 'task_gate' | 'spin_wheel' | 'math_quiz' | 'sidebar';
  className?: string;
}

export const AdsterraAdBanner: React.FC<AdsterraAdBannerProps> = ({ placement = 'top_bar', className = '' }) => {
  const { appSettings } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const isEnabled = appSettings?.isAdsterraEnabled ?? true;
  const bannerCode = appSettings?.adsterraBannerCode;
  const directLink = appSettings?.adsterraDirectLink;

  // Dynamically execute scripts if present inside bannerCode safely
  useEffect(() => {
    if (!isEnabled || !containerRef.current || !bannerCode) return;

    // If banner contains script tag, inject safely
    if (bannerCode.includes('<script')) {
      const container = containerRef.current;
      container.innerHTML = ''; // Clear previous

      const wrapper = document.createElement('div');
      wrapper.innerHTML = bannerCode;

      const scripts = wrapper.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      container.appendChild(wrapper);
    }
  }, [isEnabled, bannerCode]);

  // Handle global popunder or social bar if on window
  useEffect(() => {
    if (!isEnabled) return;

    if (appSettings?.adsterraSocialBarScript && appSettings.adsterraSocialBarScript.trim().startsWith('http')) {
      const scriptId = 'adsterra-social-bar';
      if (!document.getElementById(scriptId)) {
        const s = document.createElement('script');
        s.id = scriptId;
        s.type = 'text/javascript';
        s.src = appSettings.adsterraSocialBarScript.trim();
        s.async = true;
        document.body.appendChild(s);
      }
    }
  }, [isEnabled, appSettings?.adsterraSocialBarScript]);

  if (!isEnabled) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900/90 border border-purple-500/30 p-3 text-center shadow-lg transition-all ${className}`}>
      {/* Subtle sponsor badge */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Sponsored Partner · Adsterra
        </span>
        {directLink && (
          <a
            href={directLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-purple-300 flex items-center gap-1 underline transition-colors"
          >
            Visit Sponsor <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      {/* Render Banner content */}
      {bannerCode ? (
        <div ref={containerRef} className="flex justify-center items-center overflow-hidden min-h-[60px]">
          {/* Fallback HTML render if simple */}
          {!bannerCode.includes('<script') && (
            <div dangerouslySetInnerHTML={{ __html: bannerCode }} />
          )}
        </div>
      ) : (
        <div className="py-2.5 px-4 bg-purple-950/30 border border-purple-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="text-left">
            <div className="text-xs font-bold text-white">Adsterra High CPM Network</div>
            <div className="text-[11px] text-slate-400">Admin can update this ad script directly in Admin Ads Panel.</div>
          </div>
          {directLink && (
            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow transition-all shrink-0"
            >
              Earn Bonus
            </a>
          )}
        </div>
      )}
    </div>
  );
};
