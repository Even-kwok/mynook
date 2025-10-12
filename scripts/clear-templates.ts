/**
 * Clear Templates Script
 * Removes all existing templates from the database to start fresh
 */

import { supabase } from '../config/supabase.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function clearAllTemplates(): Promise<void> {
  console.log('🗑️  Starting template cleanup...\n');

  try {
    // Get count before deletion
    const { count: beforeCount, error: countError } = await supabase
      .from('design_templates')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    console.log(`📊 Found ${beforeCount} existing templates\n`);

    if (beforeCount === 0) {
      console.log('✅ No templates to clear. Database is already empty.\n');
      return;
    }

    // Delete all templates
    const { error: deleteError } = await supabase
      .from('design_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible condition)

    if (deleteError) {
      throw deleteError;
    }

    // Verify deletion
    const { count: afterCount, error: verifyError } = await supabase
      .from('design_templates')
      .select('*', { count: 'exact', head: true });

    if (verifyError) {
      throw verifyError;
    }

    console.log(`✅ Successfully deleted ${beforeCount} templates`);
    console.log(`📊 Remaining templates: ${afterCount}\n`);

  } catch (error) {
    console.error('❌ Error clearing templates:', error);
    throw error;
  }
}

export async function clearTemplatesByCategory(mainCategory: string): Promise<void> {
  console.log(`🗑️  Clearing templates for category: ${mainCategory}...\n`);

  try {
    const { count: beforeCount, error: countError } = await supabase
      .from('design_templates')
      .select('*', { count: 'exact', head: true })
      .eq('main_category', mainCategory);

    if (countError) {
      throw countError;
    }

    console.log(`📊 Found ${beforeCount} templates in ${mainCategory}\n`);

    if (beforeCount === 0) {
      console.log(`✅ No templates to clear in ${mainCategory}.\n`);
      return;
    }

    const { error: deleteError } = await supabase
      .from('design_templates')
      .delete()
      .eq('main_category', mainCategory);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`✅ Successfully deleted ${beforeCount} templates from ${mainCategory}\n`);

  } catch (error) {
    console.error(`❌ Error clearing ${mainCategory} templates:`, error);
    throw error;
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  clearAllTemplates()
    .then(() => {
      console.log('✨ Template cleanup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Template cleanup failed:', error);
      process.exit(1);
    });
}

