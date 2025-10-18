import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../config/supabase';

// 会员权益配置
const PLAN_BENEFITS = {
  pro: {
    icon: '⭐',
    name: 'Pro Plan',
    credits: '1,000',
    concurrent: '1',
    features: [
      'Design generation features',
      'Commercial use license',
      'No watermark',
      'Style transfer',
      'Standard response times',
    ]
  },
  premium: {
    icon: '👑',
    name: 'Premium Plan',
    credits: '5,000',
    concurrent: '8',
    features: [
      'Create up to 8 designs in parallel',
      'Free Canvas feature',
      'Item Replace feature',
      'Priority queue processing',
      'Fast response times',
      'Early access to new features',
    ]
  },
  business: {
    icon: '💼',
    name: 'Business Plan',
    credits: '25,000',
    concurrent: '16',
    features: [
      'Create up to 16 designs in parallel',
      'Best value per credit',
      'Free Canvas feature',
      'Item Replace feature',
      'Priority queue processing',
      'Dedicated support',
    ]
  }
};

export const SubscriptionSuccessPage: React.FC = () => {
  const { user, profile, refreshProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // 使用原生 URLSearchParams 获取 URL 参数
  const searchParams = new URLSearchParams(window.location.search);
  const plan = searchParams.get('plan') || 'premium';
  const cycle = searchParams.get('cycle') || 'yearly';
  const planBenefits = PLAN_BENEFITS[plan as keyof typeof PLAN_BENEFITS] || PLAN_BENEFITS.premium;

  // 导航函数
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
    // 刷新用户信息以获取最新的会员状态
    const refreshUserData = async () => {
      try {
        await refreshProfile();
        
        // 获取用户的订阅信息
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('membership_tier, credits, subscription_status')
            .eq('id', user.id)
            .single();
          
          setSubscriptionData(userData);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      } finally {
        setLoading(false);
      }
    };

    refreshUserData();
  }, [user, refreshProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center px-4 py-12" style={{ fontFamily: 'Arial, sans-serif' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* 成功动画区域 */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold text-white mb-3"
          >
            🎉 Payment Successful!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-white/90"
          >
            Welcome to <span className="font-bold">{planBenefits.name}</span>!
          </motion.p>
        </div>

        {/* 订阅详情 */}
        <div className="px-8 py-10">
          {/* 计划信息卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{planBenefits.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{planBenefits.name}</h2>
                  <p className="text-gray-600">
                    {cycle === 'monthly' ? 'Monthly Subscription' : 'Annual Subscription'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {planBenefits.credits}
                </div>
                <div className="text-sm text-gray-600">Credits</div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Current Credits</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {subscriptionData?.credits?.toLocaleString() || planBenefits.credits}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Concurrent Designs</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {planBenefits.concurrent} {parseInt(planBenefits.concurrent) > 1 ? 'designs' : 'design'}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* 会员权益 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎁 Your Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {planBenefits.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-3 bg-green-50 rounded-lg p-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 确认信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8"
          >
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-gray-800 font-medium mb-1">📧 Confirmation Email Sent</p>
                <p className="text-sm text-gray-600">
                  We've sent a confirmation email to <span className="font-semibold">{user?.email}</span>. 
                  You can manage your subscription anytime in Account Settings.
                </p>
              </div>
            </div>
          </motion.div>

          {/* 行动按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <button
              onClick={() => navigateTo('/?page=interior-design')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              🎨 Start Designing
            </button>
            
            <button
              onClick={() => navigateTo('/?page=free-canvas')}
              className="bg-white border-2 border-purple-600 text-purple-600 py-4 px-6 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              🖼️ Free Canvas
            </button>
            
            <button
              onClick={() => navigateTo('/')}
              className="bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              🏠 Back to Home
            </button>
          </motion.div>

          {/* 额外提示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500">
              Need help? Check out our{' '}
              <a href="/?page=terms" className="text-indigo-600 hover:underline">Help Center</a>
              {' '}or{' '}
              <a href="mailto:support@mynook.ai" className="text-indigo-600 hover:underline">Contact Support</a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

