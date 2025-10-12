# MyNook Template Generation Scripts

This directory contains all scripts for managing the MyNook template system.

---

## 📜 Script Overview

### Core Scripts

#### 1. `generate-templates.ts`
**Purpose:** Generates all interior design templates with high-quality prompts

**Exports:**
- `generateAllInteriorTemplates()` - Main generation function
- `DESIGN_STYLES` - All 44 design styles with popularity rankings
- `ROOM_STYLE_MATRIX` - Which styles work for which rooms
- `STYLE_DESCRIPTIONS` - Detailed style-specific descriptions

**Usage:**
```typescript
import { generateAllInteriorTemplates } from './generate-templates';

const templates = generateAllInteriorTemplates();
console.log(`Generated ${templates.length} templates`);
```

---

#### 2. `clear-templates.ts`
**Purpose:** Removes existing templates from database

**Functions:**
- `clearAllTemplates()` - Removes ALL templates
- `clearTemplatesByCategory(category)` - Removes templates from specific category

**Usage:**
```bash
# Clear all templates
ts-node scripts/clear-templates.ts

# Or in code
import { clearAllTemplates } from './clear-templates';
await clearAllTemplates();
```

**⚠️ WARNING:** This permanently deletes templates. Make sure you have backups!

---

#### 3. `import-all-templates.ts`
**Purpose:** Imports generated templates into database

**Functions:**
- `importAllInteriorTemplates()` - Imports all templates with progress tracking
- `printImportSummary(stats)` - Displays import statistics

**Features:**
- Batch processing (50 templates at a time)
- Error handling with retry logic
- Progress tracking by popularity and room type
- Detailed statistics reporting

**Usage:**
```bash
# Import all templates
ts-node scripts/import-all-templates.ts

# Or in code
import { importAllInteriorTemplates } from './import-all-templates';
const stats = await importAllInteriorTemplates();
```

---

#### 4. `generate-csv-tracker.ts`
**Purpose:** Creates CSV files for tracking image generation progress

**Functions:**
- `createCSVFile(outputPath)` - Creates full CSV with all details
- `createSimplifiedCSV(outputPath)` - Creates quick-reference CSV

**Outputs:**
- `templates-image-mapping.csv` - Complete data including full prompts
- `templates-image-mapping-simple.csv` - Simplified for easy tracking

**Usage:**
```bash
# Generate both CSV files
ts-node scripts/generate-csv-tracker.ts

# Or in code
import { createCSVFile, createSimplifiedCSV } from './generate-csv-tracker';
createCSVFile();
createSimplifiedCSV();
```

---

#### 5. `execute-template-overhaul.ts` ⭐ MASTER SCRIPT
**Purpose:** Orchestrates complete template system regeneration

**Process:**
1. Clears existing templates
2. Imports all new templates
3. Generates CSV tracking files

**Usage:**
```bash
# Run complete overhaul
ts-node scripts/execute-template-overhaul.ts
```

**This is the main script to run for complete system regeneration!**

---

## 🚀 Quick Start Guide

### First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Ensure `config/supabase.ts` has correct credentials
   - Verify database connection

3. **Run complete overhaul:**
   ```bash
   ts-node scripts/execute-template-overhaul.ts
   ```

4. **Check outputs:**
   - Database should have ~180-200 new templates
   - CSV files should be in project root
   - Console should show success message

---

## 📊 Understanding Template Generation

### Design Styles (44 total)

Organized into 7 categories with popularity rankings:

**High Priority (🔥🔥🔥) - 15 styles:**
- Latte / Creamy Style (#1 trend)
- Dopamine Decor (#2 trend)
- Organic Modern
- Quiet Luxury
- Warm Minimalism
- Scandinavian
- Maximalist
- Japandi
- Modern Farmhouse
- Modern Minimalist
- Mid-Century Modern
- Coastal
- Grandmillennial
- Bohemian
- Cottagecore

**Medium & Low Priority - 29 styles:**
- See `DESIGN_STYLES` in `generate-templates.ts`

### Room Types (32 total)

- **Basic Living Spaces:** 12 rooms
- **Functional Spaces:** 8 rooms
- **Entertainment Spaces:** 7 rooms
- **Transitional Spaces:** 5 rooms

### Prompt Format

All prompts follow **MyNook-V1.0-Universal** format:

```
---[ 提示词开始 / PROMPT START ]---
[Base transformation instructions]
[Specific style description for room]
[Quality and rendering specifications]
---[ 提示词结束 / PROMPT END ]---
// Project: MyNook
// Recipe Version: MyNook-V1.0-Universal
```

---

## 🔄 Common Workflows

### Workflow 1: Complete System Reset

```bash
# Step 1: Backup current data (manual - export from Supabase)

# Step 2: Run master script
ts-node scripts/execute-template-overhaul.ts

# Step 3: Verify in database
# Check Supabase dashboard for new templates

# Step 4: Generate images
# Use CSV files to track progress
```

### Workflow 2: Add New Style

1. **Update `generate-templates.ts`:**
   ```typescript
   // Add to DESIGN_STYLES array
   {
     id: 'new-style-id',
     name: 'New Style Name',
     category: 'category-name',
     popularity: 'high',
     sortOrder: 44
   }
   
   // Add to STYLE_DESCRIPTIONS
   'new-style-id': 'Full description...'
   
   // Add to ROOM_STYLE_MATRIX for applicable rooms
   'living-room': [..., 'new-style-id']
   ```

2. **Regenerate templates:**
   ```bash
   ts-node scripts/import-all-templates.ts
   ```

### Workflow 3: Update Existing Prompts

1. **Modify `STYLE_DESCRIPTIONS` in `generate-templates.ts`**

2. **Clear and reimport:**
   ```bash
   ts-node scripts/execute-template-overhaul.ts
   ```

### Workflow 4: Test Single Room

```typescript
// Create test script
import { generateAllInteriorTemplates } from './generate-templates';

const templates = generateAllInteriorTemplates();
const livingRoomTemplates = templates.filter(t => t.room_type === 'living-room');

console.log(`Living Room templates: ${livingRoomTemplates.length}`);
livingRoomTemplates.forEach(t => {
  console.log(`- ${t.name} (Priority: ${t.popularity})`);
});
```

---

## 📁 File Structure

```
scripts/
├── README.md (this file)
├── generate-templates.ts (Template generation logic)
├── clear-templates.ts (Database cleanup)
├── import-all-templates.ts (Batch import)
├── generate-csv-tracker.ts (CSV generation)
└── execute-template-overhaul.ts (Master orchestration)
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@supabase/supabase-js'"
**Solution:** 
```bash
npm install @supabase/supabase-js
```

### Issue: "Database connection failed"
**Solution:**
1. Check `config/supabase.ts` credentials
2. Verify internet connection
3. Check Supabase project status

### Issue: "Templates not appearing in UI"
**Solution:**
1. Verify `enabled: true` in database
2. Check `room_type` field is correct
3. Clear browser cache
4. Check `getAllTemplatesPublic()` function

### Issue: "Import fails halfway"
**Solution:**
- Script has retry logic and continues from where it failed
- Check console for specific error message
- Run import script again (won't duplicate)

### Issue: "CSV file has garbled text"
**Solution:**
- Open in Excel/Google Sheets with UTF-8 encoding
- Use text editor that supports UTF-8

---

## 🧪 Testing Scripts

### Test Template Generation
```typescript
// test-generation.ts
import { generateAllInteriorTemplates } from './generate-templates';

const templates = generateAllInteriorTemplates();
console.log(`Total: ${templates.length}`);
console.log(`First template:`, templates[0]);
```

### Test Database Connection
```typescript
// test-db.ts
import { supabase } from '../config/supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('design_templates')
    .select('count');
  
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('Connection successful!');
  }
}

testConnection();
```

---

## 📊 Statistics

**Current System Capacity:**
- 32 room types
- 44 design styles
- ~180-200 Interior Design templates
- Potential for 1,408 total combinations (32 × 44)
- Actual templates: ~180-200 (curated combinations)

**Prompt Quality:**
- Average length: 600-800 words
- Format: MyNook-V1.0-Universal
- Quality standard: Publication-grade

---

## 🔮 Future Enhancements

- [ ] Add Exterior Design template generation
- [ ] Add Garden & Outdoor template generation
- [ ] Add Festive Decor template generation
- [ ] Create image bulk update script
- [ ] Add template versioning system
- [ ] Create template preview generator
- [ ] Add A/B testing for prompts
- [ ] Implement automated image generation integration

---

## 📞 Support

For issues or questions:
1. Check `TEMPLATE_SYSTEM_OVERHAUL_REPORT.md`
2. Review `IMAGE_UPLOAD_GUIDE.md`
3. Check console output for error messages
4. Verify database schema matches expectations

---

**Last Updated:** October 12, 2025  
**Version:** 2.0  
**Status:** Production Ready ✅

