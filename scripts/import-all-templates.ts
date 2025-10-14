/**
 * Import All Templates Script
 * Imports all generated templates into the database with proper sorting
 */

import { batchImportTemplates } from '../services/templateService.js';
import { generateAllInteriorTemplates, getTemplatesByPopularity, getTemplatesByRoom } from './generate-templates.js';
import type { GeneratedTemplate } from './generate-templates.js';

interface ImportStats {
  total: number;
  successful: number;
  failed: number;
  byPopularity: {
    high: number;
    medium: number;
    low: number;
  };
  byRoom: Record<string, number>;
}

export async function importAllInteriorTemplates(): Promise<ImportStats> {
  console.log('🚀 Starting template import process...\n');

  const stats: ImportStats = {
    total: 0,
    successful: 0,
    failed: 0,
    byPopularity: { high: 0, medium: 0, low: 0 },
    byRoom: {},
  };

  try {
    // Generate all templates
    console.log('📝 Generating templates...');
    const templates = generateAllInteriorTemplates();
    stats.total = templates.length;

    const byPopularity = getTemplatesByPopularity(templates);
    const byRoom = getTemplatesByRoom(templates);

    console.log(`✅ Generated ${templates.length} templates\n`);
    console.log('📊 Breakdown by popularity:');
    console.log(`   🔥🔥🔥 High: ${byPopularity.high.length} templates`);
    console.log(`   🔥🔥   Medium: ${byPopularity.medium.length} templates`);
    console.log(`   🔥     Low: ${byPopularity.low.length} templates\n`);

    console.log('📊 Breakdown by room type:');
    for (const [room, roomTemplates] of Object.entries(byRoom)) {
      console.log(`   ${room}: ${roomTemplates.length} templates`);
      stats.byRoom[room] = roomTemplates.length;
    }
    console.log('');

    // Import in batches of 50
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < templates.length; i += batchSize) {
      batches.push(templates.slice(i, i + batchSize));
    }

    console.log(`📦 Importing in ${batches.length} batches of up to ${batchSize} templates each...\n`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`   Batch ${i + 1}/${batches.length}: Importing ${batch.length} templates...`);

      try {
        // Convert to format expected by batchImportTemplates
        const templateData = batch.map(t => ({
          name: t.name,
          image_url: t.imageUrl,
          prompt: t.prompt,
          main_category: t.main_category,
          sub_category: t.sub_category,
          room_type: t.room_type,
          enabled: t.enabled,
          sort_order: t.sort_order,
        }));

        await batchImportTemplates(templateData);
        stats.successful += batch.length;

        // Count by popularity
        for (const template of batch) {
          stats.byPopularity[template.popularity]++;
        }

        console.log(`   ✅ Batch ${i + 1} imported successfully\n`);
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed:`, error);
        stats.failed += batch.length;
      }

      // Small delay between batches to avoid overwhelming the database
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return stats;

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  }
}

export function printImportSummary(stats: ImportStats): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60) + '\n');

  console.log(`Total templates generated: ${stats.total}`);
  console.log(`✅ Successfully imported: ${stats.successful}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📈 Success rate: ${((stats.successful / stats.total) * 100).toFixed(1)}%\n`);

  console.log('Breakdown by popularity:');
  console.log(`  🔥🔥🔥 High priority: ${stats.byPopularity.high}`);
  console.log(`  🔥🔥   Medium priority: ${stats.byPopularity.medium}`);
  console.log(`  🔥     Low priority: ${stats.byPopularity.low}\n`);

  console.log('Breakdown by room type:');
  const sortedRooms = Object.entries(stats.byRoom)
    .sort(([, a], [, b]) => b - a);
  
  for (const [room, count] of sortedRooms) {
    console.log(`  ${room}: ${count} templates`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  importAllInteriorTemplates()
    .then((stats) => {
      printImportSummary(stats);
      
      if (stats.failed > 0) {
        console.log('⚠️  Some templates failed to import. Check the logs above for details.\n');
        process.exit(1);
      } else {
        console.log('✨ All templates imported successfully!\n');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('💥 Import process failed:', error);
      process.exit(1);
    });
}

