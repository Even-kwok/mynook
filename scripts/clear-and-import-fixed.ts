/**
 * 清理旧的Exterior和Garden模板，导入正确结构的新模板
 */

import { supabase } from '../config/supabase.js';
import { generateAllFixedTemplates } from './generate-exterior-garden-fixed.js';

async function clearOldTemplates() {
  console.log('🗑️  Clearing old Exterior Design and Garden & Backyard templates...\n');
  
  const { data, error } = await supabase
    .from('design_templates')
    .delete()
    .in('main_category', ['Exterior Design', 'Garden & Backyard Design']);
  
  if (error) {
    console.error('❌ Error clearing old templates:', error.message);
    throw error;
  }
  
  console.log('✅ Old templates cleared successfully\n');
}

async function importNewTemplates() {
  console.log('📥 Importing new properly structured templates...\n');
  
  const templates = generateAllFixedTemplates();
  console.log(`📊 Total templates to import: ${templates.length}\n`);
  
  // Count by category
  const exteriorCount = templates.filter(t => t.main_category === 'Exterior Design').length;
  const gardenCount = templates.filter(t => t.main_category === 'Garden & Backyard Design').length;
  
  console.log('📋 Breakdown:');
  console.log(`   Exterior Design: ${exteriorCount} templates`);
  console.log(`   Garden & Backyard: ${gardenCount} templates\n`);
  
  let successCount = 0;
  let failCount = 0;
  const errors: Array<{ template: string; error: any }> = [];
  
  for (const template of templates) {
    try {
      const { error } = await supabase
        .from('design_templates')
        .insert({
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
}

async function execute() {
  try {
    console.log('🚀 Starting template restructure process...\n');
    console.log('=' .repeat(60) + '\n');
    
    // Step 1: Clear old templates
    await clearOldTemplates();
    
    // Step 2: Import new templates
    await importNewTemplates();
    
    console.log('\n✨ Process complete!');
    console.log('\n🎉 Exterior Design and Garden & Backyard templates have been restructured!');
    console.log('\n📌 New structure:');
    console.log('   - Exterior Design: By building type (Modern House, Beach House, etc.)');
    console.log('   - Garden & Backyard: By functional area (Front Yard, Backyard, etc.)');
    
  } catch (error: any) {
    console.error('\n💥 Fatal error:', error.message || error);
    process.exit(1);
  }
}

// Execute
execute()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

