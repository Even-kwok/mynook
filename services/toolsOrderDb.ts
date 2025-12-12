import { supabase } from '../config/supabase';
import type { ToolItemConfig } from './toolsOrderService';

// NOTE:
// This module intentionally uses a loose typing approach for Supabase tables
// because our `types/database.ts` does not include all tables (e.g. tools_order).
// This keeps builds green while still using the existing Supabase client.

export interface ToolOrderDB {
  id: string;
  tool_id: string;
  name: string;
  short_name: string;
  emoji?: string;
  is_premium: boolean;
  is_coming_soon: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all tools in their sorted order from database
 */
export const getToolsOrderFromDB = async (): Promise<ToolItemConfig[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from('tools_order')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching tools order:', error);
      throw error;
    }

    return ((data || []) as ToolOrderDB[]).map((tool) => ({
      id: tool.tool_id,
      name: tool.name,
      shortName: tool.short_name,
      emoji: tool.emoji,
      isPremium: tool.is_premium,
      isComingSoon: tool.is_coming_soon,
    }));
  } catch (error) {
    console.error('Failed to get tools order from database:', error);
    throw error;
  }
};

/**
 * Update the sort order of all tools
 */
export const updateToolsOrderInDB = async (tools: ToolItemConfig[]): Promise<void> => {
  try {
    const updates = tools.map((tool, index) => ({
      tool_id: tool.id,
      name: tool.name,
      short_name: tool.shortName,
      emoji: tool.emoji,
      is_premium: tool.isPremium || false,
      is_coming_soon: tool.isComingSoon || false,
      sort_order: index + 1,
    }));

    const { error } = await (supabase as any)
      .from('tools_order')
      .upsert(updates, { onConflict: 'tool_id', ignoreDuplicates: false });

    if (error) {
      console.error('Error updating tools order:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update tools order in database:', error);
    throw error;
  }
};

/**
 * Reset tools order to a specific configuration
 */
export const resetToolsOrderInDB = async (tools: ToolItemConfig[]): Promise<void> => {
  return updateToolsOrderInDB(tools);
};
