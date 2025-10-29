// Measurement field definitions
export const measurementFields = {
  neck: { label: 'Neck', group: 'upper', required: true, order: 1 },
  chest: { label: 'Chest/Bust', group: 'upper', required: true, order: 2 },
  waistNatural: { label: 'Waist (Natural)', group: 'core', required: true, order: 3 },
  waistAboveNavel: { label: 'Waist (Above Navel)', group: 'core', required: false, order: 4 },
  waistBelowNavel: { label: 'Waist (Below Navel)', group: 'core', required: false, order: 5 },
  hips: { label: 'Hips', group: 'lower', required: true, order: 6 },
  bicepRight: { label: 'Right Bicep', group: 'upper', required: true, order: 7 },
  bicepLeft: { label: 'Left Bicep', group: 'upper', required: false, order: 8 },
  thighRight: { label: 'Right Thigh', group: 'lower', required: true, order: 9 },
  thighLeft: { label: 'Left Thigh', group: 'lower', required: false, order: 10 },
  calfRight: { label: 'Right Calf', group: 'lower', required: true, order: 11 },
  calfLeft: { label: 'Left Calf', group: 'lower', required: false, order: 12 },
};

// Calculate total inches across all measurements
export const calculateTotalInches = (measurements) => {
  if (!measurements) return 0;
  return Object.values(measurements).reduce((sum, val) => {
    const num = parseFloat(val);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
};

// Calculate change between current and previous measurements
export const calculateChange = (current, previous) => {
  if (!previous || !current) return null;
  
  const changes = {};
  Object.keys(current).forEach(key => {
    if (previous[key] && current[key]) {
      const currentVal = parseFloat(current[key]);
      const previousVal = parseFloat(previous[key]);
      if (!isNaN(currentVal) && !isNaN(previousVal)) {
        changes[key] = (currentVal - previousVal).toFixed(2);
      }
    }
  });
  
  return changes;
};

// Get biggest changes from comparison
export const getBiggestChanges = (changes, limit = 3) => {
  if (!changes) return [];
  
  const changeArray = Object.entries(changes)
    .map(([key, value]) => ({
      field: key,
      label: measurementFields[key]?.label || key,
      change: parseFloat(value),
      changeStr: value
    }))
    .filter(item => item.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  
  return changeArray.slice(0, limit);
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Format date for input fields
export const formatDateForInput = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Convert between units
export const convertUnits = (value, fromUnit, toUnit) => {
  if (!value || fromUnit === toUnit) return value;
  
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  // Inches to cm
  if (fromUnit === 'inches' && toUnit === 'cm') {
    return (num * 2.54).toFixed(2);
  }
  
  // Cm to inches
  if (fromUnit === 'cm' && toUnit === 'inches') {
    return (num / 2.54).toFixed(2);
  }
  
  // Lbs to kg
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return (num * 0.453592).toFixed(2);
  }
  
  // Kg to lbs
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return (num / 0.453592).toFixed(2);
  }
  
  return value;
};

// Validate measurement value
export const validateMeasurement = (value, field) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) return { valid: false, error: 'Please enter a valid number' };
  if (num <= 0) return { valid: false, error: 'Value must be greater than 0' };
  
  // Reasonable ranges (in inches)
  const ranges = {
    neck: [10, 25],
    chest: [25, 60],
    waistNatural: [20, 60],
    waistAboveNavel: [20, 60],
    waistBelowNavel: [20, 60],
    hips: [25, 70],
    bicepRight: [8, 25],
    bicepLeft: [8, 25],
    thighRight: [15, 40],
    thighLeft: [15, 40],
    calfRight: [10, 25],
    calfLeft: [10, 25],
  };
  
  const [min, max] = ranges[field] || [0, 1000];
  
  if (num < min || num > max) {
    return { 
      valid: false, 
      error: `Value should be between ${min} and ${max} inches` 
    };
  }
  
  return { valid: true };
};

// Get measurement guide text
export const getMeasurementGuide = (field) => {
  const guides = {
    neck: "Measure around your neck just below the larynx (Adam's apple), about 1 inch above where your shoulders meet your neck.",
    chest: "Women: Measure across the fullest part of your bust. Men: Wrap tape around chest at nipple level, keeping it level under arms.",
    waistNatural: "Measure at your natural waistline (midpoint between hip bones and rib cage) after a normal exhale. The tape should be snug but not pressing into skin.",
    waistAboveNavel: "Measure approximately 3 finger-widths above your belly button, keeping tape parallel to floor.",
    waistBelowNavel: "Measure approximately 3 finger-widths below your belly button, keeping tape parallel to floor.",
    hips: "Measure around the widest part of your buttocks, keeping tape parallel to floor.",
    bicepRight: "Measure around the midpoint between your shoulder and elbow with arm relaxed at your side.",
    bicepLeft: "Measure around the midpoint between your shoulder and elbow with arm relaxed at your side.",
    thighRight: "Measure around the top of your thigh (near the hip) or around the widest part, whichever you prefer. Be consistent.",
    thighLeft: "Measure around the top of your thigh (near the hip) or around the widest part, whichever you prefer. Be consistent.",
    calfRight: "Measure around the widest part of your calf, keeping tape parallel to floor.",
    calfLeft: "Measure around the widest part of your calf, keeping tape parallel to floor.",
  };
  
  return guides[field] || "Measure at the indicated body part.";
};

// Group measurements by body area
export const groupMeasurements = (measurements) => {
  const groups = {
    upper: [],
    core: [],
    lower: []
  };
  
  Object.entries(measurementFields).forEach(([key, field]) => {
    if (measurements && measurements[key]) {
      groups[field.group].push({
        key,
        ...field,
        value: measurements[key]
      });
    }
  });
  
  return groups;
};

// Calculate progress percentage toward goal
export const calculateGoalProgress = (current, goal) => {
  if (!current || !goal) return 0;
  
  const currentVal = parseFloat(current);
  const goalVal = parseFloat(goal);
  
  if (isNaN(currentVal) || isNaN(goalVal)) return 0;
  
  // Assuming goal is weight loss (smaller is better)
  const progress = ((currentVal - goalVal) / currentVal) * 100;
  return Math.max(0, Math.min(100, 100 - progress));
};

// Get time-based greeting
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Format weight display
export const formatWeight = (weight, units = 'lbs') => {
  if (!weight) return '-';
  return `${parseFloat(weight).toFixed(1)} ${units}`;
};

// Calculate BMI (optional utility)
export const calculateBMI = (weightLbs, heightInches) => {
  if (!weightLbs || !heightInches) return null;
  
  const weight = parseFloat(weightLbs);
  const height = parseFloat(heightInches);
  
  if (isNaN(weight) || isNaN(height) || height === 0) return null;
  
  return ((weight * 703) / (height * height)).toFixed(1);
};

// Get BMI category
export const getBMICategory = (bmi) => {
  if (!bmi) return null;
  
  const bmiNum = parseFloat(bmi);
  
  if (bmiNum < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
  if (bmiNum < 25) return { category: 'Normal', color: 'text-emerald-600' };
  if (bmiNum < 30) return { category: 'Overweight', color: 'text-yellow-600' };
  return { category: 'Obese', color: 'text-red-600' };
};

// Sort entries by date (newest first)
export const sortByDateDesc = (entries) => {
  if (!entries) return [];
  
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    return dateB - dateA;
  });
};

// Get chart data for measurements over time
export const getChartData = (entries, field) => {
  if (!entries || !field) return [];
  
  return entries
    .filter(entry => entry.measurements && entry.measurements[field])
    .map(entry => ({
      date: formatDate(entry.date || entry.createdAt),
      value: parseFloat(entry.measurements[field]),
      fullDate: entry.date || entry.createdAt
    }))
    .reverse(); // Oldest to newest for chart
};

// Get weight chart data
export const getWeightChartData = (entries) => {
  if (!entries) return [];
  
  return entries
    .map(entry => ({
      date: formatDate(entry.date),
      weight: parseFloat(entry.weight),
      fullDate: entry.date
    }))
    .reverse(); // Oldest to newest for chart
};

// Check if measurements are complete (all required fields filled)
export const areMeasurementsComplete = (measurements) => {
  if (!measurements) return false;
  
  const requiredFields = Object.entries(measurementFields)
    .filter(([_, field]) => field.required)
    .map(([key, _]) => key);
  
  return requiredFields.every(field => {
    const value = measurements[field];
    return value && !isNaN(parseFloat(value)) && parseFloat(value) > 0;
  });
};

// Get measurement reminder text based on last entry date
export const getMeasurementReminder = (lastEntryDate) => {
  if (!lastEntryDate) return 'No measurements yet. Start tracking today!';
  
  const lastDate = new Date(lastEntryDate);
  const today = new Date();
  const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  
  if (daysSince === 0) return 'Measured today ✓';
  if (daysSince === 1) return 'Measured yesterday';
  if (daysSince < 7) return `Measured ${daysSince} days ago`;
  if (daysSince < 14) return 'Time for your weekly check-in!';
  if (daysSince < 30) return `Last measured ${Math.floor(daysSince / 7)} weeks ago`;
  
  return 'It\'s been a while! Time to measure.';
};

// Export default object with all utilities
export default {
  measurementFields,
  calculateTotalInches,
  calculateChange,
  getBiggestChanges,
  formatDate,
  formatDateForInput,
  convertUnits,
  validateMeasurement,
  getMeasurementGuide,
  groupMeasurements,
  calculateGoalProgress,
  getGreeting,
  formatWeight,
  calculateBMI,
  getBMICategory,
  sortByDateDesc,
  getChartData,
  getWeightChartData,
  areMeasurementsComplete,
  getMeasurementReminder
};
