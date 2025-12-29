"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHelper = void 0;
const health_calculator_1 = require("./health-calculator");
const storage_1 = require("./storage");
class AuthHelper {
    // 微信登录
    static wxLogin() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => {
                    if (res.code) {
                        // 获取用户信息
                        AuthHelper.getUserProfile().then(userInfo => {
                            storage_1.StorageHelper.saveUserInfo(userInfo);
                            resolve(userInfo);
                        }).catch(reject);
                    }
                    else {
                        reject(new Error('登录失败'));
                    }
                },
                fail: reject
            });
        });
    }
    // 获取用户信息
    static getUserProfile() {
        return new Promise((resolve, reject) => {
            wx.getUserProfile({
                desc: '用于完善用户资料',
                success: (res) => {
                    console.log('getUserProfile success:', res);
                    resolve(res.userInfo);
                },
                fail: (err) => {
                    console.log('getUserProfile fail:', err);
                    // 在开发者工具中，提供一个模拟的用户信息
                    const systemInfo = wx.getSystemInfoSync();
                    if (systemInfo.platform === 'devtools' || err.errMsg.includes('getUserProfile:fail can only be invoked by user')) {
                        const mockUserInfo = {
                            nickName: '测试用户',
                            avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
                        };
                        console.log('使用模拟用户信息:', mockUserInfo);
                        resolve(mockUserInfo);
                    }
                    else {
                        reject(err);
                    }
                }
            });
        });
    }
    // 获取用户信息
    static getUserInfo() {
        return storage_1.StorageHelper.getUserInfo();
    }
    // 获取用户资料
    static getUserProfileData() {
        return storage_1.StorageHelper.getUserProfile();
    }
    // 获取健康目标
    static getUserGoals() {
        return storage_1.StorageHelper.getHealthGoals();
    }
    // 检查登录状态
    static checkLoginStatus() {
        const userInfo = storage_1.StorageHelper.getUserInfo();
        return !!userInfo;
    }
    // 退出登录
    static logout() {
        wx.removeStorageSync('userInfo');
        // 保留用户健康数据，只清除登录状态
    }
    // 保存用户基础信息
    static saveUserProfile(profileData) {
        console.log('AuthHelper.saveUserProfile 输入:', profileData);
        const existingProfile = storage_1.StorageHelper.getUserProfile();
        console.log('existingProfile:', existingProfile);
        
        try {
            // 计算BMI
            const bmi = health_calculator_1.BMICalculator.calculateBMI(profileData.height, profileData.weight);
            const bmiCategory = health_calculator_1.BMICalculator.getBMICategory(bmi);
            console.log('计算BMI:', bmi, '分类:', bmiCategory);
            
            // 计算目标体重范围
            const tempProfile = {
                height: profileData.height,
                weight: profileData.weight,
                gender: profileData.gender,
                age: profileData.age,
                healthGoal: profileData.healthGoal,
                activityLevel: profileData.activityLevel,
                bmi,
                bmiCategory,
                targetWeightRange: { min: 0, max: 0 },
                createdAt: (existingProfile && existingProfile.createdAt) || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            console.log('tempProfile for TargetWeightCalculator:', tempProfile);
            
            const targetWeightRange = health_calculator_1.TargetWeightCalculator.calculateTargetWeight(tempProfile);
            console.log('计算目标体重范围:', targetWeightRange);
            
            const profile = {
                ...tempProfile,
                targetWeightRange,
                ...(profileData.targetWeight && { targetWeight: profileData.targetWeight }),
                ...(profileData.otherGoal && { otherGoal: profileData.otherGoal })
            };
            
            console.log('最终保存的profile:', profile);
            storage_1.StorageHelper.saveUserProfile(profile);
            return profile;
        } catch (error) {
            console.error('保存用户资料时出错:', error);
            
            // 如果计算失败，至少保存基本信息
            const basicProfile = {
                ...profileData,
                bmi: profileData.height && profileData.weight ? 
                    health_calculator_1.BMICalculator.calculateBMI(profileData.height, profileData.weight) : 0,
                bmiCategory: profileData.height && profileData.weight ? 
                    health_calculator_1.BMICalculator.getBMICategory(
                        health_calculator_1.BMICalculator.calculateBMI(profileData.height, profileData.weight)
                    ) : 'normal',
                targetWeightRange: { min: 0, max: 0 },
                createdAt: (existingProfile && existingProfile.createdAt) || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            console.log('保存基本信息:', basicProfile);
            storage_1.StorageHelper.saveUserProfile(basicProfile);
            return basicProfile;
        }
    }
    // 生成健康目标
    static generateHealthGoals(profile) {
        const goals = health_calculator_1.HealthGoalsCalculator.generateHealthGoals(profile);
        storage_1.StorageHelper.saveHealthGoals(goals);
        return goals;
    }
    // 更新用户目标
    static updateHealthGoals(updates) {
        const existingGoals = storage_1.StorageHelper.getHealthGoals();
        const updatedGoals = {
            ...existingGoals,
            ...updates
        };
        storage_1.StorageHelper.saveHealthGoals(updatedGoals);
        return updatedGoals;
    }
    // 获取用户完整信息
    static getUserCompleteInfo() {
        return {
            userInfo: storage_1.StorageHelper.getUserInfo(),
            userProfile: storage_1.StorageHelper.getUserProfile(),
            healthGoals: storage_1.StorageHelper.getHealthGoals()
        };
    }
    // 检查用户是否完善基础信息
    static isUserProfileComplete() {
        const profile = storage_1.StorageHelper.getUserProfile();
        if (!profile)
            return false;
        const requiredFields = ['height', 'weight', 'gender', 'age', 'healthGoal', 'activityLevel'];
        return requiredFields.every(field => profile[field] !== undefined && profile[field] !== null);
    }
    // 获取用户登录提示文案
    static getLoginPromptMessage() {
        return '为了更好地为您提供个性化健康管理服务，请授权微信登录';
    }
    // 获取完善信息提示文案
    static getProfileCompletePromptMessage() {
        return '请完善您的基础健康信息，我们将为您生成个性化的健康目标和建议';
    }
}
exports.AuthHelper = AuthHelper;
