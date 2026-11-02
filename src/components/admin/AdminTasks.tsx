import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Task, TaskCategory, TaskSubmission } from '../../types/index.js';
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  Clock,
  Sparkles,
  X,
  History,
  ListCheck,
  CheckCircle2,
} from 'lucide-react';

export const AdminTasks: React.FC = () => {
  const { token, addToast } = useAuth();
  const { formatMoney } = useTheme();

  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('social_task');
  const [description, setDescription] = useState('');
  const [rewardBdt, setRewardBdt] = useState('20');
  const [durationSeconds, setDurationSeconds] = useState('30');
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [instructions, setInstructions] = useState('');
  const [dailyLimit, setDailyLimit] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/task-submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSubmissions();
  }, [token]);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setCategory('social_task');
    setDescription('');
    setRewardBdt('25');
    setDurationSeconds('30');
    setTargetUrl('https://example.com');
    setInstructions('Browse sponsor destination, stay active for required duration, and submit confirmation.');
    setDailyLimit('1');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setCategory(task.category);
    setDescription(task.description);
    setRewardBdt(task.rewardBdt.toString());
    setDurationSeconds(task.durationSeconds.toString());
    setTargetUrl(task.targetUrl);
    setInstructions(task.instructions);
    setDailyLimit(task.dailyLimit.toString());
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title,
        category,
        description,
        rewardBdt: parseFloat(rewardBdt),
        durationSeconds: parseInt(durationSeconds),
        targetUrl,
        instructions,
        dailyLimit: parseInt(dailyLimit),
      };

      const url = editingTask ? `/api/admin/tasks/${editingTask.id}` : '/api/admin/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save task.');

      addToast('success', editingTask ? 'Task updated successfully' : 'New task created successfully');
      setIsModalOpen(false);
      await fetchTasks();
    } catch (err: any) {
      addToast('error', err.message || 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        addToast('info', `Task status changed to ${newStatus}`);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
      }
    } catch {
      addToast('error', 'Failed to toggle task status.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        addToast('success', 'Task deleted successfully.');
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch {
      addToast('error', 'Failed to delete task.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Task Management
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure earning tasks, set timers and rewards, and inspect user submission logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'tasks' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListCheck className="w-3.5 h-3.5" />
              All Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'submissions' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Submissions ({submissions.length})
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="py-2 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/40 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* Tab 1: Tasks List Table */}
      {activeTab === 'tasks' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No tasks created yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Title & Category</th>
                    <th className="py-3 px-4">Reward</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Completions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-white">{task.title}</div>
                        <div className="text-[11px] text-purple-400 font-mono capitalize">
                          {task.category.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-emerald-400 font-bold text-sm">
                        ৳{task.rewardBdt}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-slate-300">
                        {task.durationSeconds}s
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-purple-300">
                        {task.completedCount || 0} users
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            task.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {task.status === 'active' ? (
                            <>
                              <Play className="w-3 h-3 fill-current" /> Active
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3" /> Paused
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Edit task"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 transition-colors"
                            title="Delete task"
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
      )}

      {/* Tab 2: Submissions History Table */}
      {activeTab === 'submissions' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Recent Task Completion Audit Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Reward</th>
                  <th className="py-3 px-4">Proof Note</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-white">{s.userName}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{s.taskTitle}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold tabular-nums">৳{s.rewardBdt}</td>
                    <td className="py-3 px-4 font-sans text-slate-400">{s.submittedProof}</td>
                    <td className="py-3 px-4 text-slate-500 font-sans text-[11px]">
                      {new Date(s.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 sm:p-7 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingTask ? 'Edit Earning Task' : 'Create New Earning Task'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow SULTAN EARN on Telegram"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white"
                  >
                    <option value="social_task">Social Task</option>
                    <option value="web_visit">Web Visit</option>
                    <option value="survey">Survey</option>
                    <option value="app_review">App Review</option>
                    <option value="video">Video Task</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Reward (BDT)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rewardBdt}
                    onChange={(e) => setRewardBdt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Daily Limit per User</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target URL</label>
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://t.me/example"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of why user is completing this task..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Step-by-step Instructions</label>
                <textarea
                  rows={3}
                  required
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Clear instructions for the user..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40"
                >
                  {isSaving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
