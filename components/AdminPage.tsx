
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconLogo, IconUserCircle, IconSparkles, IconPhoto, IconLayoutDashboard, IconUsers, IconSettings, IconPencil, IconTrash, IconPlus, IconChevronDown, IconArrowDown, IconArrowUp, IconX } from './Icons';
import { PERMISSION_MAP } from '../constants';
import { PromptTemplate, User, GenerationBatch, RecentActivity, ManagedTemplateData, ManagedPromptTemplateCategory } from '../types';
import { Button } from './Button';
import { toBase64 } from '../utils/imageUtils';

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

const TemplateManagement: React.FC<{
    templateData: ManagedTemplateData;
    setTemplateData: React.Dispatch<React.SetStateAction<ManagedTemplateData>>;
    categoryOrder: string[];
    setCategoryOrder: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ templateData, setTemplateData, categoryOrder, setCategoryOrder }) => {
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [targetCategory, setTargetCategory] = useState<{ main: string, sub: string } | null>(null);

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

    const handleSaveTemplate = (updatedTemplate: PromptTemplate) => {
        if (!targetCategory) return;
        
        setTemplateData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const subCategory = newData[targetCategory.main].find((c: ManagedPromptTemplateCategory) => c.name === targetCategory.sub);
            if (!subCategory) return prevData;

            const existingIndex = subCategory.templates.findIndex((t: PromptTemplate) => t.id === updatedTemplate.id);
            if (existingIndex > -1) {
                subCategory.templates[existingIndex] = updatedTemplate;
            } else {
                subCategory.templates.push(updatedTemplate);
            }
            return newData;
        });
        setIsTemplateModalOpen(false);
    };

    const handleDeleteTemplate = (templateId: string, mainCategory: string, subCategoryName: string) => {
         setTemplateData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const subCategory = newData[mainCategory].find((c: ManagedPromptTemplateCategory) => c.name === subCategoryName);
            if (subCategory) {
                subCategory.templates = subCategory.templates.filter((t: PromptTemplate) => t.id !== templateId);
            }
            return newData;
        });
    };

    const toggleSubCategory = (mainCategory: string, subCategoryName: string) => {
        setTemplateData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const subCategory = newData[mainCategory].find((c: ManagedPromptTemplateCategory) => c.name === subCategoryName);
            if (subCategory) {
                subCategory.enabled = !subCategory.enabled;
            }
            return newData;
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Template Management</h3>
            <div className="mt-4 space-y-4">
                {categoryOrder.map(mainCategory => (
                    <div key={mainCategory} className="p-4 border border-slate-200 rounded-xl">
                        <h4 className="font-semibold text-slate-900">{mainCategory}</h4>
                        <div className="mt-3 space-y-3">
                            {templateData[mainCategory].map(subCategory => (
                                <div key={subCategory.name}>
                                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                        <h5 className="font-medium text-sm text-slate-700">{subCategory.name}</h5>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={subCategory.enabled} onChange={() => toggleSubCategory(mainCategory, subCategory.name)} className="sr-only peer" />
                                            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3 mt-3">
                                        {subCategory.templates.map(template => (
                                            <div key={template.id} className="group relative">
                                                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                                                    <img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                                </div>
                                                <p className="text-xs text-center mt-1 text-slate-600 truncate">{template.name}</p>
                                                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditTemplate(template, mainCategory, subCategory.name)} className="p-2 bg-white/80 rounded-full hover:bg-white"><IconPencil className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteTemplate(template.id, mainCategory, subCategory.name)} className="p-2 bg-white/80 rounded-full hover:bg-white text-red-500"><IconTrash className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => handleAddTemplate(mainCategory, subCategory.name)} className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                                            <IconPlus />
                                            <span className="text-xs mt-1">Add</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <TemplateModal
                isOpen={isTemplateModalOpen}
                template={editingTemplate}
                onClose={() => setIsTemplateModalOpen(false)}
                onSave={handleSaveTemplate}
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
                                    className="aspect-square rounded-xl bg-slate-100 overflow-hidden cursor-pointer group"
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
}) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const tabs = [
        { id: 'dashboard', name: 'Dashboard', icon: IconLayoutDashboard },
        { id: 'users', name: 'Users', icon: IconUsers },
        { id: 'designs', name: 'Designs', icon: IconPhoto },
        { id: 'templates', name: 'Templates', icon: IconSparkles },
        { id: 'settings', name: 'Settings', icon: IconSettings },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard users={users} generationHistory={generationHistory} totalDesignsGenerated={totalDesignsGenerated} />;
            case 'users':
                return <UserManagement users={users} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />;
            case 'designs':
                return <DesignManagement generationHistory={generationHistory} onDeleteBatch={onDeleteBatch} />;
            case 'templates':
                return <TemplateManagement templateData={templateData} setTemplateData={setTemplateData} categoryOrder={categoryOrder} setCategoryOrder={setCategoryOrder} />;
            default:
                return <div className="bg-white p-6 rounded-2xl shadow-sm">Coming soon...</div>;
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-slate-100 pt-[72px]">
            <aside className="w-64 bg-white p-4 border-r border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 px-2 pb-6 border-b border-slate-200">
                    <IconLogo />
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