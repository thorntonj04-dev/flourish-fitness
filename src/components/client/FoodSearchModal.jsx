import React, { useState, useEffect } from 'react';
import { Search, Scan, Plus, X, Loader, Clock, Database } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import {
  searchAllFoods,
  searchFoodByBarcode,
  getRecentFoods
} from '../../services/foodDatabaseService';

export default function FoodSearchModal({ userId, onSelectFood, onClose, onCreateCustom }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'recent'

  useEffect(() => {
    loadRecentFoods();
  }, [userId]);

  const loadRecentFoods = async () => {
    const foods = await getRecentFoods(userId, 10);
    setRecentFoods(foods);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchAllFoods(searchTerm, userId);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = async (barcode) => {
    setShowScanner(false);
    setLoading(true);
    setActiveTab('search');
    
    try {
      const food = await searchFoodByBarcode(barcode);
      
      if (food) {
        // Found food, show it in results
        setSearchResults([food]);
        setSearchTerm(`Barcode: ${barcode}`);
      } else {
        // Not found, offer to create custom food with this barcode
        alert(`Food not found for barcode ${barcode}. You can create a custom food entry.`);
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Barcode search error:', error);
      alert('Error searching for barcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const FoodItem = ({ food }) => (
    <button
      onClick={() => onSelectFood(food)}
      className="w-full p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-left transition-all"
    >
      <div className="flex gap-3">
        {food.imageUrl && (
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">{food.name}</div>
          {food.brand && (
            <div className="text-sm text-gray-600 dark:text-gray-400">{food.brand}</div>
          )}
          <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Cal: {food.calories}</span>
            <span>P: {food.protein}g</span>
            <span>C: {food.carbs}g</span>
            <span>F: {food.fats}g</span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            {food.isCustom ? (
              <>
                <Database className="w-3 h-3" />
                <span>Custom Food</span>
              </>
            ) : (
              <span>OpenFoodFacts</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );

  if (showScanner) {
    return (
      <BarcodeScanner
        onScanSuccess={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Food</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search food by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowScanner(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Scan className="w-4 h-4" />
              <span className="text-sm font-medium">Scan Barcode</span>
            </button>
            <button
              onClick={onCreateCustom}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Custom</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Search Results
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`pb-2 px-1 text-sm font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'recent'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Recent
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {activeTab === 'search' && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <Loader className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((food, idx) => (
                    <FoodItem key={food.id || idx} food={food} />
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No foods found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Try a different search term or create a custom food</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Search for a food to get started</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Or scan a barcode</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'recent' && (
            <>
              {recentFoods.length > 0 ? (
                <div className="space-y-2">
                  {recentFoods.map((food, idx) => (
                    <FoodItem key={food.id || idx} food={food} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No recent foods</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Start logging meals to see your frequently used foods here</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
