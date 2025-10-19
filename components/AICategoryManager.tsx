import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { IconPlus, IconPencil, IconTrash, IconCheck, IconX, IconMoveUp, IconMoveDown } from './Icons';
import { supabase } from '../config/supabase';

interface AICategory {
  id: string;
  category_name: string;
  category_slug: string;
  description: string | null;
  ai_recognition_hint: string | null;
  example_keywords: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const AICategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<AICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<AICategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_template_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      alert('加载分类失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (category: AICategory) => {
    try {
      const { error } = await supabase
        .from('ai_template_categories')
        .update({ enabled: !category.enabled })
        .eq('id', category.id);

      if (error) throw error;
      await loadCategories();
    } catch (error) {
      console.error('Failed to toggle category:', error);
      alert('切换状态失败');
    }
  };

  const handleDelete = async (category: AICategory) => {
    if (!confirm(`确定要删除分类 "${category.category_name}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_template_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('删除失败');
    }
  };

  const handleMove = async (category: AICategory, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapCategory = categories[swapIndex];

    try {
      // Swap sort_order
      const { error: error1 } = await supabase
        .from('ai_template_categories')
        .update({ sort_order: swapCategory.sort_order })
        .eq('id', category.id);

      const { error: error2 } = await supabase
        .from('ai_template_categories')
        .update({ sort_order: category.sort_order })
        .eq('id', swapCategory.id);

      if (error1 || error2) throw error1 || error2;
      await loadCategories();
    } catch (error) {
      console.error('Failed to move category:', error);
      alert('移动失败');
    }
  };

  const openCreateModal = () => {
    setEditingCategory({
      id: '',
      category_name: '',
      category_slug: '',
      description: '',
      ai_recognition_hint: '',
      example_keywords: '',
      enabled: true,
      sort_order: categories.length,
      created_at: '',
      updated_at: '',
    });
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const openEditModal = (category: AICategory) => {
    setEditingCategory({ ...category });
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingCategory(null);
    setIsModalOpen(false);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!editingCategory) return;

    if (!editingCategory.category_name || !editingCategory.category_slug) {
      alert('请填写分类名称和标识符');
      return;
    }

    try {
      if (isCreating) {
        const { error } = await supabase
          .from('ai_template_categories')
          .insert([{
            category_name: editingCategory.category_name,
            category_slug: editingCategory.category_slug,
            description: editingCategory.description,
            ai_recognition_hint: editingCategory.ai_recognition_hint,
            example_keywords: editingCategory.example_keywords,
            enabled: editingCategory.enabled,
            sort_order: editingCategory.sort_order,
          }]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_template_categories')
          .update({
            category_name: editingCategory.category_name,
            category_slug: editingCategory.category_slug,
            description: editingCategory.description,
            ai_recognition_hint: editingCategory.ai_recognition_hint,
            example_keywords: editingCategory.example_keywords,
            enabled: editingCategory.enabled,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      }

      await loadCategories();
      closeModal();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      if (error.code === '23505') {
        alert('分类名称或标识符已存在，请使用不同的名称');
      } else {
        alert('保存失败：' + error.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI 分类管理</h2>
          <p className="text-sm text-slate-600 mt-1">
            管理 AI Template Creator 的识别分类，用户可以在前端选择这些分类来限定 AI 的识别范围
          </p>
        </div>
        <Button onClick={openCreateModal} primary>
          <IconPlus className="w-4 h-4 mr-2" />
          添加分类
        </Button>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>暂无分类</p>
            <p className="text-sm mt-2">点击"添加分类"创建第一个分类</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">排序</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">分类名称</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">标识符</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">AI识别提示</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">状态</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.map((category, index) => (
                <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMove(category, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="上移"
                      >
                        <IconMoveUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(category, 'down')}
                        disabled={index === categories.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="下移"
                      >
                        <IconMoveDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-slate-900">{category.category_name}</div>
                      {category.description && (
                        <div className="text-xs text-slate-500 mt-0.5">{category.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-600">{category.category_slug}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600 max-w-md truncate" title={category.ai_recognition_hint || ''}>
                      {category.ai_recognition_hint || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleEnabled(category)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        category.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category.enabled ? <IconCheck className="w-3 h-3" /> : <IconX className="w-3 h-3" />}
                      {category.enabled ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="编辑"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="删除"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-bold text-slate-900">
                {isCreating ? '添加新分类' : '编辑分类'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  分类名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCategory.category_name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, category_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例如：Floor Style"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  标识符 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCategory.category_slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, category_slug: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder="例如：floor-style（小写、连字符）"
                />
                <p className="text-xs text-slate-500 mt-1">用于URL和代码识别，建议使用小写字母和连字符</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例如：地板材质和风格"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">AI识别提示</label>
                <textarea
                  value={editingCategory.ai_recognition_hint || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, ai_recognition_hint: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="例如：Flooring materials, floor patterns, hardwood, tile, laminate, marble, wood grain"
                />
                <p className="text-xs text-slate-500 mt-1">用于指导AI识别该分类的关键特征，英文逗号分隔</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">示例关键词</label>
                <input
                  type="text"
                  value={editingCategory.example_keywords || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, example_keywords: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例如：木地板、瓷砖、大理石、地板纹理"
                />
                <p className="text-xs text-slate-500 mt-1">显示给用户，帮助理解该分类适用场景</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={editingCategory.enabled}
                  onChange={(e) => setEditingCategory({ ...editingCategory, enabled: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-slate-700">
                  启用此分类
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <Button onClick={closeModal}>
                取消
              </Button>
              <Button onClick={handleSave} primary>
                {isCreating ? '创建' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

