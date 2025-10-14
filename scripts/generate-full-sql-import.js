/**
 * Generate COMPLETE SQL Import (180-200 templates)
 * This generates ALL templates from the full system design
 */

import { generateAllInteriorTemplates } from './generate-templates.js';

// Escape single quotes for SQL
function escapeSql(text) {
  return text.replace(/'/g, "''");
}

// Generate complete SQL
async function generateCompleteSql() {
  console.log('🚀 Generating COMPLETE template system SQL...\n');
  
  // Generate all templates using the full TypeScript system
  const templates = generateAllInteriorTemplates();
  
  console.log(`📊 Total templates generated: ${templates.length}\n`);
  
  // Group by room type for stats
  const byRoom = {};
  templates.forEach(t => {
    byRoom[t.room_type] = (byRoom[t.room_type] || 0) + 1;
  });
  
  console.log('📈 Distribution by room type:');
  Object.entries(byRoom).sort(([,a], [,b]) => b - a).forEach(([room, count]) => {
    console.log(`   ${room}: ${count} templates`);
  });
  console.log('');
  
  // Generate SQL
  console.log('-- =================================================================');
  console.log('-- MyNook Complete Template System Import');
  console.log(`-- Total Templates: ${templates.length}`);
  console.log('-- Generated:', new Date().toISOString());
  console.log('-- =================================================================\n');
  
  console.log('-- Step 1: Clear existing Interior Design templates');
  console.log("DELETE FROM public.design_templates WHERE main_category = 'Interior Design';\n");
  
  console.log('-- Step 2: Insert all templates');
  console.log(`-- Importing ${templates.length} templates...\n`);
  
  // Generate INSERT statements
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    
    const sql = `INSERT INTO public.design_templates (name, image_url, prompt, main_category, sub_category, room_type, enabled, sort_order)
VALUES (
  '${escapeSql(t.name)}',
  '${escapeSql(t.imageUrl)}',
  '${escapeSql(t.prompt)}',
  '${escapeSql(t.main_category)}',
  '${escapeSql(t.sub_category)}',
  '${escapeSql(t.room_type)}',
  ${t.enabled},
  ${t.sort_order}
);`;
    
    console.log(sql);
    console.log('');
    
    // Progress indicator
    if ((i + 1) % 50 === 0) {
      console.log(`-- Progress: ${i + 1}/${templates.length} templates (${((i + 1) / templates.length * 100).toFixed(1)}%)\n`);
    }
  }
  
  console.log('-- =================================================================');
  console.log(`-- Import Complete! Total: ${templates.length} templates`);
  console.log('-- =================================================================');
  
  // Summary
  console.error('\n✅ SQL Generation Complete!');
  console.error(`📊 Total templates: ${templates.length}`);
  console.error('\n📝 Next steps:');
  console.error('   1. Copy the SQL output above');
  console.error('   2. Open Supabase SQL Editor');
  console.error('   3. Paste and execute');
  console.error('   4. Verify in Table Editor\n');
}

// Run
generateCompleteSql().catch(console.error);

