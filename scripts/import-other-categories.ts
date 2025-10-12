/**
 * Import Other Category Templates to Database
 * This script imports Exterior, Garden, Festive, Wall Paint, and Floor Style templates
 */

import { supabase } from '../config/supabase.js';
import { generateAllOtherCategoryTemplates, type OtherCategoryTemplate } from './generate-other-categories.js';

function generateTemplateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'TEMPLATE-';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

async function importOtherCategories() {
  console.log('🚀 Starting import of other category templates...\n');
  
  const templates = generateAllOtherCategoryTemplates();
  console.log(`📊 Generated ${templates.length} templates to import\n`);
  
  // Count by category
  const counts: Record<string, number> = {};
  templates.forEach(t => {
    counts[t.main_category] = (counts[t.main_category] || 0) + 1;
  });
  
  console.log('📋 Breakdown by category:');
  Object.entries(counts).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} templates`);
  });
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  const errors: Array<{ template: string; error: any }> = [];
  
  for (const template of templates) {
    try {
      const { data, error } = await supabase
        .from('design_templates')
        .insert({
          // Let Supabase auto-generate UUID for id
          name: template.name,
          image_url: template.imageUrl,
          prompt: template.prompt,
          main_category: template.main_category,
          sub_category: template.sub_category,
          room_type: template.room_type,
          enabled: template.enabled,
          sort_order: template.sort_order,
        });
      
      if (error) {
        console.error(`❌ Failed: ${template.name}`);
        console.error(`   Error: ${error.message}`);
        failCount++;
        errors.push({ template: template.name, error: error.message });
      } else {
        console.log(`✅ Imported: ${template.name}`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`❌ Failed: ${template.name}`);
      console.error(`   Error: ${err.message || err}`);
      failCount++;
      errors.push({ template: template.name, error: err.message || err });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}/${templates.length} templates`);
  console.log(`❌ Failed: ${failCount}/${templates.length} templates`);
  console.log(`📈 Success Rate: ${((successCount / templates.length) * 100).toFixed(1)}%`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ template, error }) => {
      console.log(`   - ${template}: ${error}`);
    });
  }
  
  console.log('\n✨ Import complete!');
}

// Execute
importOtherCategories()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

