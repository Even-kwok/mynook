/**
 * Generate CSV Tracker Script
 * Creates a CSV file for tracking image generation progress
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateAllInteriorTemplates } from './generate-templates.js';

interface CSVRow {
  templateId: string;
  category: string;
  roomType: string;
  styleName: string;
  fullName: string;
  prompt: string;
  imageStatus: string;
  imageUrl: string;
  sortOrder: number;
  popularity: string;
  notes: string;
}

function escapeCSV(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCSV(): string {
  const templates = generateAllInteriorTemplates();
  
  const headers = [
    'Template ID',
    'Category',
    'Room Type',
    'Style Name',
    'Full Name',
    'Prompt',
    'Image Status',
    'Image URL',
    'Sort Order',
    'Popularity',
    'Notes'
  ];

  const rows: string[] = [headers.join(',')];

  // Sort by popularity (high first) then by sort order
  const sortedTemplates = templates.sort((a, b) => {
    const popularityOrder = { high: 0, medium: 1, low: 2 };
    const popDiff = popularityOrder[a.popularity] - popularityOrder[b.popularity];
    if (popDiff !== 0) return popDiff;
    return a.sort_order - b.sort_order;
  });

  for (const template of sortedTemplates) {
    const row: CSVRow = {
      templateId: `TEMPLATE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      category: template.main_category,
      roomType: template.room_type || 'N/A',
      styleName: template.name.replace(/\s+(Living Room|Bedroom|Kitchen|Bathroom|Dining Room|Home Office|.*)/i, '').trim(),
      fullName: template.name,
      prompt: template.prompt,
      imageStatus: 'pending',
      imageUrl: template.imageUrl,
      sortOrder: template.sort_order,
      popularity: template.popularity,
      notes: '',
    };

    const csvRow = [
      row.templateId,
      escapeCSV(row.category),
      escapeCSV(row.roomType),
      escapeCSV(row.styleName),
      escapeCSV(row.fullName),
      escapeCSV(row.prompt),
      row.imageStatus,
      escapeCSV(row.imageUrl),
      row.sortOrder.toString(),
      row.popularity,
      row.notes
    ].join(',');

    rows.push(csvRow);
  }

  return rows.join('\n');
}

export function createCSVFile(outputPath?: string): string {
  console.log('📊 Generating CSV tracker file...\n');

  const csv = generateCSV();
  const filePath = outputPath || path.join(process.cwd(), 'templates-image-mapping.csv');

  fs.writeFileSync(filePath, csv, 'utf-8');

  console.log(`✅ CSV file created: ${filePath}`);
  console.log(`📄 Total rows: ${csv.split('\n').length - 1} templates\n`);

  return filePath;
}

// Also create a simplified CSV for easy reference
export function createSimplifiedCSV(outputPath?: string): string {
  console.log('📊 Generating simplified CSV for quick reference...\n');

  const templates = generateAllInteriorTemplates();
  
  const headers = [
    'Room Type',
    'Style Name',
    'Full Name',
    'Popularity',
    'Image Status',
    'Image URL'
  ];

  const rows: string[] = [headers.join(',')];

  const sortedTemplates = templates.sort((a, b) => {
    // Sort by room type, then popularity, then sort order
    const roomCompare = (a.room_type || '').localeCompare(b.room_type || '');
    if (roomCompare !== 0) return roomCompare;

    const popularityOrder = { high: 0, medium: 1, low: 2 };
    const popDiff = popularityOrder[a.popularity] - popularityOrder[b.popularity];
    if (popDiff !== 0) return popDiff;
    
    return a.sort_order - b.sort_order;
  });

  for (const template of sortedTemplates) {
    const styleName = template.name.replace(/\s+(Living Room|Bedroom|Kitchen|Bathroom|Dining Room|Home Office|.*)/i, '').trim();
    
    const csvRow = [
      escapeCSV(template.room_type || 'N/A'),
      escapeCSV(styleName),
      escapeCSV(template.name),
      template.popularity,
      'pending',
      escapeCSV(template.imageUrl)
    ].join(',');

    rows.push(csvRow);
  }

  const csv = rows.join('\n');
  const filePath = outputPath || path.join(process.cwd(), 'templates-image-mapping-simple.csv');

  fs.writeFileSync(filePath, csv, 'utf-8');

  console.log(`✅ Simplified CSV file created: ${filePath}`);
  console.log(`📄 Total rows: ${csv.split('\n').length - 1} templates\n`);

  return filePath;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    createCSVFile();
    createSimplifiedCSV();
    console.log('✨ CSV tracker files generated successfully!\n');
    console.log('📝 You can now use these files to:');
    console.log('   1. Track image generation progress');
    console.log('   2. Map generated images to templates');
    console.log('   3. Fill in actual image URLs');
    console.log('   4. Add notes for each template\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate CSV files:', error);
    process.exit(1);
  }
}

