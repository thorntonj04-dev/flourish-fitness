import React, { useState, useEffect } from 'react';
import { ref as dbRef, push, set, get, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../../firebase';
import { Ruler, Info, Save, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  measurementFields, 
  validateMeasurement, 
  getMeasurementGuide,
  calculateChange,
  formatDate,
  formatDateForInput,
  areMeasurementsComplete
} from '../../utils/measurementUtils';

export default function BodyMeasurements({ userId }) {
  const [measurements, setMeasurements] = useState({});
  const [lastMeasurements, setLastMeasurements] = useState(null);
  const [units, setUnits] = useState('inches');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(formatDateForInput());
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    upper: true,
    core: true,
    lower: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadLastMeasurements();
    loadUserPreferences();
  }, [userId]);

  const loadLastMeasurements = async () => {
    try {
      const measurementsRef = dbRef(db, `body-measurements/${userId}`);
      const snapshot = await get(measurementsRef);
      
      if (snapshot.exists()) {
        const allMeasurements = snapshot.val();
        const measurementArray = Object.entries(allMeasurements)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (measurementArray.length > 0) {
          setLastMeasurements(measurementArray[0]);
        }
      }
    } catch (error) {
      console.error('Error loading last measurements:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const prefsRef = dbRef(db, `user-preferences/${userId}`);
      const snapshot = await get(prefsRef);
      
      if (snapshot.exists()) {
        const prefs = snapshot.val();
        setUnits(prefs.measurementUnits || 'inches');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleMeasurementChange = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateAllMeasurements = () => {
    const newErrors = {};
    let hasErrors = false;

    // Check required fields
    Object.entries(measurementFields).forEach(([key, field]) => {
      if (field.required && !measurements[key]) {
        newErrors[key] = 'Required field';
        hasErrors = true;
      } else if (measurements[key]) {
        const validation = validateMeasurement(measurements[key], key);
        if (!validation.valid) {
          newErrors[key] = validation.error;
          hasErrors = true;
        }
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSave = async () => {
    if (!validateAllMeasurements()) {
      alert('Please fix the errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const measurementsRef = dbRef(db, `body-measurements/${userId}`);
      const newMeasurementRef = push(measurementsRef);
      
      await set(newMeasurementRef, {
        date: date,
        measurements: measurements,
        units: units,
        notes: notes,
        createdAt: new Date().toISOString()
      });

      alert('✓ Measurements saved successfully!');
      
      // Reset form
      setMeasurements({});
      setNotes('');
      setDate(formatDateForInput());
      
      // Reload last measurements
      loadLastMeasurements();
    } catch (error) {
      console.error('Error saving measurements:', error);
      alert('Failed to save measurements. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateFieldChange = (field) => {
    if (!lastMeasurements?.measurements || !measurements[field]) return null;
    
    const current = parseFloat(measurements[field]);
    const previous = parseFloat(lastMeasurements.measurements[field]);
    
    if (isNaN(current) || isNaN(previous)) return null;
    
    return (current - previous).toFixed(2);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const groupedFields = {
    upper: Object.entries(measurementFields).filter(([_, field]) => field.group === 'upper'),
    core: Object.entries(measurementFields).filter(([_, field]) => field.group === 'core'),
    lower: Object.entries(measurementFields).filter(([_, field]) => field.group === 'lower'),
  };

  const renderMeasurementInput = ([key, field]) => {
    const change = calculateFieldChange(key);
    const lastValue = lastMeasurements?.measurements?.[key];
    const hasError = errors[key];

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
            <button
              type="button"
              onClick={() => setShowGuide(showGuide === key ? null : key)}
              className="text-gray-400 hover:text-emerald-600 transition"
            >
              <Info className="w-4 h-4" />
            </button>
          </label>
          {lastValue && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last: {lastValue}"
            </span>
          )}
        </div>

        {showGuide === key && (
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
            {getMeasurementGuide(key)}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              step="0.1"
              value={measurements[key] || ''}
              onChange={(e) => handleMeasurementChange(key, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${
                hasError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500'
              } focus:outline-none focus:ring-2`}
            />
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{hasError}</p>
            )}
          </div>
          <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300">
            {units}
          </div>
        </div>

        {change && (
          <div className={`flex items-center gap-1 text-sm ${
            parseFloat(change) < 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {parseFloat(change) < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}" {parseFloat(change) < 0 ? 'lost' : 'gained'}</span>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title, sectionKey, fields) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="p-4 space-y-4">
            {fields.map(renderMeasurementInput)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Body Measurements</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your measurements to see progress beyond the scale
          </p>
        </div>
        <Ruler className="w-8 h-8 text-emerald-500" />
      </div>

      {/* Last Measurement Info */}
      {lastMeasurements && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                Last measured: {formatDate(lastMeasurements.date)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Your previous measurements will be shown for comparison
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Measurement Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={formatDateForInput()}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Units Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Units
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUnits('inches')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              units === 'inches'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Inches
          </button>
          <button
            type="button"
            onClick={() => setUnits('cm')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              units === 'cm'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Centimeters
          </button>
        </div>
      </div>

      {/* Measurement Sections */}
      <div className="space-y-4">
        {renderSection('Upper Body', 'upper', groupedFields.upper)}
        {renderSection('Core', 'core', groupedFields.core)}
        {renderSection('Lower Body', 'lower', groupedFields.lower)}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this measurement session..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Measurement Tips
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Measure first thing in the morning for consistency</li>
          <li>Keep the tape snug but not pressing into skin</li>
          <li>Measure at the same spot each time</li>
          <li>Click the info icon (i) for detailed guidance on each measurement</li>
        </ul>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !areMeasurementsComplete(measurements)}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Saving...' : 'Save Measurements'}
      </button>
    </div>
  );
}
