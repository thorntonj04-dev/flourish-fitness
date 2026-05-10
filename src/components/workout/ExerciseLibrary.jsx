import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Video, Search, X, ChevronDown } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove } from 'firebase/database';
import { db, storage } from '../../firebase';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'mobility'];

export default function ExerciseLibrary({ onSelectExercise, selectedExercises = [] }) {
  const [exercises, setExercises] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [newExercise, setNewExercise] = useState({ name: '', description: '', videoUrl: '', muscleGroup: 'chest' });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadExercises(); }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const snapshot = await get(dbRef(db, 'exercises'));
      if (snapshot.exists()) {
        const list = Object.entries(snapshot.val()).map(([id, ex]) => ({ id, ...ex }));
        setExercises(list);
      } else {
        setExercises([]);
      }
    } catch (err) {
      console.error('Error loading exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { alert('Please upload a video file'); return; }
    setUploadingVideo(true);
    try {
      const fileRef = storageRef(storage, `exercise-videos/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setNewExercise(prev => ({ ...prev, videoUrl: url }));
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) { alert('Please enter an exercise name'); return; }
    try {
      const newRef = push(dbRef(db, 'exercises'));
      await set(newRef, { ...newExercise, name: newExercise.name.trim(), createdAt: new Date().toISOString() });
      setNewExercise({ name: '', description: '', videoUrl: '', muscleGroup: 'chest' });
      setShowAddForm(false);
      loadExercises();
    } catch (err) {
      console.error('Error adding exercise:', err);
      alert('Failed to add exercise');
    }
  };

  const handleDeleteExercise = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this exercise?')) return;
    try {
      await remove(dbRef(db, `exercises/${id}`));
      loadExercises();
    } catch (err) {
      console.error('Error deleting exercise:', err);
    }
  };

  const filtered = useMemo(() => {
    let list = exercises;
    if (filterGroup !== 'all') list = list.filter(ex => ex.muscleGroup === filterGroup);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(ex =>
        (ex.name || '').toLowerCase().includes(q) ||
        (ex.muscleGroup || '').toLowerCase().includes(q) ||
        (ex.description || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [exercises, searchQuery, filterGroup]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-gray-900 dark:text-[#d8e7de]">Exercise Library</div>
          <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">{exercises.length} exercises saved</div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm active:bg-emerald-600 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-[#0a0a0a]/40 border border-gray-200 dark:border-[#C6A45F]/25 rounded-2xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-1.5">Name</label>
            <input
              type="text"
              placeholder="e.g. Barbell Back Squat"
              value={newExercise.name}
              onChange={e => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] text-base"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-1.5">Muscle Group</label>
            <select
              value={newExercise.muscleGroup}
              onChange={e => setNewExercise(prev => ({ ...prev, muscleGroup: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] text-base"
            >
              {MUSCLE_GROUPS.map(g => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-1.5">Description / Cues (optional)</label>
            <textarea
              placeholder="Form cues, common mistakes, modifications..."
              value={newExercise.description}
              onChange={e => setNewExercise(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] resize-none text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide mb-1.5">How-to Video (optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploadingVideo}
              className="w-full text-sm text-gray-500 dark:text-[#d8e7de]/60 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-900/20 dark:file:text-emerald-400"
            />
            {uploadingVideo && <p className="text-xs text-emerald-600 mt-1">Uploading...</p>}
            {newExercise.videoUrl && !uploadingVideo && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Video className="w-3 h-3" /> Video uploaded
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAddExercise}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold active:bg-emerald-600 min-h-[52px]"
            >
              Save Exercise
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewExercise({ name: '', description: '', videoUrl: '', muscleGroup: 'chest' }); }}
              className="px-4 py-3 border border-gray-200 dark:border-[#C6A45F]/25 text-gray-700 dark:text-[#d8e7de]/80 rounded-xl active:bg-gray-50 dark:active:bg-[#0a0a0a]/30 min-h-[52px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, muscle group..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Muscle group filter */}
      <div className="flex gap-1.5 flex-wrap">
        {['all', ...MUSCLE_GROUPS].map(g => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filterGroup === g
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-600 dark:text-[#d8e7de]/60 active:bg-gray-200'
            }`}
          >
            {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
        {searchQuery ? ` matching "${searchQuery}"` : ''}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-[#0a0a0a]/30 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-[#d8e7de]/40">
          {searchQuery || filterGroup !== 'all' ? (
            <div>
              <p className="text-sm mb-2">No exercises found</p>
              <button
                onClick={() => { setSearchQuery(''); setFilterGroup('all'); }}
                className="text-emerald-500 text-sm font-medium active:text-emerald-600"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <p className="text-sm">No exercises yet. Add your first one above.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(exercise => {
            const isSelected = selectedExercises.some(ex => ex.id === exercise.id || ex.name === exercise.name);
            return (
              <div
                key={exercise.id}
                onClick={() => onSelectExercise && onSelectExercise(exercise)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition active:scale-[0.98] ${
                  isSelected
                    ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-[#C6A45F]/25 bg-white dark:bg-[#1E3328] active:border-emerald-300'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-[#d8e7de] text-sm truncate">{exercise.name}</div>
                  <div className="text-xs text-gray-400 dark:text-[#d8e7de]/50 capitalize flex items-center gap-2 mt-0.5">
                    <span>{exercise.muscleGroup}</span>
                    {exercise.videoUrl && (
                      <span className="flex items-center gap-0.5 text-blue-400">
                        <Video className="w-3 h-3" /> video
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={e => handleDeleteExercise(exercise.id, e)}
                  className="p-2 rounded-lg text-red-400 active:text-red-600 active:bg-red-50 dark:active:bg-red-900/20 min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
