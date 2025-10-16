/**
 * Service for managing the order of toolbar tools/features
 */

export interface ToolItemConfig {
  id: string;
  name: string;
  shortName: string;
  emoji?: string;
  isPremium?: boolean;
  isComingSoon?: boolean;
}

const STORAGE_KEY = 'mynook_tools_order';

// Default tools order (matches LeftToolbar.tsx)
export const DEFAULT_TOOLS: ToolItemConfig[] = [
  { id: 'interior', name: 'Interior Design', shortName: 'Interior', emoji: '🛋️', isPremium: false }, 
  { id: 'exterior', name: 'Exterior Design', shortName: 'Exterior', emoji: '🏠', isPremium: false },
  { id: 'wall', name: 'Wall Design', shortName: 'Wall', emoji: '🎨', isPremium: false },
  { id: 'floor', name: 'Floor Style', shortName: 'Floor', emoji: '🟫', isPremium: false },
  { id: 'garden', name: 'Garden & Backyard Design', shortName: 'Garden', emoji: '🌳', isPremium: false },
  { id: 'festive', name: 'Festive Decor', shortName: 'Festive', emoji: '🎄', isPremium: false },
  { id: 'item-replace', name: 'Item Replace', shortName: 'Replace', emoji: '➕', isPremium: true },
  { id: 'style-match', name: 'Reference Style Match', shortName: 'Style\nMatch', emoji: '🖼️', isPremium: true },
  { id: 'ai-advisor', name: 'AI Design Advisor', shortName: 'AI\nAdvisor', emoji: '💬', isComingSoon: true },
  { id: 'multi-item', name: 'Multi-Item Preview', shortName: 'Multi\nItem', emoji: '📦', isComingSoon: true },
  { id: 'free-canvas', name: 'Canva', shortName: 'Canva', emoji: '✏️', isPremium: true },
];

/**
 * Get the current tools order from localStorage
 */
export const getToolsOrder = (): ToolItemConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedOrder: ToolItemConfig[] = JSON.parse(stored);
      
      // Validate that all default tools are present
      const storedIds = new Set(parsedOrder.map(t => t.id));
      const defaultIds = new Set(DEFAULT_TOOLS.map(t => t.id));
      
      // If mismatch, merge with defaults
      if (parsedOrder.length !== DEFAULT_TOOLS.length || 
          ![...defaultIds].every(id => storedIds.has(id))) {
        // Merge: keep custom order but add any new tools at the end
        const merged = [...parsedOrder];
        DEFAULT_TOOLS.forEach(defaultTool => {
          if (!storedIds.has(defaultTool.id)) {
            merged.push(defaultTool);
          }
        });
        saveToolsOrder(merged);
        return merged;
      }
      
      return parsedOrder;
    }
  } catch (error) {
    console.error('Failed to load tools order:', error);
  }
  
  return DEFAULT_TOOLS;
};

/**
 * Save tools order to localStorage
 */
export const saveToolsOrder = (tools: ToolItemConfig[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  } catch (error) {
    console.error('Failed to save tools order:', error);
  }
};

/**
 * Reset tools order to default
 */
export const resetToolsOrder = (): ToolItemConfig[] => {
  saveToolsOrder(DEFAULT_TOOLS);
  return DEFAULT_TOOLS;
};

/**
 * Move a tool up by one position
 */
export const moveToolUp = (tools: ToolItemConfig[], index: number): ToolItemConfig[] => {
  if (index <= 0 || index >= tools.length) return tools;
  
  const newOrder = [...tools];
  [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
  saveToolsOrder(newOrder);
  return newOrder;
};

/**
 * Move a tool down by one position
 */
export const moveToolDown = (tools: ToolItemConfig[], index: number): ToolItemConfig[] => {
  if (index < 0 || index >= tools.length - 1) return tools;
  
  const newOrder = [...tools];
  [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
  saveToolsOrder(newOrder);
  return newOrder;
};

/**
 * Move a tool to the top
 */
export const moveToolToTop = (tools: ToolItemConfig[], index: number): ToolItemConfig[] => {
  if (index <= 0 || index >= tools.length) return tools;
  
  const newOrder = [...tools];
  const [tool] = newOrder.splice(index, 1);
  newOrder.unshift(tool);
  saveToolsOrder(newOrder);
  return newOrder;
};

/**
 * Move a tool to the bottom
 */
export const moveToolToBottom = (tools: ToolItemConfig[], index: number): ToolItemConfig[] => {
  if (index < 0 || index >= tools.length - 1) return tools;
  
  const newOrder = [...tools];
  const [tool] = newOrder.splice(index, 1);
  newOrder.push(tool);
  saveToolsOrder(newOrder);
  return newOrder;
};

