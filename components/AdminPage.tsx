
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUserCircle, IconSparkles, IconPhoto, IconLayoutDashboard, IconUsers, IconSettings, IconPencil, IconTrash, IconPlus, IconChevronDown, IconArrowDown, IconArrowUp, IconX, IconMoveUp, IconMoveDown, IconMoveToTop, IconMoveToBottom, IconUpload } from './Icons';
import { PERMISSION_MAP } from '../constants';
import { PromptTemplate, User, GenerationBatch, RecentActivity, ManagedTemplateData, ManagedPromptTemplateCategory } from '../types';
import { Button } from './Button';
import { toBase64 } from '../utils/imageUtils';
import { BatchTemplateUpload } from './BatchTemplateUpload';
import { HomeSectionManager } from './HomeSectionManager';
import { HeroSectionManager } from './HeroSectionManager';
import { createTemplate, updateTemplate, deleteTemplate as deleteTemplateFromDB, getAllTemplates, toggleCategoryEnabled, toggleMainCategoryEnabled, deleteMainCategory as deleteMainCategoryFromDB, deleteSubCategory as deleteSubCategoryFromDB, reorderMainCategories, reorderSubCategories, reorderTemplates } from '../services/templateService';

// --- Component Props ---

export interface AdminPageProps {
    users: User[];
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    onDeleteUser: (userId: string) => void;
    generationHistory: GenerationBatch[];
    totalDesignsGenerated: number;
    onDeleteBatch: (batchId: string) => void;
    templateData: ManagedTemplateData;
    setTemplateData: React.Dispatch<React.SetStateAction<ManagedTemplateData>>;
    categoryOrder: string[];
    setCategoryOrder: React.Dispatch<React.SetStateAction<string[]>>;
    onTemplatesUpdated?: () => void;
}

// --- Sub-Components ---

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<{
    users: User[];
    generationHistory: GenerationBatch[];
    totalDesignsGenerated: number;
}> = ({ users, generationHistory, totalDesignsGenerated }) => {
    
    const activeSubscriptions = useMemo(() => {
        return users.filter(u => u.permissionLevel > 1).length;
    }, [users]);

    const monthlyRevenue = useMemo(() => {
        const PLAN_PRICES = { 2: 39, 3: 99, 4: 299 }; // Pro, Premium, Business
        return users.reduce((total, user) => {
            if (user.permissionLevel > 1) {
                return total + (PLAN_PRICES[user.permissionLevel as keyof typeof PLAN_PRICES] || 0);
            }
            return total;
        }, 0);
    }, [users]);

    const recentActivities: RecentActivity[] = useMemo(() => {
        const userActivities: RecentActivity[] = users
            .sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime())
            .slice(0, 3)
            .map(user => ({
                id: `user-${user.id}`,
                type: 'new_user',
                timestamp: new Date(user.joined),
                details: `${user.email} joined.`
            }));

        const designActivities: RecentActivity[] = generationHistory
            .slice(0, 3)
            .map(batch => ({
                id: `design-${batch.id}`,
                type: 'new_design',
                timestamp: new Date(batch.timestamp),
                details: `New '${batch.type}' generation created.`
            }));

        return [...userActivities, ...designActivities]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5);
    }, [users, generationHistory]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={users.length.toString()} icon={<IconUsers className="w-6 h-6" />} />
                <StatCard title="Designs Generated" value={totalDesignsGenerated.toString()} icon={<IconSparkles className="w-6 h-6" />} />
                <StatCard title="Active Subscriptions" value={activeSubscriptions.toString()} icon={<IconUserCircle className="w-6 h-6" />} />
                <StatCard title="Revenue (MTD)" value={`$${monthlyRevenue.toLocaleString()}`} icon={<span className="text-2xl font-bold">$</span>} />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                <div className="mt-4 space-y-4">
                    {recentActivities.length > 0 ? (
                        recentActivities.map(activity => (
                            <div key={activity.id} className="flex items-start gap-4 p-3 -mx-3 rounded-lg hover:bg-slate-50">
                                <div className={`p-2 rounded-full ${activity.type === 'new_user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {activity.type === 'new_user' ? <IconUserCircle className="w-5 h-5" /> : <IconPhoto className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{activity.details}</p>
                                    <p className="text-xs text-slate-500">{activity.timestamp.toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm">No recent activity to show.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserManagement: React.FC<{
    users: User[];
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    onDeleteUser: (userId: string) => void;
}> = ({ users, onUpdateUser, onDeleteUser }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = (updatedUser: User) => {
        onUpdateUser(updatedUser.id, updatedUser);
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800">User Management</h3>
                <div className="mt-4 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Plan</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Joined</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{user.email}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{PERMISSION_MAP[user.permissionLevel]}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{new Date(user.joined).toLocaleDateString()}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900">
                                                    Edit<span className="sr-only">, {user.email}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <UserModal
                isOpen={isUserModalOpen}
                user={editingUser}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                onDelete={onDeleteUser}
            />
        </>
    );
};

const DesignManagement: React.FC<{
    generationHistory: GenerationBatch[];
    onDeleteBatch: (batchId: string) => void;
}> = ({ generationHistory, onDeleteBatch }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Design History</h3>
            <div className="mt-4 space-y-3">
                {generationHistory.slice(0, 10).map(batch => (
                    <div key={batch.id} className="p-3 border border-slate-200 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="font-medium text-slate-800">{batch.type} - <span className="text-slate-500">{batch.prompt}</span></p>
                            <p className="text-xs text-slate-500">
                                {new Date(batch.timestamp).toLocaleString()} - {batch.results.length} result(s)
                            </p>
                        </div>
                        <Button onClick={() => onDeleteBatch(batch.id)} className="!px-3 !py-1.5 text-sm !bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-200">
                            <IconTrash className="w-4 h-4" /> Delete
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Sort Controls Component ---
const SortControls: React.FC<{
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveToTop: () => void;
    onMoveToBottom: () => void;
    isFirst: boolean;
    isLast: boolean;
}> = ({ onMoveUp, onMoveDown, onMoveToTop, onMoveToBottom, isFirst, isLast }) => {
    return (
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
                onClick={onMoveToTop}
                disabled={isFirst}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="移到最前"
            >
                <IconMoveToTop className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="上移"
            >
                <IconMoveUp className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
                onClick={onMoveDown}
                disabled={isLast}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="下移"
            >
                <IconMoveDown className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
                onClick={onMoveToBottom}
                disabled={isLast}
                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="移到最后"
            >
                <IconMoveToBottom className="w-3.5 h-3.5 text-slate-600" />
            </button>
        </div>
    );
};

const TemplateManagement: React.FC<{
    templateData: ManagedTemplateData;
    setTemplateData: React.Dispatch<React.SetStateAction<ManagedTemplateData>>;
    categoryOrder: string[];
    setCategoryOrder: React.Dispatch<React.SetStateAction<string[]>>;
    onTemplatesUpdated?: () => void;
}> = ({ templateData, setTemplateData, categoryOrder, setCategoryOrder, onTemplatesUpdated }) => {
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [targetCategory, setTargetCategory] = useState<{ main: string, sub: string } | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [categoryModalType, setCategoryModalType] = useState<'main' | 'sub' | 'room'>('main');
    const [categoryModalContext, setCategoryModalContext] = useState<{ mainCategory?: string } | null>(null);
    const [collapsedMainCategories, setCollapsedMainCategories] = useState<Set<string>>(new Set());
    const [collapsedSubCategories, setCollapsedSubCategories] = useState<Set<string>>(new Set());
    const [isSorting, setIsSorting] = useState(false);
    const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);

    const handleEditTemplate = (template: PromptTemplate, mainCategory: string, subCategory: string) => {
        setEditingTemplate(template);
        setTargetCategory({ main: mainCategory, sub: subCategory });
        setIsTemplateModalOpen(true);
    };

    const handleAddTemplate = (mainCategory: string, subCategory: string) => {
        const newTemplate: PromptTemplate = {
            id: `template_${Date.now()}`,
            name: 'New Template',
            imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/placeholder.png',
            prompt: 'A new design prompt.',
        };
        setEditingTemplate(newTemplate);
        setTargetCategory({ main: mainCategory, sub: subCategory });
        setIsTemplateModalOpen(true);
    };

    const handleSaveTemplate = async (updatedTemplate: PromptTemplate) => {
        if (!targetCategory) return;
        
        try {
            const templateId = typeof updatedTemplate.id === 'string'
                ? updatedTemplate.id
                : String(updatedTemplate.id);
            const isNewTemplate = templateId.startsWith('template_');
            
            if (isNewTemplate) {
                // Create new template in database
                await createTemplate({
                    name: updatedTemplate.name,
                    image_url: updatedTemplate.imageUrl,
                    prompt: updatedTemplate.prompt,
                    main_category: targetCategory.main,
                    sub_category: targetCategory.sub,
                    enabled: true,
                    sort_order: 0
                });
            } else {
                // Update existing template in database
                await updateTemplate(templateId, {
                    name: updatedTemplate.name,
                    image_url: updatedTemplate.imageUrl,
                    prompt: updatedTemplate.prompt,
                    main_category: targetCategory.main,
                    sub_category: targetCategory.sub
                });
            }
            
            // 重新从数据库加载所有模板（Admin Panel用）
            const freshTemplates = await getAllTemplates();
            setTemplateData(freshTemplates);
            setCategoryOrder(Object.keys(freshTemplates));
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            setIsTemplateModalOpen(false);
            
            alert('Template saved successfully!');
            
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Failed to save template. Please try again.');
        }
    };

    const handleDeleteTemplate = async (templateId: string, mainCategory: string, subCategoryName: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        
        try {
            // Delete from database
            await deleteTemplateFromDB(templateId);
            
            // 重新从数据库加载（Admin Panel用）
            const freshTemplates = await getAllTemplates();
            setTemplateData(freshTemplates);
            setCategoryOrder(Object.keys(freshTemplates));
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            alert('Template deleted successfully!');
        } catch (error) {
            console.error('Failed to delete template:', error);
            alert('Failed to delete template. Please try again.');
        }
    };

    const toggleMainCategory = async (mainCategory: string) => {
        // 获取当前所有子分类的状态，如果至少有一个是启用的，则全部禁用；否则全部启用
        const currentData = templateData[mainCategory];
        if (!currentData || currentData.length === 0) return;
        
        const hasAnyEnabled = currentData.some((sc: ManagedPromptTemplateCategory) => sc.enabled);
        const newEnabledState = !hasAnyEnabled;
        
        try {
            // 同步到数据库
            await toggleMainCategoryEnabled(mainCategory, newEnabledState);
            
            // 更新本地状态 - 更新所有子分类
            setTemplateData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData));
                if (newData[mainCategory]) {
                    newData[mainCategory].forEach((sc: ManagedPromptTemplateCategory) => {
                        sc.enabled = newEnabledState;
                    });
                }
                return newData;
            });
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            console.log(`✅ Main category ${mainCategory} toggled to ${newEnabledState}`);
        } catch (error) {
            console.error('Failed to toggle main category:', error);
            alert('Failed to update main category status. Please try again.');
        }
    };

    const handleAddMainCategory = () => {
        setCategoryModalType('main');
        setCategoryModalContext(null);
        setIsCategoryModalOpen(true);
    };

    const handleDeleteMainCategory = async (mainCategory: string) => {
        if (!confirm(`Are you sure you want to delete the entire "${mainCategory}" category? This will delete ALL templates under it.`)) return;
        
        try {
            await deleteMainCategoryFromDB(mainCategory);
            
            // 重新从数据库加载（Admin Panel用）
            const freshTemplates = await getAllTemplates();
            setTemplateData(freshTemplates);
            setCategoryOrder(Object.keys(freshTemplates));
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            alert(`Successfully deleted "${mainCategory}" category!`);
        } catch (error) {
            console.error('Failed to delete main category:', error);
            alert('Failed to delete category. Please try again.');
        }
    };

    const handleAddSubCategory = (mainCategory: string) => {
        const type = mainCategory === 'Interior Design' ? 'room' : 'sub';
        setCategoryModalType(type);
        setCategoryModalContext({ mainCategory });
        setIsCategoryModalOpen(true);
    };

    const handleDeleteSubCategory = async (mainCategory: string, subCategoryName: string) => {
        if (!confirm(`Are you sure you want to delete "${subCategoryName}"? This will delete ALL templates under it.`)) return;
        
        try {
            await deleteSubCategoryFromDB(mainCategory, subCategoryName);
            
            // 重新从数据库加载（Admin Panel用）
            const freshTemplates = await getAllTemplates();
            setTemplateData(freshTemplates);
            setCategoryOrder(Object.keys(freshTemplates));
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            alert(`Successfully deleted "${subCategoryName}"!`);
        } catch (error) {
            console.error('Failed to delete sub category:', error);
            alert('Failed to delete category. Please try again.');
        }
    };

    const toggleSubCategory = async (mainCategory: string, subCategoryName: string) => {
        // 先获取当前状态
        const currentData = templateData[mainCategory];
        const subCategory = currentData?.find((c: ManagedPromptTemplateCategory) => c.name === subCategoryName);
        if (!subCategory) return;
        
        const newEnabledState = !subCategory.enabled;
        
        try {
            // 同步到数据库
            await toggleCategoryEnabled(mainCategory, subCategoryName, newEnabledState);
            
            // 更新本地状态
            setTemplateData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData));
                const subCat = newData[mainCategory].find((c: ManagedPromptTemplateCategory) => c.name === subCategoryName);
                if (subCat) {
                    subCat.enabled = newEnabledState;
                }
                return newData;
            });
            
            // 通知父组件刷新前端模板数据
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
            
            console.log(`✅ Category ${mainCategory} > ${subCategoryName} toggled to ${newEnabledState}`);
        } catch (error) {
            console.error('Failed to toggle category:', error);
            alert('Failed to update category status. Please try again.');
        }
    };

    const toggleMainCategoryCollapse = (mainCategory: string) => {
        setCollapsedMainCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(mainCategory)) {
                newSet.delete(mainCategory);
            } else {
                newSet.add(mainCategory);
            }
            return newSet;
        });
    };

    const toggleSubCategoryCollapse = (mainCategory: string, subCategoryName: string) => {
        const key = `${mainCategory}::${subCategoryName}`;
        setCollapsedSubCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    // 排序处理函数
    const handleSortMainCategory = async (category: string, action: 'up' | 'down' | 'top' | 'bottom') => {
        if (isSorting) return;
        setIsSorting(true);
        
        try {
            const currentIndex = categoryOrder.indexOf(category);
            const newOrder = [...categoryOrder];
            
            switch(action) {
                case 'up':
                    if (currentIndex > 0) {
                        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
                    }
                    break;
                case 'down':
                    if (currentIndex < newOrder.length - 1) {
                        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                    }
                    break;
                case 'top':
                    newOrder.splice(currentIndex, 1);
                    newOrder.unshift(category);
                    break;
                case 'bottom':
                    newOrder.splice(currentIndex, 1);
                    newOrder.push(category);
                    break;
            }
            
            setCategoryOrder(newOrder);
            await reorderMainCategories(newOrder);
            
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
        } catch (error) {
            console.error('Failed to sort main category:', error);
            alert('排序失败，请重试');
        } finally {
            setIsSorting(false);
        }
    };

    const handleSortSubCategory = async (mainCategory: string, subCategory: string, action: 'up' | 'down' | 'top' | 'bottom') => {
        if (isSorting) return;
        setIsSorting(true);
        
        try {
            const subCategories = templateData[mainCategory] || [];
            const subCategoryNames = subCategories.map((sc: ManagedPromptTemplateCategory) => sc.name);
            const currentIndex = subCategoryNames.indexOf(subCategory);
            const newOrder = [...subCategoryNames];
            
            switch(action) {
                case 'up':
                    if (currentIndex > 0) {
                        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
                    }
                    break;
                case 'down':
                    if (currentIndex < newOrder.length - 1) {
                        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                    }
                    break;
                case 'top':
                    newOrder.splice(currentIndex, 1);
                    newOrder.unshift(subCategory);
                    break;
                case 'bottom':
                    newOrder.splice(currentIndex, 1);
                    newOrder.push(subCategory);
                    break;
            }
            
            // 更新本地状态
            setTemplateData(prevData => {
                const newData = { ...prevData };
                const reorderedSubCategories = newOrder.map(name => 
                    subCategories.find((sc: ManagedPromptTemplateCategory) => sc.name === name)
                ).filter(Boolean);
                newData[mainCategory] = reorderedSubCategories;
                return newData;
            });
            
            await reorderSubCategories(mainCategory, newOrder);
            
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
        } catch (error) {
            console.error('Failed to sort sub category:', error);
            alert('排序失败，请重试');
        } finally {
            setIsSorting(false);
        }
    };

    const handleSortTemplate = async (mainCategory: string, subCategory: string, templateId: string, action: 'up' | 'down' | 'top' | 'bottom') => {
        if (isSorting) return;
        setIsSorting(true);
        
        try {
            const subCategories = templateData[mainCategory] || [];
            const subCat = subCategories.find((sc: ManagedPromptTemplateCategory) => sc.name === subCategory);
            if (!subCat) return;
            
            const templates = subCat.templates;
            const templateIds = templates.map(t => t.id);
            const currentIndex = templateIds.indexOf(templateId);
            const newOrder = [...templateIds];
            
            switch(action) {
                case 'up':
                    if (currentIndex > 0) {
                        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
                    }
                    break;
                case 'down':
                    if (currentIndex < newOrder.length - 1) {
                        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                    }
                    break;
                case 'top':
                    newOrder.splice(currentIndex, 1);
                    newOrder.unshift(templateId);
                    break;
                case 'bottom':
                    newOrder.splice(currentIndex, 1);
                    newOrder.push(templateId);
                    break;
            }
            
            // 更新本地状态
            setTemplateData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData));
                const subCat = newData[mainCategory].find((sc: ManagedPromptTemplateCategory) => sc.name === subCategory);
                if (subCat) {
                    subCat.templates = newOrder.map(id => 
                        templates.find(t => t.id === id)
                    ).filter(Boolean);
                }
                return newData;
            });
            
            await reorderTemplates(newOrder);
            
            if (onTemplatesUpdated) {
                await onTemplatesUpdated();
            }
        } catch (error) {
            console.error('Failed to sort template:', error);
            alert('排序失败，请重试');
        } finally {
            setIsSorting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Template Management</h3>
                <div className="flex gap-2">
                    <Button 
                        onClick={handleAddMainCategory}
                        className="!bg-indigo-50 hover:!bg-indigo-100 !text-indigo-600 !border-indigo-200"
                    >
                        <IconPlus className="w-4 h-4 mr-1" />
                        Add Category
                    </Button>
                    <Button 
                        onClick={() => setIsBatchUploadOpen(true)}
                        className="!bg-purple-50 hover:!bg-purple-100 !text-purple-600 !border-purple-200"
                    >
                        <IconUpload className="w-4 h-4 mr-1" />
                        Batch Upload
                    </Button>
                </div>
            </div>
            <div className="mt-4 space-y-4">
                {categoryOrder.map(mainCategory => {
                    const subCategories = templateData[mainCategory] || [];
                    
                    // Admin Panel 显示所有子分类（包括被禁用的），不过滤
                    if (subCategories.length === 0) return null;
                    
                    const hasAnyEnabled = subCategories.some((sc: ManagedPromptTemplateCategory) => sc.enabled);
                    
                    const isMainCollapsed = collapsedMainCategories.has(mainCategory);
                    
                    const mainCategoryIndex = categoryOrder.indexOf(mainCategory);
                    
                    return (
                        <div key={mainCategory} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleMainCategoryCollapse(mainCategory)}
                                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                    title={isMainCollapsed ? "Expand" : "Collapse"}
                                >
                                    <IconChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />
                                </button>
                                <h4 className="font-semibold text-slate-900">{mainCategory}</h4>
                                <SortControls 
                                    onMoveUp={() => handleSortMainCategory(mainCategory, 'up')}
                                    onMoveDown={() => handleSortMainCategory(mainCategory, 'down')}
                                    onMoveToTop={() => handleSortMainCategory(mainCategory, 'top')}
                                    onMoveToBottom={() => handleSortMainCategory(mainCategory, 'bottom')}
                                    isFirst={mainCategoryIndex === 0}
                                    isLast={mainCategoryIndex === categoryOrder.length - 1}
                                />
                                <button 
                                    onClick={() => handleDeleteMainCategory(mainCategory)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Category"
                                >
                                    <IconTrash className="w-4 h-4" />
                                </button>
                            </div>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={hasAnyEnabled} 
                                    onChange={() => toggleMainCategory(mainCategory)} 
                                    className="sr-only peer" 
                                />
                                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        {!isMainCollapsed && (
                        <div className="mt-3 space-y-3">
                            {subCategories.map((subCategory: ManagedPromptTemplateCategory, subIndex: number) => {
                                const subKey = `${mainCategory}::${subCategory.name}`;
                                const isSubCollapsed = collapsedSubCategories.has(subKey);
                                
                                return (
                                <div key={subCategory.name}>
                                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleSubCategoryCollapse(mainCategory, subCategory.name)}
                                                className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                                                title={isSubCollapsed ? "Expand" : "Collapse"}
                                            >
                                                <IconChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isSubCollapsed ? '-rotate-90' : ''}`} />
                                            </button>
                                            <h5 className="font-medium text-sm text-slate-700">{subCategory.name}</h5>
                                            <SortControls 
                                                onMoveUp={() => handleSortSubCategory(mainCategory, subCategory.name, 'up')}
                                                onMoveDown={() => handleSortSubCategory(mainCategory, subCategory.name, 'down')}
                                                onMoveToTop={() => handleSortSubCategory(mainCategory, subCategory.name, 'top')}
                                                onMoveToBottom={() => handleSortSubCategory(mainCategory, subCategory.name, 'bottom')}
                                                isFirst={subIndex === 0}
                                                isLast={subIndex === subCategories.length - 1}
                                            />
                                            <button 
                                                onClick={() => handleDeleteSubCategory(mainCategory, subCategory.name)}
                                                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                                                title="Delete Sub-Category"
                                            >
                                                <IconTrash className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={subCategory.enabled} onChange={() => toggleSubCategory(mainCategory, subCategory.name)} className="sr-only peer" />
                                            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    {!isSubCollapsed && (
                                    <div className="grid grid-cols-8 gap-2 mt-2">
                                        {subCategory.templates.map((template, templateIndex) => (
                                            <div key={template.id} className="group relative">
                                                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                                                    <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                                </div>
                                                <p className="text-[10px] text-center mt-1 text-slate-600 truncate">{template.name}</p>
                                                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex flex-col items-center justify-center h-full gap-1">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleEditTemplate(template, mainCategory, subCategory.name)} className="p-1.5 bg-white/80 rounded-full hover:bg-white"><IconPencil className="w-3 h-3" /></button>
                                                            <button onClick={() => handleDeleteTemplate(template.id, mainCategory, subCategory.name)} className="p-1.5 bg-white/80 rounded-full hover:bg-white text-red-500"><IconTrash className="w-3 h-3" /></button>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 bg-white/90 rounded-md p-0.5">
                                                            <button 
                                                                onClick={() => handleSortTemplate(mainCategory, subCategory.name, template.id, 'top')}
                                                                disabled={templateIndex === 0}
                                                                className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="移到最前"
                                                            >
                                                                <IconMoveToTop className="w-2.5 h-2.5 text-slate-700" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSortTemplate(mainCategory, subCategory.name, template.id, 'up')}
                                                                disabled={templateIndex === 0}
                                                                className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="上移"
                                                            >
                                                                <IconMoveUp className="w-2.5 h-2.5 text-slate-700" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSortTemplate(mainCategory, subCategory.name, template.id, 'down')}
                                                                disabled={templateIndex === subCategory.templates.length - 1}
                                                                className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="下移"
                                                            >
                                                                <IconMoveDown className="w-2.5 h-2.5 text-slate-700" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSortTemplate(mainCategory, subCategory.name, template.id, 'bottom')}
                                                                disabled={templateIndex === subCategory.templates.length - 1}
                                                                className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="移到最后"
                                                            >
                                                                <IconMoveToBottom className="w-2.5 h-2.5 text-slate-700" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => handleAddTemplate(mainCategory, subCategory.name)} className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                                            <IconPlus className="w-4 h-4" />
                                            <span className="text-[10px] mt-0.5">Add</span>
                                        </button>
                                    </div>
                                    )}
                                </div>
                                );
                            })}
                            <button
                                onClick={() => handleAddSubCategory(mainCategory)}
                                className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <IconPlus className="w-4 h-4" />
                                <span className="text-sm font-medium">Add {mainCategory === 'Interior Design' ? 'Room Type' : 'Sub-Category'}</span>
                            </button>
                        </div>
                        )}
                        </div>
                    );
                })}
            </div>
            <TemplateModal
                isOpen={isTemplateModalOpen}
                template={editingTemplate}
                onClose={() => setIsTemplateModalOpen(false)}
                onSave={handleSaveTemplate}
            />
            <CategoryModal
                isOpen={isCategoryModalOpen}
                type={categoryModalType}
                context={categoryModalContext}
                onClose={() => setIsCategoryModalOpen(false)}
                onSave={(categoryName) => {
                    // 添加分类到本地状态（空的分类，等待用户添加模板）
                    if (categoryModalType === 'main') {
                        // 添加新的主分类
                        setTemplateData(prev => ({
                            ...prev,
                            [categoryName]: []
                        }));
                        setCategoryOrder(prev => [...prev, categoryName]);
                    } else {
                        // 添加子分类到现有主分类
                        const mainCategory = categoryModalContext?.mainCategory;
                        if (mainCategory) {
                            setTemplateData(prev => {
                                const newData = JSON.parse(JSON.stringify(prev));
                                if (!newData[mainCategory]) {
                                    newData[mainCategory] = [];
                                }
                                // 检查是否已存在
                                if (!newData[mainCategory].find((sc: ManagedPromptTemplateCategory) => sc.name === categoryName)) {
                                    newData[mainCategory].push({
                                        name: categoryName,
                                        templates: [],
                                        enabled: false
                                    });
                                }
                                return newData;
                            });
                        }
                    }
                    setIsCategoryModalOpen(false);
                    alert(`"${categoryName}" added! Now you can add templates to it.`);
                }}
            />
            <BatchTemplateUpload
                isOpen={isBatchUploadOpen}
                onClose={() => setIsBatchUploadOpen(false)}
                onSuccess={async () => {
                    // 刷新模板列表
                    const freshTemplates = await getAllTemplates();
                    setTemplateData(freshTemplates);
                    setCategoryOrder(Object.keys(freshTemplates));
                    if (onTemplatesUpdated) {
                        await onTemplatesUpdated();
                    }
                }}
            />
        </div>
    );
};

const UserModal: React.FC<{
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSave: (user: User) => void;
    onDelete: (userId: string) => void;
}> = ({ isOpen, user, onClose, onSave, onDelete }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        setEditingUser(user);
    }, [user]);

    if (!isOpen || !editingUser) return null;

    const handleSave = () => {
        if (editingUser) onSave(editingUser);
    };
    
    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the user ${editingUser.email}? This action cannot be undone.`)) {
            onDelete(editingUser.id);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 shadow-2xl w-full max-w-md relative"
                    >
                        <h3 className="text-lg font-semibold text-slate-800">Edit User</h3>
                        <p className="text-sm text-slate-500 -mt-1">{editingUser.email}</p>
                        
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Permission Level</label>
                                <select
                                    value={editingUser.permissionLevel}
                                    onChange={(e) => setEditingUser({ ...editingUser, permissionLevel: parseInt(e.target.value) as User['permissionLevel'] })}
                                    className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg"
                                >
                                    {Object.keys(PERMISSION_MAP).map(levelStr => {
                                        const level = parseInt(levelStr) as User['permissionLevel'];
                                        return (
                                            <option key={level} value={level}>{PERMISSION_MAP[level]}</option>
                                        );
                                    })}
                                </select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-slate-700">Credits</label>
                                <input
                                    type="number"
                                    value={editingUser.credits}
                                    onChange={(e) => setEditingUser({ ...editingUser, credits: parseInt(e.target.value) || 0 })}
                                    className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <select
                                    value={editingUser.status}
                                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}
                                    className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Banned">Banned</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                            <Button onClick={handleDelete} className="!bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-200">
                                <IconTrash className="w-4 h-4" /> Delete User
                            </Button>
                            <div className="flex gap-3">
                                <Button onClick={onClose}>Cancel</Button>
                                <Button onClick={handleSave} primary>Save Changes</Button>
                            </div>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><IconX/></button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const TemplateModal: React.FC<{
    isOpen: boolean;
    template: PromptTemplate | null;
    onClose: () => void;
    onSave: (template: PromptTemplate) => void;
}> = ({ isOpen, template, onClose, onSave }) => {
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (template) {
            setEditingTemplate(JSON.parse(JSON.stringify(template)));
        }
    }, [template]);
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingTemplate) {
            const base64 = await toBase64(file);
            setEditingTemplate({ ...editingTemplate, imageUrl: base64 });
        }
    };

    if (!isOpen || !editingTemplate) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 shadow-2xl w-full max-w-lg relative"
                    >
                        <h3 className="text-lg font-semibold text-slate-800">Edit Template</h3>
                        <div className="mt-6 grid grid-cols-3 gap-6">
                            <div className="col-span-1 space-y-2">
                                <label className="text-sm font-medium text-slate-700">Image</label>
                                <div 
                                    className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <img src={editingTemplate.imageUrl} alt="Template preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <IconPencil />
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>
                            <div className="col-span-2 space-y-4">
                                 <div>
                                    <label className="text-sm font-medium text-slate-700">Template Name</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.name}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Prompt</label>
                                    <textarea
                                        value={editingTemplate.prompt}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, prompt: e.target.value })}
                                        className="w-full p-2 mt-1 bg-white border border-slate-300 rounded-lg h-32"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button onClick={onClose}>Cancel</Button>
                            <Button onClick={() => onSave(editingTemplate)} primary>Save Template</Button>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><IconX /></button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const CategoryModal: React.FC<{
    isOpen: boolean;
    type: 'main' | 'sub' | 'room';
    context: { mainCategory?: string } | null;
    onClose: () => void;
    onSave: (categoryName: string) => void;
}> = ({ isOpen, type, context, onClose, onSave }) => {
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCategoryName('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getTitle = () => {
        if (type === 'main') return 'Add Main Category';
        if (type === 'room') return 'Add Room Type';
        return 'Add Sub-Category';
    };

    const getPlaceholder = () => {
        if (type === 'main') return 'e.g., Interior Design';
        if (type === 'room') return 'e.g., living-room';
        return 'e.g., Design Aesthetics';
    };

    const handleSubmit = () => {
        if (!categoryName.trim()) {
            alert('Please enter a category name');
            return;
        }
        onSave(categoryName.trim());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 shadow-2xl w-full max-w-md relative"
                    >
                        <h3 className="text-lg font-semibold text-slate-800">{getTitle()}</h3>
                        {context?.mainCategory && (
                            <p className="text-sm text-slate-500 mt-1">
                                under <span className="font-medium">{context.mainCategory}</span>
                            </p>
                        )}
                        
                        <div className="mt-6">
                            <label className="text-sm font-medium text-slate-700">Category Name</label>
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder={getPlaceholder()}
                                className="w-full p-3 mt-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSubmit();
                                }}
                            />
                            {type === 'room' && (
                                <p className="text-xs text-slate-500 mt-2">
                                    Use lowercase with hyphens (e.g., living-room, dining-room)
                                </p>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button onClick={onClose}>Cancel</Button>
                            <Button onClick={handleSubmit} primary>Add Category</Button>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                            <IconX />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Main Admin Page Component ---
export const AdminPage: React.FC<AdminPageProps> = ({
    users,
    onUpdateUser,
    onDeleteUser,
    generationHistory,
    totalDesignsGenerated,
    onDeleteBatch,
    templateData,
    setTemplateData,
    categoryOrder,
    setCategoryOrder,
    onTemplatesUpdated,
}) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const tabs = [
        { id: 'dashboard', name: 'Dashboard', icon: IconLayoutDashboard },
        { id: 'users', name: 'Users', icon: IconUsers },
        { id: 'designs', name: 'Designs', icon: IconPhoto },
        { id: 'templates', name: 'Templates', icon: IconSparkles },
        { id: 'hero-section', name: 'Hero Section', icon: IconSparkles },
        { id: 'home-sections', name: 'Home Sections', icon: IconLayoutDashboard },
        { id: 'settings', name: 'Settings', icon: IconSettings },
    ];

    // 注意：模板数据现在通过props从App.tsx传入（adminTemplateDataFull）
    // Admin Panel 使用包含所有模板（包括禁用的）的完整数据
    // 前端功能页面使用只包含启用模板的数据（adminTemplateData）

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard users={users} generationHistory={generationHistory} totalDesignsGenerated={totalDesignsGenerated} />;
            case 'users':
                return <UserManagement users={users} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />;
            case 'designs':
                return <DesignManagement generationHistory={generationHistory} onDeleteBatch={onDeleteBatch} />;
            case 'templates':
                return <TemplateManagement templateData={templateData} setTemplateData={setTemplateData} categoryOrder={categoryOrder} setCategoryOrder={setCategoryOrder} onTemplatesUpdated={onTemplatesUpdated} />;
            case 'hero-section':
                return <HeroSectionManager onUpdate={onTemplatesUpdated} />;
            case 'home-sections':
                return <HomeSectionManager onUpdate={onTemplatesUpdated} />;
            default:
                return <div className="bg-white p-6 rounded-2xl shadow-sm">Coming soon...</div>;
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-slate-100 pt-[72px]">
            <aside className="w-64 bg-white p-4 border-r border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 px-2 pb-6 border-b border-slate-200">
                    <span className="text-2xl font-bold text-indigo-600">MN</span>
                    <span className="text-xl font-bold text-slate-800">Admin Panel</span>
                </div>
                <nav className="mt-6 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                activeTab === tab.id
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-3xl font-bold text-slate-900">Welcome, Admin!</h1>
                <p className="mt-1 text-slate-500">Here's an overview of your platform's activity.</p>
                <div className="mt-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};