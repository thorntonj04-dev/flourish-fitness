import React, { useState, useEffect } from 'react';
import { ref as dbRef, get, set } from 'firebase/database';
import { db } from '../../firebase';
import {
  Layers, Dumbbell, UserPlus, RefreshCw, Clock,
  Eye, X, Mail, Users, CalendarDays,
} from 'lucide-react';
import AssignProgramModal from './AssignProgramModal';
import AssignWorkoutScheduleModal from './AssignWorkoutScheduleModal';
import ClientDetailView from './ClientDetailView';

export default function ManageClients() {
  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [pendingClients, setPendingClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientSchedules, setClientSchedules] = useState({});
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [scheduleClient, setScheduleClient] = useState(null);
  const [detailClient, setDetailClient] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [addingClient, setAddingClient] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [usersSnap, programsSnap, assignmentsSnap, pendingSnap] = await Promise.all([
        get(dbRef(db, 'users')),
        get(dbRef(db, 'programs')),
        get(dbRef(db, 'programAssignments')),
        get(dbRef(db, 'pendingClients')),
      ]);

      // Fetch separately so a missing/undeployed rule doesn't crash the whole page
      const schedulesSnap = await get(dbRef(db, 'clientSchedules')).catch(() => null);

      if (usersSnap.exists()) {
        const clientList = Object.entries(usersSnap.val())
          .filter(([, u]) => u.role === 'client')
          .map(([id, u]) => ({ id, ...u }))
          .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
        setClients(clientList);
      }

      if (programsSnap.exists()) {
        const programList = Object.entries(programsSnap.val())
          .filter(([, p]) => !p.archived)
          .map(([id, p]) => ({ id, ...p }));
        setPrograms(programList);
      }

      if (assignmentsSnap.exists()) setAssignments(assignmentsSnap.val());
      if (schedulesSnap?.exists()) setClientSchedules(schedulesSnap.val());

      if (pendingSnap.exists()) {
        setPendingClients(Object.values(pendingSnap.val()));
      } else {
        setPendingClients([]);
      }
    } catch (err) {
      console.error('Error loading client data:', err);
      if (err?.code === 'PERMISSION_DENIED' || err?.message?.includes('permission')) {
        setLoadError('permission');
      } else {
        setLoadError('unknown');
      }
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (client) => {
    setSelectedClient(client);
    setShowAssignModal(true);
  };

  const handleAddClient = async () => {
    const email = newClientEmail.trim().toLowerCase();
    if (!email) { alert('Please enter an email address.'); return; }
    const key = email.replace(/\./g, ',');
    const data = {
      name: newClientName.trim() || email.split('@')[0],
      email,
      role: 'client',
      invitedAt: new Date().toISOString(),
    };
    setAddingClient(true);
    try {
      await set(dbRef(db, `pendingClients/${key}`), data);
      setNewClientName('');
      setNewClientEmail('');
      setShowAddClient(false);
      loadAll();
    } catch (err) {
      console.error('Error adding client:', err);
      alert('Failed to add client. Please try again.');
    } finally {
      setAddingClient(false);
    }
  };

  const getProgressLabel = (assignment) => {
    if (!assignment) return null;
    const program = programs.find(p => p.id === assignment.programId);
    if (!program) return null;
    const phase = program.phases?.[assignment.currentPhase];
    if (!phase) return null;
    return `${phase.name} · Week ${assignment.currentWeek}/${phase.durationWeeks}`;
  };

  // ─── Client detail view ────────────────────────────────────────────────────
  if (detailClient) {
    return <ClientDetailView client={detailClient} onBack={() => setDetailClient(null)} />;
  }

  // ─── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-200" />
              <span className="text-blue-100 text-sm font-medium">Your Roster</span>
            </div>
            <h2 className="text-2xl font-bold">Clients</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {clients.length} active{pendingClients.length > 0 ? ` · ${pendingClients.length} pending` : ''}
            </p>
          </div>
          <button
            onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 bg-white/20 active:bg-white/30 text-white rounded-xl px-4 py-2.5 font-semibold text-sm min-h-[44px] flex-shrink-0 mt-1"
          >
            <UserPlus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl p-4 border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse">
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Pending invites */}
          {pendingClients.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wide px-1">
                Pending Invites
              </h3>
              {pendingClients.map(pc => (
                <div
                  key={pc.email}
                  className="bg-white dark:bg-[#1E3328] rounded-2xl p-4 border border-amber-200 dark:border-amber-700/40 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-[#d8e7de] truncate">{pc.name}</div>
                    <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 truncate">{pc.email}</div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Awaiting sign-up</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active clients */}
          {loadError ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-700/40 text-center">
              <p className="font-semibold text-red-700 dark:text-red-400 mb-1">
                {loadError === 'permission' ? 'Permission denied loading clients' : 'Error loading clients'}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400/80">
                {loadError === 'permission'
                  ? 'Your account may not have the admin role set in Firebase. Go to Firebase Console → Realtime Database → users → your UID and make sure role is "admin".'
                  : 'An unexpected error occurred. Check the browser console for details.'}
              </p>
              <button onClick={loadAll} className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400 underline">
                Retry
              </button>
            </div>
          ) : clients.length === 0 ? (
            <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-8 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-gray-300 dark:text-[#d8e7de]/20 mb-3" />
              <p className="text-gray-500 dark:text-[#d8e7de]/60 mb-1">No active clients yet.</p>
              <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">
                Use "Add Client" above to invite your first client.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map(client => {
                const assignment = assignments[client.id];
                const progressLabel = getProgressLabel(assignment);

                return (
                  <div
                    key={client.id}
                    className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden"
                  >
                    {/* Client info row */}
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {(client.name || client.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">
                          {client.name || client.email}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 truncate">{client.email}</div>
                        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                          Joined {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                      <button
                        onClick={() => setDetailClient(client)}
                        className="flex-shrink-0 p-2.5 rounded-xl border border-gray-200 dark:border-[#C6A45F]/25 text-gray-500 dark:text-[#d8e7de]/60 active:bg-gray-100 dark:active:bg-[#0a0a0a]/30 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="View as client"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Program status + action */}
                    <div className="px-4 pb-4 space-y-2">
                      {assignment ? (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                          <div className="flex items-start gap-2">
                            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm truncate">
                                {assignment.programName}
                              </div>
                              {progressLabel && (
                                <div className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">
                                  {progressLabel}
                                </div>
                              )}
                              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600/60 dark:text-emerald-500/60">
                                <Clock className="w-3 h-3" />
                                Started {new Date(assignment.startDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (() => {
                        const sched = clientSchedules[client.id];
                        const schedDays = sched
                          ? Object.values(sched).filter(Boolean).length
                          : 0;
                        return schedDays > 0 ? (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                                {schedDays} workout{schedDays !== 1 ? 's' : ''} scheduled per week
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-[#0a0a0a]/30 rounded-xl p-3 text-center">
                            <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">No program or workouts assigned</p>
                          </div>
                        );
                      })()}

                      <div className="flex gap-2">
                        <button
                          onClick={() => openAssignModal(client)}
                          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px] transition ${
                            assignment
                              ? 'border border-gray-200 dark:border-[#C6A45F]/25 text-gray-700 dark:text-[#d8e7de]/80 active:border-emerald-400'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {assignment
                            ? <><RefreshCw className="w-4 h-4" /> Program</>
                            : <><UserPlus className="w-4 h-4" /> Assign Program</>
                          }
                        </button>
                        <button
                          onClick={() => setScheduleClient(client)}
                          className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px] border border-gray-200 dark:border-[#C6A45F]/25 text-gray-700 dark:text-[#d8e7de]/80 active:border-blue-400 transition"
                        >
                          <CalendarDays className="w-4 h-4" /> Set Workouts
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Assign program modal */}
      {showAssignModal && selectedClient && (
        <AssignProgramModal
          client={selectedClient}
          programs={programs}
          existingAssignment={assignments[selectedClient.id] || null}
          onClose={() => { setShowAssignModal(false); setSelectedClient(null); }}
          onSaved={() => { setShowAssignModal(false); setSelectedClient(null); loadAll(); }}
        />
      )}

      {/* Assign workout schedule modal */}
      {scheduleClient && (
        <AssignWorkoutScheduleModal
          client={scheduleClient}
          existingSchedule={clientSchedules[scheduleClient.id] || null}
          onClose={() => setScheduleClient(null)}
          onSaved={(newSchedule) => {
            setClientSchedules(prev => ({ ...prev, [scheduleClient.id]: newSchedule }));
            setScheduleClient(null);
          }}
        />
      )}

      {/* Add client modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-[#1E3328] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm">
            <div className="p-5 border-b border-gray-200 dark:border-[#C6A45F]/25 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">Add New Client</h3>
                <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">They'll sign up with this email</p>
              </div>
              <button
                onClick={() => setShowAddClient(false)}
                className="p-2.5 rounded-xl active:bg-gray-100 dark:active:bg-[#0a0a0a]/40 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johnson"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-base focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] dark:placeholder-[#d8e7de]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="client@email.com"
                  value={newClientEmail}
                  onChange={e => setNewClientEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-base focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] dark:placeholder-[#d8e7de]/30"
                />
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
                After adding, share the Flourish Fitness app with your client and ask them to sign up using this exact email address. They'll automatically be set up as a client.
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={handleAddClient}
                disabled={addingClient || !newClientEmail.trim()}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
                {addingClient ? 'Adding…' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
