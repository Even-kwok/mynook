/**
 * Master Template System Overhaul Script
 * Orchestrates the complete template system regeneration
 */

import { clearAllTemplates } from './clear-templates.js';
import { importAllInteriorTemplates, printImportSummary } from './import-all-templates.js';
import { createCSVFile, createSimplifiedCSV } from './generate-csv-tracker.js';

async function executeTemplateOverhaul() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        MyNook Template System Complete Overhaul            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Clear existing templates
    console.log('📍 STEP 1/3: Clearing existing templates...\n');
    await clearAllTemplates();
    console.log('✅ Step 1 complete!\n');

    // Step 2: Import new templates
    console.log('📍 STEP 2/3: Importing new templates...\n');
    const stats = await importAllInteriorTemplates();
    printImportSummary(stats);
    console.log('✅ Step 2 complete!\n');

    // Step 3: Generate CSV tracker files
    console.log('📍 STEP 3/3: Generating CSV tracker files...\n');
    createCSVFile();
    createSimplifiedCSV();
    console.log('✅ Step 3 complete!\n');

    // Final summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  🎉 SUCCESS! 🎉                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Final Statistics:');
    console.log(`   • Total templates imported: ${stats.successful}`);
    console.log(`   • Failed imports: ${stats.failed}`);
    console.log(`   • Success rate: ${((stats.successful / stats.total) * 100).toFixed(1)}%\n`);

    console.log('📝 Next Steps:');
    console.log('   1. Review the generated CSV files:');
    console.log('      - templates-image-mapping.csv (full details)');
    console.log('      - templates-image-mapping-simple.csv (quick reference)');
    console.log('   2. Generate images using the prompts from the CSV');
    console.log('   3. Upload images to your storage');
    console.log('   4. Update the CSV with actual image URLs');
    console.log('   5. Run the image URL update script (to be created)\n');

    console.log('📚 Documentation generated:');
    console.log('   - TEMPLATE_SYSTEM_OVERHAUL_REPORT.md');
    console.log('   - IMAGE_UPLOAD_GUIDE.md\n');

    if (stats.failed > 0) {
      console.log('⚠️  Warning: Some templates failed to import. Please review the logs above.\n');
      process.exit(1);
    } else {
      console.log('✨ Template system overhaul completed successfully!\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║                    ❌ FAILED ❌                            ║');
    console.error('╚════════════════════════════════════════════════════════════╝\n');
    console.error('💥 Error during template overhaul:', error);
    console.error('\nPlease review the error above and try again.\n');
    process.exit(1);
  }
}

// Execute if run directly - always execute when this file is run
executeTemplateOverhaul();

export { executeTemplateOverhaul };

