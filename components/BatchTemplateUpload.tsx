import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconUpload, IconPhoto, IconCheck, IconAlertCircle } from './Icons';
import { supabase } from '../config/supabase';
import { batchImportTemplates } from '../services/templateService';

interface ParsedTemplate {
  file: File;
  preview: string;
  name: string;
  prompt: string | null;
  mainCategory: string;
  subCategory: string;
  roomType?: string;
  roomTypeId?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface BatchTemplateUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 房间类型映射（按优先级排序，长的先匹配）
const ROOM_TYPE_PATTERNS = [
  { pattern: /master[- ]?bedroom/i, roomTypeId: 'master-bedroom', displayName: 'Master Bedroom' },
  { pattern: /guest[- ]?bedroom/i, roomTypeId: 'guest-bedroom', displayName: 'Guest Bedroom' },
  { pattern: /kids?[- ]?room/i, roomTypeId: 'kids-room', displayName: 'Kids Room' },
  { pattern: /teen[- ]?room/i, roomTypeId: 'teen-room', displayName: 'Teen Room' },
  { pattern: /nursery/i, roomTypeId: 'nursery', displayName: 'Nursery' },
  { pattern: /living[- ]?room/i, roomTypeId: 'living-room', displayName: 'Living Room' },
  { pattern: /dining[- ]?room/i, roomTypeId: 'dining-room', displayName: 'Dining Room' },
  { pattern: /master[- ]?bathroom/i, roomTypeId: 'master-bathroom', displayName: 'Master Bathroom' },
  { pattern: /powder[- ]?room/i, roomTypeId: 'powder-room', displayName: 'Powder Room' },
  { pattern: /home[- ]?office/i, roomTypeId: 'home-office', displayName: 'Home Office' },
  { pattern: /study|library/i, roomTypeId: 'study-library', displayName: 'Study / Library' },
  { pattern: /laundry[- ]?room/i, roomTypeId: 'laundry-room', displayName: 'Laundry Room' },
  { pattern: /mudroom|entryway/i, roomTypeId: 'mudroom-entryway', displayName: 'Mudroom / Entryway' },
  { pattern: /walk[- ]?in[- ]?closet/i, roomTypeId: 'walk-in-closet', displayName: 'Walk-in Closet' },
  { pattern: /pantry/i, roomTypeId: 'pantry', displayName: 'Pantry' },
  { pattern: /attic/i, roomTypeId: 'attic', displayName: 'Attic' },
  { pattern: /basement/i, roomTypeId: 'basement', displayName: 'Basement' },
  { pattern: /home[- ]?theater/i, roomTypeId: 'home-theater', displayName: 'Home Theater' },
  { pattern: /game[- ]?room/i, roomTypeId: 'game-room', displayName: 'Game Room' },
  { pattern: /home[- ]?gym|gym/i, roomTypeId: 'home-gym', displayName: 'Home Gym' },
  { pattern: /yoga|meditation/i, roomTypeId: 'yoga-meditation-room', displayName: 'Yoga / Meditation Room' },
  { pattern: /home[- ]?bar|bar/i, roomTypeId: 'home-bar', displayName: 'Home Bar' },
  { pattern: /music[- ]?room/i, roomTypeId: 'music-room', displayName: 'Music Room' },
  { pattern: /craft|hobby/i, roomTypeId: 'craft-hobby-room', displayName: 'Craft / Hobby Room' },
  { pattern: /hallway|corridor/i, roomTypeId: 'hallway-corridor', displayName: 'Hallway / Corridor' },
  { pattern: /staircase/i, roomTypeId: 'staircase', displayName: 'Staircase' },
  { pattern: /sunroom|conservatory/i, roomTypeId: 'sunroom-conservatory', displayName: 'Sunroom / Conservatory' },
  { pattern: /balcony|terrace/i, roomTypeId: 'balcony-terrace', displayName: 'Balcony / Terrace' },
  { pattern: /garage/i, roomTypeId: 'garage', displayName: 'Garage' },
  { pattern: /\bbedroom\b/i, roomTypeId: 'bedroom', displayName: 'Bedroom' },
  { pattern: /\bkitchen\b/i, roomTypeId: 'kitchen', displayName: 'Kitchen' },
  { pattern: /\bbathroom\b/i, roomTypeId: 'bathroom', displayName: 'Bathroom' },
];

// 建筑类型模式（用于 Exterior Design）
const BUILDING_TYPE_PATTERNS = [
  { pattern: /modern[- ]?house/i, buildingTypeId: 'modern-house', displayName: 'Modern House' },
  { pattern: /a[- ]?frame/i, buildingTypeId: 'a-frame', displayName: 'A-Frame' },
  { pattern: /apartment[- ]?building/i, buildingTypeId: 'apartment-building', displayName: 'Apartment Building' },
  { pattern: /art[- ]?deco[- ]?house/i, buildingTypeId: 'art-deco-house', displayName: 'Art Deco House' },
  { pattern: /beach[- ]?house/i, buildingTypeId: 'beach-house', displayName: 'Beach House' },
  { pattern: /\bbungalow\b/i, buildingTypeId: 'bungalow', displayName: 'Bungalow' },
  { pattern: /cape[- ]?cod/i, buildingTypeId: 'cape-cod', displayName: 'Cape Cod' },
  { pattern: /\bchateau\b/i, buildingTypeId: 'chateau', displayName: 'Chateau' },
  { pattern: /colonial[- ]?house/i, buildingTypeId: 'colonial-house', displayName: 'Colonial House' },
  { pattern: /container[- ]?home/i, buildingTypeId: 'container-home', displayName: 'Container Home' },
  { pattern: /\bcottage\b/i, buildingTypeId: 'cottage', displayName: 'Cottage' },
  { pattern: /\bfarmhouse\b/i, buildingTypeId: 'farmhouse', displayName: 'Farmhouse' },
  { pattern: /\bgeorgian\b/i, buildingTypeId: 'georgian', displayName: 'Georgian' },
  { pattern: /greek[- ]?revival/i, buildingTypeId: 'greek-revival', displayName: 'Greek Revival' },
  { pattern: /log[- ]?cabin/i, buildingTypeId: 'log-cabin', displayName: 'Log Cabin' },
  { pattern: /\bmansion\b/i, buildingTypeId: 'mansion', displayName: 'Mansion' },
  { pattern: /mediterranean[- ]?villa/i, buildingTypeId: 'mediterranean-villa', displayName: 'Mediterranean Villa' },
  { pattern: /mid[- ]?century[- ]?modern/i, buildingTypeId: 'mid-century-modern', displayName: 'Mid-Century Modern' },
  { pattern: /prairie[- ]?style/i, buildingTypeId: 'prairie-style', displayName: 'Prairie Style' },
  { pattern: /ranch[- ]?house/i, buildingTypeId: 'ranch-house', displayName: 'Ranch House' },
  { pattern: /spanish[- ]?colonial/i, buildingTypeId: 'spanish-colonial', displayName: 'Spanish Colonial' },
  { pattern: /tiny[- ]?house/i, buildingTypeId: 'tiny-house', displayName: 'Tiny House' },
  { pattern: /\btownhouse\b/i, buildingTypeId: 'townhouse', displayName: 'Townhouse' },
  { pattern: /tudor[- ]?house/i, buildingTypeId: 'tudor-house', displayName: 'Tudor House' },
  { pattern: /victorian[- ]?house/i, buildingTypeId: 'victorian-house', displayName: 'Victorian House' },
];

// 其他分类模式
const CATEGORY_PATTERNS = [
  { pattern: /\bgarden\b|\blandscape\b|\bbackyard\b|\boutdoor\b/i, mainCategory: 'Exterior Design', subCategory: 'Garden' },
  { pattern: /\bwall\b.*\bpaint\b|\bpaint\b.*\bcolor\b/i, mainCategory: 'Wall Paint', subCategory: 'Color Palettes' },
  { pattern: /\bfloor\b|\bflooring\b/i, mainCategory: 'Floor Style', subCategory: 'Flooring Materials' },
];

// 从 PNG 元数据提取提示词
const extractPromptFromImage = async (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        
        // 检查是否为 PNG 文件
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          // 查找 tEXt 或 iTXt chunks
          let i = 8; // 跳过 PNG 签名
          
          while (i < bytes.length - 12) {
            const length = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
            const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
            
            if (type === 'tEXt' || type === 'iTXt') {
              const chunkData = bytes.slice(i + 8, i + 8 + length);
              let text = '';
              
              try {
                // 尝试解码文本
                const decoder = new TextDecoder('utf-8');
                text = decoder.decode(chunkData);
              } catch (decodeError) {
                // 如果解码失败，尝试作为 ASCII
                text = String.fromCharCode(...Array.from(chunkData));
              }
              
              // 查找提示词关键字
              const promptKeywords = ['prompt', 'Prompt', 'PROMPT', 'parameters', 'Parameters', 'description', 'Description'];
              
              for (const keyword of promptKeywords) {
                if (text.toLowerCase().includes(keyword.toLowerCase())) {
                  // 提取关键字后的内容
                  const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
                  const afterKeyword = text.substring(keywordIndex + keyword.length).trim();
                  
                  // 移除可能的分隔符
                  const cleaned = afterKeyword.replace(/^[:：\s\0]+/, '').trim();
                  
                  if (cleaned && cleaned.length > 10) {
                    console.log(`✅ Found prompt in ${type} chunk:`, cleaned.substring(0, 100));
                    resolve(cleaned);
                    return;
                  }
                }
              }
              
              // 如果没有找到关键字，但chunk内容较长，可能整个就是提示词
              if (text.length > 20 && !text.includes('\0')) {
                const cleaned = text.trim();
                if (cleaned.length > 20) {
                  console.log(`✅ Found potential prompt in ${type} chunk:`, cleaned.substring(0, 100));
                  resolve(cleaned);
                  return;
                }
              }
            }
            
            i += 12 + length; // length(4) + type(4) + data + CRC(4)
          }
        }
        
        console.warn('❌ No prompt found in PNG metadata');
        resolve(null);
      } catch (error) {
        console.error('Error extracting prompt:', error);
        resolve(null);
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      resolve(null);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// 智能解析文件名
const parseFileName = (fileName: string): Omit<ParsedTemplate, 'file' | 'preview' | 'status' | 'prompt'> => {
  const nameWithoutExt = fileName.replace(/\.(png|jpg|jpeg)$/i, '');
  
  // 检查房间类型（Interior Design）
  for (const room of ROOM_TYPE_PATTERNS) {
    if (room.pattern.test(nameWithoutExt)) {
      // 对于 Interior Design，sub_category 设置为固定值 "Style"
      // 这样不会创建额外的子分类层级，模板直接归属到房间类型下
      return {
        name: nameWithoutExt,
        mainCategory: 'Interior Design',
        subCategory: 'Style', // 固定值，不创建额外层级
        roomType: room.displayName,
        roomTypeId: room.roomTypeId,
      };
    }
  }
  
  // 检查建筑类型（Exterior Design）
  for (const building of BUILDING_TYPE_PATTERNS) {
    if (building.pattern.test(nameWithoutExt)) {
      // 对于 Exterior Design，sub_category 设置为固定值 "Architectural Styles"
      // room_type 存储建筑类型，与 Interior Design 逻辑统一
      return {
        name: nameWithoutExt,
        mainCategory: 'Exterior Design',
        subCategory: 'Architectural Styles', // 固定值
        roomType: building.displayName,
        roomTypeId: building.buildingTypeId,
      };
    }
  }
  
  // 检查其他分类
  for (const cat of CATEGORY_PATTERNS) {
    if (cat.pattern.test(nameWithoutExt)) {
      return {
        name: nameWithoutExt,
        mainCategory: cat.mainCategory,
        subCategory: cat.subCategory, // 使用预定义的子分类
      };
    }
  }
  
  // 默认为 Interior Design - Living Room
  return {
    name: nameWithoutExt,
    mainCategory: 'Interior Design',
    subCategory: 'Style', // 固定值
    roomType: 'Living Room',
    roomTypeId: 'living-room',
  };
};

// 主分类配置
const MAIN_CATEGORIES = [
  { id: 'interior', label: '室内设计 (Interior Design)', value: 'Interior Design' },
  { id: 'exterior', label: '建筑设计 (Exterior Design)', value: 'Exterior Design' },
  { id: 'wall-design', label: '墙面设计 (Wall Design)', value: 'Wall Design' },
  { id: 'floor', label: '地板风格 (Floor Style)', value: 'Floor Style' },
  { id: 'garden', label: '花园设计 (Garden & Backyard Design)', value: 'Garden & Backyard Design' },
  { id: 'festive', label: '节日装饰 (Festive Decor)', value: 'Festive Decor' },
];

// 室内设计房间类型选择器（二级分类） - 严格按照数据库实际存在的分类
const INTERIOR_ROOM_TYPES = [
  { id: 'auto', label: '🤖 自动识别', value: null, displayName: null },
  { id: 'attic', label: '阁楼 (Attic)', value: 'attic', displayName: 'Attic' },
  { id: 'basement', label: '地下室 (Basement)', value: 'basement', displayName: 'Basement' },
  { id: 'bathroom', label: '浴室 (Bathroom)', value: 'bathroom', displayName: 'Bathroom' },
  { id: 'bedroom', label: '卧室 (Bedroom)', value: 'bedroom', displayName: 'Bedroom' },
  { id: 'dining-room', label: '餐厅 (Dining Room)', value: 'dining-room', displayName: 'Dining Room' },
  { id: 'home-office', label: '家庭办公室 (Home Office)', value: 'home-office', displayName: 'Home Office' },
  { id: 'kids-room', label: '儿童房 (Kids Room)', value: 'kids-room', displayName: 'Kids Room' },
  { id: 'kitchen', label: '厨房 (Kitchen)', value: 'kitchen', displayName: 'Kitchen' },
];

// 节日装饰子分类 - 严格按照数据库实际存在的分类
const FESTIVE_SUB_CATEGORIES = [
  { id: 'halloween-indoor', label: '万圣节室内 (Halloween Indoor)', value: 'Halloween Indoor' },
  { id: 'halloween-outdoor', label: '万圣节室外 (Halloween Outdoor)', value: 'Halloween Outdoor' },
  { id: 'christmas-indoor', label: '圣诞节室内 (Christmas Indoor)', value: 'Christmas Indoor' },
  { id: 'christmas-outdoor', label: '圣诞节室外 (Christmas Outdoor)', value: 'Christmas Outdoor' },
];

// 墙面设计子分类 - 严格按照数据库实际存在的分类
const WALL_DESIGN_SUB_CATEGORIES = [
  { id: 'whites-neutrals', label: '白色与中性色 (Whites & Neutrals)', value: 'Whites & Neutrals' },
  { id: 'grays', label: '灰色 (Grays)', value: 'Grays' },
  { id: 'beiges-tans', label: '米色与棕褐色 (Beiges & Tans)', value: 'Beiges & Tans' },
  { id: 'greens', label: '绿色 (Greens)', value: 'Greens' },
  { id: 'blues', label: '蓝色 (Blues)', value: 'Blues' },
  { id: 'accent-colors', label: '装饰色 (Accent Colors)', value: 'Accent Colors' },
  { id: 'paint-plaster', label: '涂料与灰泥 (Paint & Plaster)', value: 'Paint & Plaster' },
  { id: 'wood-panels', label: '木材与面板 (Wood & Panels)', value: 'Wood & Panels' },
  { id: 'stone-tile', label: '石材与瓷砖 (Stone & Tile)', value: 'Stone & Tile' },
  { id: 'specialty-finishes', label: '特殊饰面 (Specialty Finishes)', value: 'Specialty Finishes' },
];

// 地板风格子分类 - 严格按照数据库实际存在的分类
const FLOOR_STYLE_SUB_CATEGORIES = [
  { id: 'wood-flooring', label: '木地板 (Wood Flooring)', value: 'Wood Flooring' },
  { id: 'tile-stone', label: '瓷砖与石材 (Tile & Stone)', value: 'Tile & Stone' },
  { id: 'specialty-materials', label: '特殊材料 (Specialty Materials)', value: 'Specialty Materials' },
];

// 花园与后院设计子分类 - 严格按照数据库实际存在的分类
const GARDEN_SUB_CATEGORIES = [
  { id: 'landscape-styles', label: '景观风格 (Landscape Styles)', value: 'Landscape Styles' },
];

export const BatchTemplateUpload: React.FC<BatchTemplateUploadProps> = ({ isOpen, onClose, onSuccess }) => {
  const [templates, setTemplates] = useState<ParsedTemplate[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(MAIN_CATEGORIES[0]);
  const [selectedInteriorRoom, setSelectedInteriorRoom] = useState(INTERIOR_ROOM_TYPES[0]); // 默认"自动识别"
  const [selectedFestiveSub, setSelectedFestiveSub] = useState(FESTIVE_SUB_CATEGORIES[0]);
  const [selectedWallDesignSub, setSelectedWallDesignSub] = useState(WALL_DESIGN_SUB_CATEGORIES[0]);
  const [selectedFloorSub, setSelectedFloorSub] = useState(FLOOR_STYLE_SUB_CATEGORIES[0]);
  const [selectedGardenSub, setSelectedGardenSub] = useState(GARDEN_SUB_CATEGORIES[0]);

  // 处理文件选择
  // 压缩图片到 360x360
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 360;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // 计算裁剪区域（中心裁剪）
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2;
        const sourceY = (img.height - sourceSize) / 2;
        
        // 绘制裁剪并缩放的图片
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize, // 源区域
          0, 0, 360, 360 // 目标区域
        );
        
        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            console.log(`🗜️ Compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          0.85
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const newTemplates: ParsedTemplate[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      // 从文件名获取模板名称（去掉扩展名）
      const nameWithoutExt = file.name.replace(/\.(png|jpg|jpeg)$/i, '');
      
      // 根据用户选择的分类和文件名智能解析
      let parsed: Omit<ParsedTemplate, 'file' | 'preview' | 'status' | 'prompt'>;
      
      if (selectedCategory.value === 'Interior Design') {
        // 室内设计：优先使用手动选择，否则自动识别
        let roomType: string;
        let roomTypeId: string;
        
        if (selectedInteriorRoom.value) {
          // 用户手动选择了房间类型
          roomType = selectedInteriorRoom.displayName!;
          roomTypeId = selectedInteriorRoom.value;
        } else {
          // 自动识别房间类型
          const roomMatch = ROOM_TYPE_PATTERNS.find(room => room.pattern.test(nameWithoutExt));
          if (roomMatch) {
            roomType = roomMatch.displayName;
            roomTypeId = roomMatch.roomTypeId;
          } else {
            // 默认为 Living Room
            roomType = 'Living Room';
            roomTypeId = 'living-room';
          }
        }
        
        parsed = {
          name: nameWithoutExt,
          mainCategory: 'Interior Design',
          subCategory: 'Design Aesthetics',
          roomType,
          roomTypeId,
        };
      } else if (selectedCategory.value === 'Exterior Design') {
        // 建筑设计：自动识别建筑类型
        const buildingMatch = BUILDING_TYPE_PATTERNS.find(building => building.pattern.test(nameWithoutExt));
        if (buildingMatch) {
          parsed = {
            name: nameWithoutExt,
            mainCategory: 'Exterior Design',
            subCategory: 'House Exterior',
            roomType: buildingMatch.displayName,
            roomTypeId: buildingMatch.buildingTypeId,
          };
        } else {
          // 默认为 Modern House
          parsed = {
            name: nameWithoutExt,
            mainCategory: 'Exterior Design',
            subCategory: 'House Exterior',
            roomType: 'Modern House',
            roomTypeId: 'modern-house',
          };
        }
      } else if (selectedCategory.value === 'Wall Design') {
        // 墙面设计：使用选择的子分类
        parsed = {
          name: nameWithoutExt,
          mainCategory: 'Wall Design',
          subCategory: selectedWallDesignSub.value,
        };
      } else if (selectedCategory.value === 'Floor Style') {
        // 地板风格：使用选择的子分类
        parsed = {
          name: nameWithoutExt,
          mainCategory: 'Floor Style',
          subCategory: selectedFloorSub.value,
        };
      } else if (selectedCategory.value === 'Garden & Backyard Design') {
        // 花园设计：使用选择的子分类
        parsed = {
          name: nameWithoutExt,
          mainCategory: 'Garden & Backyard Design',
          subCategory: selectedGardenSub.value,
        };
      } else if (selectedCategory.value === 'Festive Decor') {
        // 节日装饰：使用选择的子分类
        parsed = {
          name: nameWithoutExt,
          mainCategory: 'Festive Decor',
          subCategory: selectedFestiveSub.value,
        };
      } else {
        // 默认
        parsed = {
          name: nameWithoutExt,
          mainCategory: selectedCategory.value,
          subCategory: selectedCategory.value,
        };
      }
      
      // 提取提示词
      console.log(`📝 Processing: ${file.name}`);
      const prompt = await extractPromptFromImage(file);
      
      const preview = URL.createObjectURL(file);
      
      newTemplates.push({
        ...parsed,
        prompt: prompt,
        file,
        preview,
        status: prompt ? 'pending' : 'error',
        error: prompt ? undefined : '未找到提示词元数据',
      });
    }
    
    setTemplates(prev => [...prev, ...newTemplates]);
  }, [selectedCategory, selectedInteriorRoom, selectedFestiveSub, selectedWallDesignSub, selectedFloorSub, selectedGardenSub]);

  // 拖放处理
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 文件选择
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // 移除模板
  const removeTemplate = useCallback((index: number) => {
    setTemplates(prev => {
      const newTemplates = [...prev];
      URL.revokeObjectURL(newTemplates[index].preview);
      newTemplates.splice(index, 1);
      return newTemplates;
    });
  }, []);

  // 批量上传
  const handleUpload = async () => {
    const validTemplates = templates.filter(t => t.prompt && t.status === 'pending');
    
    if (validTemplates.length === 0) {
      alert('没有可上传的模板！请确保图片包含提示词元数据。');
      return;
    }
    
    setIsUploading(true);

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      
      // 跳过没有提示词的
      if (!template.prompt) {
        continue;
      }
      
      setTemplates(prev => {
        const newTemplates = [...prev];
        newTemplates[i] = { ...newTemplates[i], status: 'uploading' };
        return newTemplates;
      });

      try {
        const timestamp = Date.now();
        const sanitizedName = template.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // 压缩图片到 360x360
        console.log(`🗜️ Compressing: ${template.file.name}`);
        const compressedFile = await compressImage(template.file);
        
        // 构建存储路径
        let storagePath: string;
        if (template.roomTypeId) {
          // Interior Design 或 Exterior Design（有 roomTypeId/buildingTypeId）
          const categoryPrefix = template.mainCategory.toLowerCase().replace(/\s+/g, '-');
          storagePath = `${categoryPrefix}/${template.roomTypeId}/${sanitizedName}-${timestamp}.jpg`;
        } else {
          // 其他分类（没有 roomTypeId）
          storagePath = `${template.mainCategory.toLowerCase().replace(/\s+/g, '-')}/${sanitizedName}-${timestamp}.jpg`;
        }

        console.log(`📤 Uploading to: ${storagePath}`);

        const { error: uploadError } = await supabase.storage
          .from('template-thumbnails')
          .upload(storagePath, compressedFile, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('template-thumbnails')
          .getPublicUrl(storagePath);

        console.log(`✅ Uploaded: ${urlData.publicUrl}`);

        // 创建模板（使用文件名和从元数据提取的提示词）
        await batchImportTemplates([{
          name: template.name,
          image_url: urlData.publicUrl,
          prompt: template.prompt!,
          main_category: template.mainCategory,
          sub_category: template.subCategory,
          room_type: template.roomTypeId || null,
          enabled: true,
          sort_order: 0,
        }]);

        console.log(`✅ Template created: ${template.name}`);

        setTemplates(prev => {
          const newTemplates = [...prev];
          newTemplates[i] = { ...newTemplates[i], status: 'success' };
          return newTemplates;
        });

      } catch (error: any) {
        console.error(`❌ Upload failed for ${template.name}:`, error);
        
        setTemplates(prev => {
          const newTemplates = [...prev];
          newTemplates[i] = {
            ...newTemplates[i],
            status: 'error',
            error: error.message || 'Upload failed'
          };
          return newTemplates;
        });
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsUploading(false);
    
    const successCount = templates.filter(t => t.status === 'success').length;
    if (successCount > 0) {
      alert(`✅ 成功上传 ${successCount} 个模板！`);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1000);
    }
  };

  const handleClose = () => {
    templates.forEach(t => URL.revokeObjectURL(t.preview));
    setTemplates([]);
    onClose();
  };

  if (!isOpen) return null;

  const pendingCount = templates.filter(t => t.status === 'pending').length;
  const successCount = templates.filter(t => t.status === 'success').length;
  const errorCount = templates.filter(t => t.status === 'error').length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">批量上传模板</h2>
              <p className="text-sm text-slate-500 mt-1">
                拖放图片或点击选择，系统会从元数据提取提示词
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>

          {/* Category Selection */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择分类
                </label>
                <select
                  value={selectedCategory.id}
                  onChange={(e) => {
                    const category = MAIN_CATEGORIES.find(c => c.id === e.target.value);
                    if (category) {
                      setSelectedCategory(category);
                      setTemplates([]); // 清空已选文件
                    }
                  }}
                  disabled={isUploading}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {MAIN_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Interior Design Room Type Selector (二级分类) */}
              {selectedCategory.value === 'Interior Design' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择房间类型（二级分类）
                  </label>
                  <select
                    value={selectedInteriorRoom.id}
                    onChange={(e) => {
                      const room = INTERIOR_ROOM_TYPES.find(r => r.id === e.target.value);
                      if (room) {
                        setSelectedInteriorRoom(room);
                        setTemplates([]); // 清空已选文件
                      }
                    }}
                    disabled={isUploading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {INTERIOR_ROOM_TYPES.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Wall Design Sub-category */}
              {selectedCategory.value === 'Wall Design' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择墙面风格
                  </label>
                  <select
                    value={selectedWallDesignSub.id}
                    onChange={(e) => {
                      const sub = WALL_DESIGN_SUB_CATEGORIES.find(s => s.id === e.target.value);
                      if (sub) {
                        setSelectedWallDesignSub(sub);
                        setTemplates([]); // 清空已选文件
                      }
                    }}
                    disabled={isUploading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {WALL_DESIGN_SUB_CATEGORIES.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Floor Style Sub-category */}
              {selectedCategory.value === 'Floor Style' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择地板类型
                  </label>
                  <select
                    value={selectedFloorSub.id}
                    onChange={(e) => {
                      const sub = FLOOR_STYLE_SUB_CATEGORIES.find(s => s.id === e.target.value);
                      if (sub) {
                        setSelectedFloorSub(sub);
                        setTemplates([]); // 清空已选文件
                      }
                    }}
                    disabled={isUploading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {FLOOR_STYLE_SUB_CATEGORIES.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Garden Sub-category */}
              {selectedCategory.value === 'Garden & Backyard Design' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择花园类型
                  </label>
                  <select
                    value={selectedGardenSub.id}
                    onChange={(e) => {
                      const sub = GARDEN_SUB_CATEGORIES.find(s => s.id === e.target.value);
                      if (sub) {
                        setSelectedGardenSub(sub);
                        setTemplates([]); // 清空已选文件
                      }
                    }}
                    disabled={isUploading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {GARDEN_SUB_CATEGORIES.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Festive Decor Sub-category */}
              {selectedCategory.value === 'Festive Decor' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择节日
                  </label>
                  <select
                    value={selectedFestiveSub.id}
                    onChange={(e) => {
                      const sub = FESTIVE_SUB_CATEGORIES.find(s => s.id === e.target.value);
                      if (sub) {
                        setSelectedFestiveSub(sub);
                        setTemplates([]); // 清空已选文件
                      }
                    }}
                    disabled={isUploading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {FESTIVE_SUB_CATEGORIES.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Category Tips */}
              <div className="text-xs text-slate-600 bg-white rounded-lg p-3 border border-slate-200">
                {selectedCategory.id === 'interior' && (
                  <div className="space-y-1">
                    {selectedInteriorRoom.value ? (
                      <p>✅ <strong>已选择房间类型：</strong>{selectedInteriorRoom.label}</p>
                    ) : (
                      <p>🤖 <strong>自动识别模式：</strong>系统会从文件名识别房间类型</p>
                    )}
                    <p className="text-slate-500">💡 文件名示例: "Modern Living Room.png"</p>
                  </div>
                )}
                {selectedCategory.id === 'exterior' && (
                  <p>💡 文件名中包含建筑类型会自动识别，如 "Modern House.png"</p>
                )}
                {selectedCategory.id === 'wall-design' && (
                  <p>💡 所有模板将归类到 {selectedWallDesignSub.label}</p>
                )}
                {selectedCategory.id === 'floor' && (
                  <p>💡 所有模板将归类到 {selectedFloorSub.label}</p>
                )}
                {selectedCategory.id === 'garden' && (
                  <p>💡 所有模板将归类到 {selectedGardenSub.label}</p>
                )}
                {selectedCategory.id === 'festive' && (
                  <p>💡 所有模板将归类到 {selectedFestiveSub.label}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Drop Zone */}
            {templates.length === 0 && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                <IconUpload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  拖放图片到这里
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  或者点击下方按钮选择文件
                </p>
                <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                  选择图片
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-400 mt-4">
                  文件名示例: "Modern Minimalist Living Room.png"
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ⚠️ 图片必须包含提示词元数据
                </p>
              </div>
            )}

            {/* Template List */}
            {templates.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">
                    已选择 {templates.length} 个文件 
                    {pendingCount > 0 && ` (可上传: ${pendingCount})`}
                  </h3>
                  {!isUploading && (
                    <label className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors text-sm">
                      添加更多
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {templates.map((template, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 p-4 rounded-lg border-2 transition-colors ${
                        template.status === 'success'
                          ? 'border-green-200 bg-green-50'
                          : template.status === 'error'
                          ? 'border-red-200 bg-red-50'
                          : template.status === 'uploading'
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Preview */}
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{template.name}</h4>
                        <div className="mt-1 space-y-1 text-sm">
                          <p className="text-slate-600 truncate">
                            📁 {template.mainCategory} {'>'} {template.subCategory}
                          </p>
                          {template.roomType && (
                            <p className="text-slate-600">🏠 {template.roomType}</p>
                          )}
                          {template.prompt ? (
                            <p className="text-green-600 text-xs">✅ 已提取提示词 ({template.prompt.length} 字符)</p>
                          ) : (
                            <p className="text-red-600 text-xs">❌ {template.error}</p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center flex-shrink-0">
                        {template.status === 'pending' && !isUploading && (
                          <button
                            onClick={() => removeTemplate(index)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="移除"
                          >
                            <IconX className="w-5 h-5 text-red-600" />
                          </button>
                        )}
                        {template.status === 'uploading' && (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                        )}
                        {template.status === 'success' && (
                          <IconCheck className="w-6 h-6 text-green-600" />
                        )}
                        {template.status === 'error' && (
                          <IconAlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {templates.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {isUploading ? (
                    <span>上传中: {successCount + errorCount} / {templates.length}</span>
                  ) : (
                    <span>
                      {pendingCount > 0 && `✅ 可上传: ${pendingCount} `}
                      {successCount > 0 && `| 成功: ${successCount} `}
                      {errorCount > 0 && `| ❌ 失败: ${errorCount}`}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isUploading}
                    className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? '上传中...' : '取消'}
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || pendingCount === 0}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? `上传中 (${successCount}/${templates.length})` : `上传 ${pendingCount} 个模板`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

