/**
 * 管理员权限服务
 * 处理管理员权限检查、日志记录等
 */

import { supabase } from '../config/supabase';

export type AdminLevel = 'super_admin' | 'content_admin' | 'support_admin' | 'none';

export interface AdminUser {
  id: string;
  user_id: string;
  admin_level: AdminLevel;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  user_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

/**
 * 检查当前用户是否是管理员
 */
export const checkAdminAccess = async (): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .rpc('is_admin', { user_id_input: user.user.id });

    if (error) {
      console.error('Check admin access error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Check admin access error:', error);
    return false;
  }
};

/**
 * 检查当前用户是否是超级管理员
 */
export const checkSuperAdminAccess = async (): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .rpc('is_super_admin', { user_id_input: user.user.id });

    if (error) {
      console.error('Check super admin access error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Check super admin access error:', error);
    return false;
  }
};

/**
 * 获取当前用户的管理员级别
 */
export const getAdminLevel = async (): Promise<AdminLevel> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 'none';

    const { data, error } = await supabase
      .rpc('get_admin_level', { user_id_input: user.user.id });

    if (error) {
      console.error('Get admin level error:', error);
      return 'none';
    }

    return (data as AdminLevel) || 'none';
  } catch (error) {
    console.error('Get admin level error:', error);
    return 'none';
  }
};

/**
 * 获取管理员用户信息
 */
export const getAdminUser = async (userId?: string): Promise<AdminUser | null> => {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      permissions: data.permissions || []
    };
  } catch (error) {
    console.error('Get admin user error:', error);
    return null;
  }
};

/**
 * 获取所有管理员用户（仅超级管理员）
 */
export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get all admin users error:', error);
      return [];
    }

    return data.map(item => ({
      ...item,
      permissions: item.permissions || []
    }));
  } catch (error) {
    console.error('Get all admin users error:', error);
    return [];
  }
};

/**
 * 检查是否有特定权限
 */
export const hasPermission = async (permission: string): Promise<boolean> => {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) return false;

    // 超级管理员拥有所有权限
    if (adminUser.admin_level === 'super_admin') return true;

    // 检查具体权限
    return adminUser.permissions.includes(permission);
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
};

/**
 * 创建管理员用户（仅超级管理员）
 */
export const createAdminUser = async (
  userId: string,
  adminLevel: Exclude<AdminLevel, 'none'>,
  permissions: string[] = []
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          user_id: userId,
          admin_level: adminLevel,
          permissions: permissions,
          is_active: true
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Create admin user error:', error);
      return null;
    }

    // 记录日志
    await logAdminAction('create_admin', 'admin_user', data.id, {
      target_user_id: userId,
      admin_level: adminLevel
    });

    return data.id;
  } catch (error) {
    console.error('Create admin user error:', error);
    return null;
  }
};

/**
 * 更新管理员用户（仅超级管理员）
 */
export const updateAdminUser = async (
  adminId: string,
  updates: {
    admin_level?: Exclude<AdminLevel, 'none'>;
    permissions?: string[];
    is_active?: boolean;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', adminId);

    if (error) {
      console.error('Update admin user error:', error);
      return false;
    }

    // 记录日志
    await logAdminAction('update_admin', 'admin_user', adminId, updates);

    return true;
  } catch (error) {
    console.error('Update admin user error:', error);
    return false;
  }
};

/**
 * 撤销管理员权限（停用）
 */
export const revokeAdminAccess = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) {
      console.error('Revoke admin access error:', error);
      return false;
    }

    // 记录日志
    await logAdminAction('revoke_admin', 'user', userId);

    return true;
  } catch (error) {
    console.error('Revoke admin access error:', error);
    return false;
  }
};

/**
 * 记录管理员操作日志
 */
export const logAdminAction = async (
  action: string,
  targetType?: string,
  targetId?: string,
  details?: any
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .rpc('log_admin_action', {
        p_action: action,
        p_target_type: targetType || null,
        p_target_id: targetId || null,
        p_details: details ? JSON.stringify(details) : null
      });

    if (error) {
      console.error('Log admin action error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Log admin action error:', error);
    return null;
  }
};

/**
 * 获取管理员操作日志
 */
export const getAdminLogs = async (
  limit: number = 50,
  offset: number = 0
): Promise<AdminLog[]> => {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get admin logs error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get admin logs error:', error);
    return [];
  }
};

/**
 * 权限定义常量
 */
export const PERMISSIONS = {
  // Gallery 管理
  MANAGE_GALLERY: 'manage_gallery',
  UPLOAD_IMAGES: 'upload_images',
  DELETE_IMAGES: 'delete_images',
  
  // 用户管理
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  CHANGE_USER_TIER: 'change_user_tier',
  
  // 模板管理
  MANAGE_TEMPLATES: 'manage_templates',
  
  // 系统管理
  VIEW_LOGS: 'view_logs',
  MANAGE_ADMINS: 'manage_admins',
  
  // 所有权限
  MANAGE_ALL: 'manage_all'
} as const;

/**
 * 默认权限组
 */
export const DEFAULT_PERMISSIONS = {
  super_admin: [PERMISSIONS.MANAGE_ALL],
  content_admin: [
    PERMISSIONS.MANAGE_GALLERY,
    PERMISSIONS.UPLOAD_IMAGES,
    PERMISSIONS.DELETE_IMAGES,
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.VIEW_USERS
  ],
  support_admin: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.CHANGE_USER_TIER,
    PERMISSIONS.VIEW_LOGS
  ]
};

