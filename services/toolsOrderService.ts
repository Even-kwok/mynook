/**
 * Service for managing the order of toolbar tools/features
 * Now fetches from database with localStorage as cache
 */

import { getToolsOrderFromDB, updateToolsOrderInDB } from '../api/_lib/toolsOrder';

export interface ToolItemConfig {
  id: string;
  name: string;
  shortName: string;
  emoji?: string;
  isPremium?: boolean;
  isComingSoon?: boolean;
  /**
   * Whether this tool should be shown in the left toolbar.
   * Defaults to true when omitted (backward compatible).
   */
  isVisible?: boolean;
}

const CACHE_KEY = 'mynook_tools_order_cache';
const CACHE_TIMESTAMP_KEY = 'mynook_tools_order_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default tools order (fallback if database is unavailable)
export const DEFAULT_TOOLS: ToolItemConfig[] = [
  { id: 'interior', name: 'Interior Design', shortName: 'Interior', emoji: '🛋️', isPremium: false, isVisible: true }, 
  { id: 'exterior', name: 'Exterior Design', shortName: 'Exterior', emoji: '🏠', isPremium: false, isVisible: true },
  { id: 'wall', name: 'Wall Design', shortName: 'Wall', emoji: '🎨', isPremium: false, isVisible: true },
  { id: 'floor', name: 'Floor Style', shortName: 'Floor', emoji: '🟫', isPremium: false, isVisible: true },
  { id: 'garden', name: 'Garden & Backyard Design', shortName: 'Garden', emoji: '🌳', isPremium: false, isVisible: true },
  { id: 'festive', name: 'Festive Decor', shortName: 'Festive', emoji: '🎄', isPremium: false, isVisible: true },
  { id: 'item-replace', name: 'Item Replace', shortName: 'Replace', emoji: '➕', isPremium: true, isVisible: true },
  { id: 'style-match', name: 'Reference Style Match', shortName: 'Style\nMatch', emoji: '🖼️', isPremium: true, isVisible: true },
  { id: 'ai-advisor', name: 'AI Design Advisor', shortName: 'AI\nAdvisor', emoji: '💬', isComingSoon: true, isVisible: true },
  { id: 'multi-item', name: 'Multi-Item Preview', shortName: 'Multi\nItem', emoji: '📦', isComingSoon: true, isVisible: true },
  { id: 'draw-edit', name: 'Draw Edit', shortName: 'Draw\nEdit', emoji: '✏️', isPremium: true, isVisible: true },
  { id: 'image-upscale', name: 'Image Upscale', shortName: 'Upscale', emoji: '🔍', isPremium: true, isVisible: true },
];

/**
 * Get tools order from cache if valid
 */
const getCachedToolsOrder = (): ToolItemConfig[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Failed to read cache:', error);
  }
  return null;
};

/**
 * Save tools order to cache
 */
const setCachedToolsOrder = (tools: ToolItemConfig[]): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tools));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save cache:', error);
  }
};

/**
 * Clear tools order cache
 */
export const clearToolsOrderCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};

/**
 * Get the current tools order from database (with cache)
 */
export const getToolsOrder = async (): Promise<ToolItemConfig[]> => {
  // Try cache first
  const cached = getCachedToolsOrder();
  if (cached && cached.length > 0) {
    return cached;
  }

  // Fetch from database
  try {
    const tools = await getToolsOrderFromDB();
    if (tools && tools.length > 0) {
      setCachedToolsOrder(tools);
      return tools;
    }
  } catch (error) {
    console.error('Failed to load tools order from database:', error);
  }
  
  // Fallback to defaults
  return DEFAULT_TOOLS;
};

/**
 * Get tools order synchronously (uses cache or defaults)
 * Use this for initial render, then call getToolsOrder() to fetch latest
 */
export const getToolsOrderSync = (): ToolItemConfig[] => {
  return getCachedToolsOrder() || DEFAULT_TOOLS;
};

/**
 * Save tools order to database and update cache
 */
export const saveToolsOrder = async (tools: ToolItemConfig[]): Promise<void> => {
  try {
    await updateToolsOrderInDB(tools);
    setCachedToolsOrder(tools);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('toolsOrderUpdated'));
  } catch (error) {
    console.error('Failed to save tools order:', error);
    throw error;
  }
};

/**
 * Reset tools order to default
 */
export const resetToolsOrder = async (): Promise<ToolItemConfig[]> => {
  await saveToolsOrder(DEFAULT_TOOLS);
  return DEFAULT_TOOLS;
};

/**
 * Move a tool up by one position
 */
export const moveToolUp = async (tools: ToolItemConfig[], index: number): Promise<ToolItemConfig[]> => {
  if (index <= 0 || index >= tools.length) return tools;
  
  const newOrder = [...tools];
  [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
  await saveToolsOrder(newOrder);
  return newOrder;
};

/**
 * Move a tool down by one position
 */
export const moveToolDown = async (tools: ToolItemConfig[], index: number): Promise<ToolItemConfig[]> => {
  if (index < 0 || index >= tools.length - 1) return tools;
  
  const newOrder = [...tools];
  [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
  await saveToolsOrder(newOrder);
  return newOrder;
};

/**
 * Move a tool to the top
 */
export const moveToolToTop = async (tools: ToolItemConfig[], index: number): Promise<ToolItemConfig[]> => {
  if (index <= 0 || index >= tools.length) return tools;
  
  const newOrder = [...tools];
  const [tool] = newOrder.splice(index, 1);
  newOrder.unshift(tool);
  await saveToolsOrder(newOrder);
  return newOrder;
};

/**
 * Move a tool to the bottom
 */
export const moveToolToBottom = async (tools: ToolItemConfig[], index: number): Promise<ToolItemConfig[]> => {
  if (index < 0 || index >= tools.length - 1) return tools;
  
  const newOrder = [...tools];
  const [tool] = newOrder.splice(index, 1);
  newOrder.push(tool);
  await saveToolsOrder(newOrder);
  return newOrder;
};

