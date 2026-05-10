import React, { useState, useEffect } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';
import { Layers, Dumbbell, UserPlus, RefreshCw, Clock } from 'lucide-react';
import AssignProgramModal from './AssignProgramModal';

export default function ManageClients() {
  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersSnap, programsSnap, assignmentsSnap] = await Promise.all([
        get(dbRef(db, 'users')),
        get(dbRef(db, 'programs')),
        get(dbRef(db, 'programAssignments')),
      ]);

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

      if (assignmentsSnap.exists()) {
        setAssignments(assignmentsSnap.val());
      }
    } catch (err) {
      console.error('Error loading client data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (client) => {
    setSelectedClient(client);
    setShowAssignModal(true);
  };

  const getProgressLabel = (assignment) => {
    if (!assignment) return null;
    const program = programs.find(p => p.id === assignment.programId);
    if (!program) return null;
    const phase = program.phases?.[assignment.currentPhase];
    if (!phase) return null;
    return `${phase.name} · Week ${assignment.currentWeek}/${phase.durationWeeks}`;
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Clients</h2>
        <p className="text-emerald-100 text-sm mt-1">Manage your clients and their training programs</p>
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
      ) : clients.length === 0 ? (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-8 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <Dumbbell className="w-12 h-12 mx-auto text-gray-300 dark:text-[#d8e7de]/20 mb-3" />
          <p className="text-gray-500 dark:text-[#d8e7de]/60 mb-1">No clients yet.</p>
          <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">Clients appear here after signing up with a client account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(client => {
            const assignment = assignments[client.id];
            const progressLabel = getProgressLabel(assignment);

            return (
              <div key={client.id} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
                {/* Client info */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(client.name || client.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{client.name || client.email}</div>
                    <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 truncate">{client.email}</div>
                    <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                      Joined {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </div>
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
                            <div className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">{progressLabel}</div>
                          )}
                          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600/60 dark:text-emerald-500/60">
                            <Clock className="w-3 h-3" />
                            Started {new Date(assignment.startDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-[#0a0a0a]/30 rounded-xl p-3 text-center">
                      <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">No program assigned</p>
                    </div>
                  )}

                  <button
                    onClick={() => openAssignModal(client)}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px] transition ${
                      assignment
                        ? 'border border-gray-200 dark:border-[#C6A45F]/25 text-gray-700 dark:text-[#d8e7de]/80 hover:border-emerald-400'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {assignment
                      ? <><RefreshCw className="w-4 h-4" /> Change Program</>
                      : <><UserPlus className="w-4 h-4" /> Assign Program</>
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAssignModal && selectedClient && (
        <AssignProgramModal
          client={selectedClient}
          programs={programs}
          existingAssignment={assignments[selectedClient.id] || null}
          onClose={() => { setShowAssignModal(false); setSelectedClient(null); }}
          onSaved={() => { setShowAssignModal(false); setSelectedClient(null); loadAll(); }}
        />
      )}
    </div>
  );
}
