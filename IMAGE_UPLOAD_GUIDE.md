# Image Upload Guide for MyNook Templates

**Version:** 1.0  
**Date:** October 12, 2025  
**Purpose:** Step-by-step guide for generating and uploading template images

---

## 📋 Overview

This guide explains how to generate high-quality images for your MyNook templates and update the database with the image URLs.

**Total Templates:** ~180-200 (Interior Design only)  
**Recommended Priority:** Start with high-priority styles (🔥🔥🔥)

---

## 🎯 Quick Start Workflow

1. Open `templates-image-mapping-simple.csv`
2. Sort by Popularity (high first)
3. Generate images using the prompts
4. Upload images to Google Cloud Storage
5. Update CSV with actual URLs
6. Run bulk update script (future)

---

## 📊 Step 1: Understanding Your CSV Files

### File 1: `templates-image-mapping.csv` (Complete Details)

**Best For:** Full information including complete prompts

**Columns:**
- **Template ID:** Unique identifier for tracking
- **Category:** Always "Interior Design" for now
- **Room Type:** Specific room (e.g., "living-room", "bedroom")
- **Style Name:** Style only (e.g., "Latte Creamy Style")
- **Full Name:** Complete template name (e.g., "Latte Creamy Style Living Room")
- **Prompt:** Full MyNook-V1.0-Universal formatted prompt
- **Image Status:** pending/ready (update when done)
- **Image URL:** Placeholder initially
- **Sort Order:** Priority number (lower = higher priority)
- **Popularity:** high/medium/low
- **Notes:** Your custom notes

### File 2: `templates-image-mapping-simple.csv` (Quick Reference)

**Best For:** Quick overview and tracking

**Columns:**
- Room Type
- Style Name
- Full Name
- Popularity
- Image Status
- Image URL

---

## 🎨 Step 2: Generate Images

### Option A: Using Vertex AI / Imagen (Recommended)

**Your current setup:**

1. **Access Vertex AI:**
   ```
   https://console.cloud.google.com/vertex-ai/generative/images/create
   ```

2. **For each template:**
   - Copy the prompt from CSV
   - Use as generation prompt
   - Set image size: 1920x1080 (minimum)
   - Generate multiple variations (3-5 recommended)
   - Select best result

3. **Quality Settings:**
   - Aspect Ratio: 16:9 or 4:3
   - Quality: High
   - Number of images: 3-5 per prompt
   - Style: Photorealistic

### Option B: Using Gemini API (Programmatic)

**Create a script:**

```typescript
// Example: scripts/generate-images-vertex.ts

import { VertexAI } from '@google-cloud/vertexai';

async function generateImage(prompt: string, outputPath: string) {
  const vertexAI = new VertexAI({
    project: 'your-project-id',
    location: 'us-central1'
  });

  const model = vertexAI.preview.getGenerativeModel({
    model: 'imagegeneration@005',
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  // Save image
  // ... implementation
}
```

### Option C: Using Other AI Image Generators

**Alternatives:**
- Midjourney (via Discord)
- DALL-E 3 (via OpenAI API)
- Stable Diffusion (local)
- Leonardo.ai
- Firefly (Adobe)

**Note:** Prompts are optimized for Vertex AI but work well with most models.

---

## 📤 Step 3: Upload Images to Google Cloud Storage

### Setup Storage Bucket

1. **Create/Access Bucket:**
   ```bash
   gsutil mb gs://mynook-templates/
   ```

2. **Set Public Access (if needed):**
   ```bash
   gsutil iam ch allUsers:objectViewer gs://mynook-templates
   ```

### Naming Convention

**Format:** `{room-type}-{style-id}.png`

**Examples:**
- `living-room-latte-creamy-style.png`
- `bedroom-warm-minimalism.png`
- `kitchen-modern-farmhouse.png`

**Style ID Conversion:**
- Space to dash: " " → "-"
- Lowercase all
- Remove special characters

### Upload Images

**Option A: Web Console**
1. Go to: https://console.cloud.google.com/storage
2. Select your bucket
3. Click "Upload Files"
4. Select images
5. Upload

**Option B: gsutil Command**
```bash
gsutil cp *.png gs://mynook-templates/templates/
```

**Option C: Bulk Upload Script**
```bash
#!/bin/bash
for file in generated-images/*.png; do
  gsutil cp "$file" gs://mynook-templates/templates/
done
```

### Get Public URLs

After upload, URLs will follow this pattern:
```
https://storage.googleapis.com/mynook-templates/templates/{filename}
```

---

## 📝 Step 4: Update CSV with Actual URLs

### Manual Update

1. Open `templates-image-mapping-simple.csv` in Excel or Google Sheets
2. For each completed template:
   - Change **Image Status** from "pending" to "ready"
   - Update **Image URL** with actual URL
   - Add any **Notes** if needed

3. Save the file

### Example:

**Before:**
```csv
living-room,Latte Creamy Style,Latte Creamy Style Living Room,high,pending,https://storage.googleapis.com/aistudio-hosting/templates/placeholder-living-room-latte-creamy-style.png
```

**After:**
```csv
living-room,Latte Creamy Style,Latte Creamy Style Living Room,high,ready,https://storage.googleapis.com/mynook-templates/templates/living-room-latte-creamy-style.png
```

---

## 🔄 Step 5: Bulk Update Database (Future Script)

**Script to be created:** `scripts/update-template-images.ts`

**Will support:**
- Read CSV with updated URLs
- Match templates by name
- Bulk update image_url in database
- Verify all updates successful

**Usage (when created):**
```bash
npm run update-template-images
```

**Current Workaround:** Use Admin Panel to update images individually

---

## 🎯 Priority Generation Strategy

### Phase 1: Top 10 Styles (All Rooms) - ~100 images

Generate images for highest-priority styles across main rooms:

1. **Latte / Creamy Style** 🔥🔥🔥 - 28 rooms
2. **Dopamine Decor** 🔥🔥🔥 - Focus on: Kids Room, Living Room, Game Room
3. **Organic Modern** 🔥🔥🔥 - Focus on: Bathrooms, Bedrooms, Living Rooms
4. **Quiet Luxury** 🔥🔥🔥 - Focus on: Master Bedroom, Master Bathroom, Living Room
5. **Warm Minimalism** 🔥🔥🔥 - All major rooms

**Estimated:** 100-120 images

### Phase 2: Popular Styles (Selected Rooms) - ~50 images

6. Scandinavian
7. Maximalist
8. Japandi
9. Modern Farmhouse
10. Modern Minimalist

**Focus on:** Living Room, Kitchen, Bedroom only

### Phase 3: Remaining Styles - As Needed

Generate remaining templates based on user demand and analytics.

---

## 💡 Image Generation Tips

### Quality Requirements

- **Minimum Resolution:** 1920x1080 (Full HD)
- **Recommended:** 2560x1440 or higher
- **Aspect Ratio:** 16:9 preferred
- **Format:** PNG or high-quality JPG
- **File Size:** Under 2MB (optimize if needed)

### Prompt Optimization

**The prompts are already optimized, but if needed:**

1. **For better lighting:**
   - Emphasize "soft natural light"
   - Add "golden hour" for warm scenes

2. **For more detail:**
   - Add "extreme detail, 8K resolution"
   - Specify "photorealistic rendering"

3. **For specific camera angles:**
   - "Eye-level view" for living rooms
   - "Slightly elevated view" for kitchens
   - "Wide-angle architectural shot" for full rooms

### Common Issues & Fixes

**Problem:** Generated image shows old/worn elements

**Solution:** Re-emphasize in prompt:
```
CRITICAL: ALL surfaces must be brand new, pristine, and fully finished.
NO worn textures, dirt, or damage should be visible.
```

**Problem:** Image doesn't match style

**Solution:** Strengthen style-specific details:
- Add more specific material descriptions
- Specify exact color hex codes if needed
- Reference specific furniture brands or designers

**Problem:** Room layout wrong

**Solution:** Adjust prompt to emphasize:
```
Strictly maintain the spatial structure and proportions from the input image.
```

---

## 📊 Tracking Progress

### Use Spreadsheet Features

**Google Sheets Tips:**

1. **Conditional Formatting:**
   - Green for "ready"
   - Yellow for "in-progress"
   - Red for "pending"

2. **Filter View:**
   - Filter by Room Type
   - Filter by Popularity
   - Filter by Status

3. **Progress Counter:**
   ```
   =COUNTIF(F:F,"ready")/COUNTA(F:F)*100
   ```

### Progress Dashboard (Optional)

Create a summary sheet:

| Room Type | Total | Complete | Pending | % Done |
|-----------|-------|----------|---------|--------|
| Living Room | 28 | 15 | 13 | 54% |
| Bedroom | 18 | 10 | 8 | 56% |
| ... | ... | ... | ... | ... |

---

## 🔐 Security & Access

### Google Cloud Storage Permissions

**For Public Templates:**
```bash
gsutil iam ch allUsers:objectViewer gs://mynook-templates
```

**For Private Templates:**
- Keep bucket private
- Use signed URLs for temporary access
- Implement authentication in app

### Best Practices

1. ✅ Keep original high-res images in separate folder
2. ✅ Version images if regenerating (v1, v2, etc.)
3. ✅ Backup CSV files regularly
4. ✅ Document any prompt modifications
5. ✅ Track costs (Vertex AI usage)

---

## 💰 Cost Estimation

### Vertex AI Imagen Pricing (Approximate)

**Per image generation:**
- Imagen 2: ~$0.02 per image
- Imagen 3 (high quality): ~$0.04 per image

**For 200 templates (3 variations each):**
- Total images: 600
- Cost: $12 - $24
- With selection: ~$20 average

**Storage (Google Cloud):**
- $0.020 per GB per month
- 200 images × 1MB each = 200MB
- Cost: ~$0.004/month (negligible)

---

## 📞 Need Help?

### Common Questions

**Q: How long does it take to generate all images?**
A: Approximately 4-6 hours if doing Phase 1 (100 images), depending on generation speed and selection time.

**Q: Can I batch generate images?**
A: Yes! Use the Vertex AI API to automate generation. See Option B in Step 2.

**Q: What if I don't like the generated image?**
A: Regenerate with slight prompt modifications or try different seed values.

**Q: Should I edit images in Photoshop?**
A: Minimal editing is fine (cropping, color correction), but avoid major changes as they may not match the prompt for future regenerations.

---

## ✅ Checklist

Use this checklist as you work through the images:

- [ ] Downloaded both CSV files
- [ ] Set up Google Cloud Storage bucket
- [ ] Configured Vertex AI access
- [ ] Generated first 10 test images
- [ ] Uploaded test images successfully
- [ ] Verified image URLs work
- [ ] Updated CSV with first batch
- [ ] Organized workflow (which room/style first)
- [ ] Set up progress tracking system
- [ ] Completed Phase 1 (top 10 styles)
- [ ] Completed Phase 2 (popular styles)
- [ ] All images uploaded and verified
- [ ] CSV completely updated
- [ ] Backup of all files created

---

## 🎉 Completion

Once all images are generated and uploaded:

1. ✅ Final CSV review
2. ✅ Run bulk database update (when script ready)
3. ✅ Test in Admin Panel
4. ✅ Test in user-facing app
5. ✅ Archive generation materials
6. ✅ Celebrate! 🎊

---

**Guide Version:** 1.0  
**Last Updated:** October 12, 2025  
**For:** MyNook Template System v2.0

