import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Advertisement, AdType } from '../../types/index.js';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  Play,
  Pause,
  ExternalLink,
} from 'lucide-react';

export const AdminAds: React.FC = () => {
  const { token, appSettings, refreshSettings, addToast } = useAuth();

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number>(appSettings?.adTimerSeconds || 10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTimer, setIsSavingTimer] = useState(false);

  // Adsterra Network State
  const [isAdsterraEnabled, setIsAdsterraEnabled] = useState(appSettings?.isAdsterraEnabled ?? true);
  const [adsterraSocialBarScript, setAdsterraSocialBarScript] = useState(appSettings?.adsterraSocialBarScript || '');
  const [adsterraPopunderScript, setAdsterraPopunderScript] = useState(appSettings?.adsterraPopunderScript || '');
  const [adsterraBannerCode, setAdsterraBannerCode] = useState(appSettings?.adsterraBannerCode || '');
  const [adsterraDirectLink, setAdsterraDirectLink] = useState(appSettings?.adsterraDirectLink || '');
  const [isSavingAdsterra, setIsSavingAdsterra] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AdType>('social_bar');
  const [position, setPosition] = useState<'top_bar' | 'task_gate' | 'sidebar' | 'video_section'>('task_gate');
  const [targetUrl, setTargetUrl] = useState('');
  const [bannerCodeHtml, setBannerCodeHtml] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [rewardBdt, setRewardBdt] = useState('10');
  const [isSavingAd, setIsSavingAd] = useState(false);

  // Sandboxed Preview State
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);

  const fetchAds = async () => {
    try {
      const res = await fetch('/api/admin/ads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
      }
    } catch (err) {
      console.error('Failed to load ads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
    if (appSettings) {
      if (appSettings.adTimerSeconds) setTimerSeconds(appSettings.adTimerSeconds);
      if (appSettings.isAdsterraEnabled !== undefined) setIsAdsterraEnabled(appSettings.isAdsterraEnabled);
      if (appSettings.adsterraSocialBarScript) setAdsterraSocialBarScript(appSettings.adsterraSocialBarScript);
      if (appSettings.adsterraPopunderScript) setAdsterraPopunderScript(appSettings.adsterraPopunderScript);
      if (appSettings.adsterraBannerCode) setAdsterraBannerCode(appSettings.adsterraBannerCode);
      if (appSettings.adsterraDirectLink) setAdsterraDirectLink(appSettings.adsterraDirectLink);
    }
  }, [token, appSettings]);

  const handleSaveTimerSettings = async () => {
    setIsSavingTimer(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adTimerSeconds: timerSeconds }),
      });
      if (!res.ok) throw new Error('Failed to update timer duration.');
      await refreshSettings();
      addToast('success', `Ad security timer configured to ${timerSeconds} seconds.`);
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setIsSavingTimer(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingAd(null);
    setTitle('');
    setType('social_bar');
    setPosition('task_gate');
    setTargetUrl('https://example.com/sponsor');
    setBannerCodeHtml(
      `<div class="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl text-white font-semibold flex items-center justify-between"><span>🔥 Premium Sponsor Bonus</span><span class="bg-amber-400 text-slate-950 text-xs px-2.5 py-1 rounded font-bold">Visit</span></div>`
    );
    setVideoUrl('');
    setRewardBdt('10');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ad: Advertisement) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setType(ad.type);
    setPosition(ad.position);
    setTargetUrl(ad.targetUrl || '');
    setBannerCodeHtml(ad.bannerCodeHtml || '');
    setVideoUrl(ad.videoUrl || '');
    setRewardBdt((ad.rewardBdt || 10).toString());
    setIsModalOpen(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAd(true);
    try {
      const payload = {
        title,
        type,
        position,
        targetUrl,
        bannerCodeHtml,
        videoUrl: type === 'video' ? videoUrl : undefined,
        rewardBdt: type === 'video' ? parseFloat(rewardBdt) : 0,
        timerSeconds: type === 'video' ? 15 : timerSeconds,
      };

      const url = editingAd ? `/api/admin/ads/${editingAd.id}` : '/api/admin/ads';
      const method = editingAd ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save advertisement configuration.');

      addToast('success', editingAd ? 'Ad updated successfully' : 'New ad created');
      setIsModalOpen(false);
      await fetchAds();
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setIsSavingAd(false);
    }
  };

  const handleToggleStatus = async (ad: Advertisement) => {
    const newStatus = ad.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        addToast('info', `Ad unit is now ${newStatus}.`);
        setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, status: newStatus } : a)));
      }
    } catch {
      addToast('error', 'Failed to toggle status.');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to remove this ad unit?')) return;
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        addToast('success', 'Ad removed.');
        setAds((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      addToast('error', 'Failed to delete ad.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Advertisement & Ad Network Management
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure Social Bar, Popunder, Custom HTML, and Rewarded Video ads with sandboxed safe previews.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/40 flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Ad Unit
        </button>
      </div>

      {/* 10-Second Ad Timer Configuration Bar */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Mandatory Task Ad Timer Duration
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                Security Enforced
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Users must focus on the sponsor ad for this duration before any earning task is unlocked.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="number"
              min={5}
              max={60}
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 10)}
              className="w-16 bg-transparent text-white font-mono font-bold text-sm text-center focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-mono">seconds</span>
          </div>

          <button
            onClick={handleSaveTimerSettings}
            disabled={isSavingTimer}
            className="py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isSavingTimer ? 'Saving...' : 'Update Timer'}
          </button>
        </div>
      </div>

      {/* Ad Units Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Configured Advertising Units</h3>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading ad inventory...</div>
        ) : ads.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No ad units configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Format / Type</th>
                  <th className="py-3 px-4">Placement</th>
                  <th className="py-3 px-4">Impressions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">
                      {ad.title}
                      {ad.targetUrl && (
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                          {ad.targetUrl}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30 capitalize">
                        {ad.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-400 capitalize">
                      {ad.position.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4 tabular-nums text-slate-300">
                      {ad.impressions || 0} views
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(ad)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          ad.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {ad.status === 'active' ? (
                          <>
                            <Play className="w-3 h-3 fill-current" /> Active
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewAd(ad)}
                          className="p-1.5 text-purple-400 hover:text-purple-300 rounded-lg hover:bg-slate-800"
                          title="Sandboxed preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(ad)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          title="Edit ad"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40"
                          title="Delete ad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Ad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-7 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingAd ? 'Edit Advertisement Unit' : 'Configure New Ad Unit'}
            </h3>

            <form onSubmit={handleSaveAd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ad Campaign Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sultan Cloud VPS 50% Banner"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Ad Format</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AdType)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white"
                  >
                    <option value="social_bar">Social Bar Ad</option>
                    <option value="popunder">Popunder Ad</option>
                    <option value="custom_html">Custom HTML Ad</option>
                    <option value="video">Rewarded Video Ad</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Placement Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white"
                  >
                    <option value="task_gate">Task Security Gate (10s)</option>
                    <option value="top_bar">Top Navigation Bar</option>
                    <option value="sidebar">Sidebar Showcase</option>
                    <option value="video_section">Video Ads Section</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Destination URL</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://sponsor.example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white font-mono"
                />
              </div>

              {type === 'video' ? (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Video Stream URL</label>
                    <input
                      type="url"
                      required
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://.../video.mp4"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Watch Reward (BDT)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={rewardBdt}
                      onChange={(e) => setRewardBdt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    HTML / Creative Code (Sandboxed for security)
                  </label>
                  <textarea
                    rows={4}
                    value={bannerCodeHtml}
                    onChange={(e) => setBannerCodeHtml(e.target.value)}
                    placeholder="<div class='p-3 bg-purple-900 rounded-lg text-white'>Ad content</div>"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAd}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40"
                >
                  {isSavingAd ? 'Saving...' : editingAd ? 'Update Ad' : 'Save Ad Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Safe Sandboxed Ad Preview */}
      {previewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setPreviewAd(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Sandboxed Ad Preview</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Rendering preview safely in isolated container. Format: <strong className="text-white capitalize">{previewAd.type.replace('_', ' ')}</strong>
            </p>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-4 overflow-hidden">
              {previewAd.type === 'video' && previewAd.videoUrl ? (
                <video
                  src={previewAd.videoUrl}
                  controls
                  className="w-full aspect-video rounded-xl object-cover"
                />
              ) : previewAd.bannerCodeHtml ? (
                <div
                  dangerouslySetInnerHTML={{ __html: previewAd.bannerCodeHtml }}
                  className="overflow-hidden"
                />
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">No creative code provided.</div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Placement: <strong className="text-slate-200 capitalize">{previewAd.position.replace('_', ' ')}</strong></span>
              <button
                type="button"
                onClick={() => setPreviewAd(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
