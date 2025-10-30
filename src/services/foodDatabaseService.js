import { ref as dbRef, get, set, push, remove, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';

// OpenFoodFacts API integration
const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2';

/**
 * Search for food by barcode in OpenFoodFacts database
 */
export async function searchFoodByBarcode(barcode) {
  try {
    const response = await fetch(`${OFF_API_BASE}/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      return formatOpenFoodFactsProduct(data.product);
    }
    
    return null;
  } catch (error) {
    console.error('OpenFoodFacts API error:', error);
    return null;
  }
}

/**
 * Search for food by name in OpenFoodFacts database
 */
export async function searchFoodByName(searchTerm, page = 1) {
  try {
    const response = await fetch(
      `${OFF_API_BASE}/search?search_terms=${encodeURIComponent(searchTerm)}&page=${page}&page_size=20&json=true`
    );
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      return data.products.map(formatOpenFoodFactsProduct);
    }
    
    return [];
  } catch (error) {
    console.error('OpenFoodFacts search error:', error);
    return [];
  }
}

/**
 * Format OpenFoodFacts product data to our standard format
 */
function formatOpenFoodFactsProduct(product) {
  const nutriments = product.nutriments || {};
  
  return {
    id: `off_${product.code || product._id}`,
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands || '',
    barcode: product.code,
    servingSize: product.serving_size || '100g',
    servingSizeGrams: parseFloat(product.serving_quantity) || 100,
    
    // Macros per 100g
    calories: Math.round(nutriments['energy-kcal_100g'] || 0),
    protein: parseFloat(nutriments.proteins_100g || 0),
    carbs: parseFloat(nutriments.carbohydrates_100g || 0),
    fats: parseFloat(nutriments.fat_100g || 0),
    
    // Additional nutrients
    fiber: parseFloat(nutriments.fiber_100g || 0),
    sugar: parseFloat(nutriments.sugars_100g || 0),
    sodium: parseFloat(nutriments.sodium_100g || 0),
    saturatedFat: parseFloat(nutriments['saturated-fat_100g'] || 0),
    
    imageUrl: product.image_url || product.image_front_url || null,
    source: 'OpenFoodFacts',
    isCustom: false
  };
}

/**
 * Get custom food from Firebase by ID
 */
export async function getCustomFood(foodId) {
  try {
    const foodRef = dbRef(db, `custom-foods/${foodId}`);
    const snapshot = await get(foodRef);
    
    if (snapshot.exists()) {
      return { id: foodId, ...snapshot.val() };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting custom food:', error);
    return null;
  }
}

/**
 * Search custom foods in Firebase
 */
export async function searchCustomFoods(searchTerm, userId = null, includePublic = true) {
  try {
    const foodsRef = dbRef(db, 'custom-foods');
    const snapshot = await get(foodsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allFoods = snapshot.val();
    const foodsList = Object.entries(allFoods).map(([id, food]) => ({ id, ...food }));
    
    // Filter by search term and access permissions
    const filtered = foodsList.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (food.brand && food.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const hasAccess = food.isPublic || food.createdBy === userId;
      
      return matchesSearch && hasAccess;
    });
    
    return filtered;
  } catch (error) {
    console.error('Error searching custom foods:', error);
    return [];
  }
}

/**
 * Create a new custom food
 */
export async function createCustomFood(foodData, userId) {
  try {
    const foodsRef = dbRef(db, 'custom-foods');
    const newFoodRef = push(foodsRef);
    
    const customFood = {
      ...foodData,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      isCustom: true,
      source: 'Custom'
    };
    
    await set(newFoodRef, customFood);
    
    return { id: newFoodRef.key, ...customFood };
  } catch (error) {
    console.error('Error creating custom food:', error);
    throw error;
  }
}

/**
 * Update an existing custom food
 */
export async function updateCustomFood(foodId, foodData, userId) {
  try {
    // Check ownership
    const foodRef = dbRef(db, `custom-foods/${foodId}`);
    const snapshot = await get(foodRef);
    
    if (!snapshot.exists()) {
      throw new Error('Food not found');
    }
    
    const existingFood = snapshot.val();
    if (existingFood.createdBy !== userId) {
      throw new Error('Not authorized to edit this food');
    }
    
    await set(foodRef, {
      ...existingFood,
      ...foodData,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating custom food:', error);
    throw error;
  }
}

/**
 * Delete a custom food
 */
export async function deleteCustomFood(foodId, userId) {
  try {
    // Check ownership
    const foodRef = dbRef(db, `custom-foods/${foodId}`);
    const snapshot = await get(foodRef);
    
    if (!snapshot.exists()) {
      throw new Error('Food not found');
    }
    
    const existingFood = snapshot.val();
    if (existingFood.createdBy !== userId) {
      throw new Error('Not authorized to delete this food');
    }
    
    await remove(foodRef);
    return true;
  } catch (error) {
    console.error('Error deleting custom food:', error);
    throw error;
  }
}

/**
 * Get food by ID (checks both OpenFoodFacts and custom foods)
 */
export async function getFoodById(foodId) {
  // Check if it's an OpenFoodFacts ID
  if (foodId.startsWith('off_')) {
    const barcode = foodId.replace('off_', '');
    return await searchFoodByBarcode(barcode);
  }
  
  // Otherwise, it's a custom food
  return await getCustomFood(foodId);
}

/**
 * Universal food search (searches both OpenFoodFacts and custom foods)
 */
export async function searchAllFoods(searchTerm, userId = null) {
  try {
    const [offResults, customResults] = await Promise.all([
      searchFoodByName(searchTerm),
      searchCustomFoods(searchTerm, userId)
    ]);
    
    // Combine results, prioritizing custom foods
    return [...customResults, ...offResults];
  } catch (error) {
    console.error('Error searching all foods:', error);
    return [];
  }
}

/**
 * Get popular/recent foods for quick access
 */
export async function getRecentFoods(userId, limit = 10) {
  try {
    const logsRef = dbRef(db, 'nutrition-logs');
    const snapshot = await get(logsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allLogs = snapshot.val();
    const userLogs = Object.values(allLogs)
      .filter(log => log.userId === userId && log.foodId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    
    // Get unique food IDs
    const foodIds = [...new Set(userLogs.map(log => log.foodId))];
    
    // Fetch food details
    const foods = await Promise.all(
      foodIds.map(id => getFoodById(id))
    );
    
    return foods.filter(f => f !== null);
  } catch (error) {
    console.error('Error getting recent foods:', error);
    return [];
  }
}
