"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// profile.ts
const auth_1 = require("../../utils/auth");
const health_calculator_1 = require("../../utils/health-calculator");
const storage_1 = require("../../utils/storage");
Page({
    data: {
        isEditing: false,
        formData: {
            height: '',
            weight: '',
            gender: 'male',
            age: '',
            healthGoal: 'maintain_health',
            otherGoal: '',
            activityLevel: 'moderate',
            targetWeight: ''
        },
        userProfile: null,
        healthGoals: null,
        userInfo: null,
        healthGoalOptions: [
            { value: 'weight_loss', label: '减脂', desc: '减少体脂，塑造身材' },
            { value: 'muscle_gain', label: '增肌', desc: '增加肌肉，提升力量' },
            { value: 'maintain_health', label: '维持健康', desc: '保持当前健康状态' },
            { value: 'other', label: '其他', desc: '自定义健康目标' }
        ],
        activityLevelOptions: [
            { value: 'sedentary', label: '久坐少动', desc: '每天很少运动，大部分时间坐着' },
            { value: 'light', label: '轻度活动', desc: '偶尔运动，每周1-3次轻度活动' },
            { value: 'moderate', label: '中度活动', desc: '规律运动，每周3-5次中等强度运动' },
            { value: 'high', label: '高度活动', desc: '高强度运动，每周6-7次运动' }
        ],
        calculatedBMI: 0,
        bmiCategory: '',
        bmiCategoryText: '',
        targetWeightRange: { min: 0, max: 0 },
        activityLevelLabel: '',
        healthGoalLabel: ''
    },
    onLoad() {
        this.loadUserData();
    },
    loadUserData() {
        console.log('loadUserData called');
        const userInfo = auth_1.AuthHelper.getUserInfo();
        console.log('userInfo:', userInfo);
        let userProfile = auth_1.AuthHelper.getUserProfileData();
        console.log('userProfile:', userProfile);
        const healthGoals = auth_1.AuthHelper.getUserGoals();
        console.log('healthGoals:', healthGoals);
        
        // 数据完整性检查和自动修复
        if (userProfile) {
            const fixedProfile = this.checkAndFixProfileData(userProfile);
            if (fixedProfile !== userProfile) {
                userProfile = fixedProfile;
                console.log('用户资料数据已修复:', userProfile);
            }
            
            // 重新获取BMI分类文本，确保显示正确
            const bmiCategoryText = health_calculator_1.BMICalculator.getBMICategoryText(userProfile.bmiCategory);
            
            // 获取活动量标签
            const activityLevelLabel = this.getActivityLevelLabel(userProfile.activityLevel);
            
            // 获取健康目标标签
            const healthGoalLabel = this.getHealthGoalLabel(userProfile.healthGoal);
            
            // 始终重新计算BMI，确保数据准确性
            if (userProfile.height && userProfile.weight) {
                const calculatedBMI = health_calculator_1.BMICalculator.calculateBMI(userProfile.height, userProfile.weight);
                const calculatedBMICategory = health_calculator_1.BMICalculator.getBMICategory(calculatedBMI);
                
                // 更新用户资料中的BMI数据
                userProfile.bmi = calculatedBMI;
                userProfile.bmiCategory = calculatedBMICategory;
                
                console.log('Profile页面BMI重新计算:', { 
                    height: userProfile.height, 
                    weight: userProfile.weight, 
                    calculatedBMI, 
                    calculatedBMICategory 
                });
            } else {
                console.log('缺少身高或体重数据，无法计算BMI');
            }
            
            // 确保目标体重范围存在
            if (!userProfile.targetWeightRange) {
                const TargetWeightCalculator = require('../../utils/health-calculator').TargetWeightCalculator;
                // 确保使用用户的实际健康目标
                const profileForCalc = {
                    height: userProfile.height,
                    weight: userProfile.weight,
                    gender: userProfile.gender,
                    age: userProfile.age,
                    healthGoal: userProfile.healthGoal || 'maintain_health',
                    activityLevel: userProfile.activityLevel || 'sedentary'
                };
                userProfile.targetWeightRange = TargetWeightCalculator.calculateTargetWeight(profileForCalc);
                console.log('创建目标体重范围:', userProfile.targetWeightRange, '健康目标:', profileForCalc.healthGoal);
                
                // 保存更新后的数据
                storage_1.StorageHelper.saveUserProfile(userProfile);
            }
            
            console.log('最终显示数据:', {
                bmi: userProfile.bmi,
                bmiCategory: userProfile.bmiCategory,
                bmiCategoryText: bmiCategoryText,
                calculatedBMI: calculatedBMI.toFixed(1),
                targetWeightRange: userProfile.targetWeightRange
            });
            
            // 重新获取BMI分类文本，确保显示正确
            const bmiCategoryText = health_calculator_1.BMICalculator.getBMICategoryText(userProfile.bmiCategory);
            const calculatedBMI = userProfile.bmi > 0 ? userProfile.bmi.toFixed(1) : '--';
            
            this.setData({
                userInfo,
                userProfile,
                healthGoals,
                bmiCategoryText,
                activityLevelLabel,
                healthGoalLabel,
                calculatedBMI,
                targetWeightRange: userProfile.targetWeightRange
            });
            
            console.log('最终显示的BMI数据:', { calculatedBMI, bmiCategoryText });
        } else {
            this.setData({
                userInfo,
                userProfile: null,
                healthGoals,
                bmiCategoryText: '',
                activityLevelLabel: '',
                healthGoalLabel: ''
            });
        }
        
        console.log('Data loaded and set, current data:', this.data);
    },
    
    // 检查并修复用户资料数据
    checkAndFixProfileData(profile) {
        let needsUpdate = false;
        
        // 确保BMI存在且正确（始终重新计算）
        if (profile.height && profile.weight) {
            const calculatedBMI = health_calculator_1.BMICalculator.calculateBMI(profile.height, profile.weight);
            const calculatedBMICategory = health_calculator_1.BMICalculator.getBMICategory(calculatedBMI);
            
            if (!profile.bmi || profile.bmi <= 0 || profile.bmi !== calculatedBMI) {
                profile.bmi = calculatedBMI;
                profile.bmiCategory = calculatedBMICategory;
                needsUpdate = true;
                console.log('修复或更新BMI数据:', profile.bmi, profile.bmiCategory);
            }
        }
        
        // 确保目标体重范围存在且有效
        if (!profile.targetWeightRange || 
            !profile.targetWeightRange.min || 
            !profile.targetWeightRange.max ||
            profile.targetWeightRange.min <= 0 ||
            profile.targetWeightRange.max <= 0) {
            
            const tempProfile = {
                height: profile.height,
                weight: profile.weight || 65,
                gender: profile.gender || 'male',
                age: profile.age || 25,
                healthGoal: profile.healthGoal || 'maintain_health',
                activityLevel: profile.activityLevel || 'moderate'
            };
            
            const newTargetWeightRange = health_calculator_1.TargetWeightCalculator.calculateTargetWeight(tempProfile);
            profile.targetWeightRange = newTargetWeightRange;
            needsUpdate = true;
            console.log('修复了缺失的目标体重范围:', newTargetWeightRange, '健康目标:', tempProfile.healthGoal);
        }
        
        // 如果数据被修复，保存更新后的数据
        if (needsUpdate) {
            profile.updatedAt = new Date().toISOString();
            storage_1.StorageHelper.saveUserProfile(profile);
            
            // 更新全局数据
            const app = getApp();
            if (app.globalData) {
                app.globalData.userProfile = profile;
                app.globalData.lastUpdateTime = Date.now();
            }
        }
        
        return profile;
    },
    // 获取活动量标签
    getActivityLevelLabel(value) {
        const option = this.data.activityLevelOptions.find(item => item.value === value);
        return option ? option.label : '';
    },
    // 获取健康目标标签
    getHealthGoalLabel(value) {
        const option = this.data.healthGoalOptions.find(item => item.value === value);
        return option ? option.label : '';
    },
    // 处理返回
    handleBack() {
        // 获取当前页面栈
        const pages = getCurrentPages();
        if (pages.length > 1) {
            // 如果有上一页，返回上一页
            wx.navigateBack();
        } else {
            // 如果没有上一页，切换到首页
            wx.switchTab({
                url: '/pages/index/index'
            });
        }
    },
    // 处理微信登录
    handleLogin() {
        wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (res) => {
                const userInfo = res.userInfo;
                storage_1.StorageHelper.saveUserInfo(userInfo);
                this.setData({
                    userInfo: userInfo
                });
                wx.showToast({
                    title: '登录成功',
                    icon: 'success'
                });
                // 自动弹出完善信息提示
                setTimeout(() => {
                    this.toggleEdit();
                }, 1500);
            },
            fail: (error) => {
                console.log('登录失败：', error);
                // 如果获取用户信息失败，可以使用模拟登录
                wx.showModal({
                    title: '提示',
                    content: '获取用户信息失败，是否使用模拟登录？',
                    success: (res) => {
                        if (res.confirm) {
                            this.handleMockLogin();
                        }
                    }
                });
            }
        });
    },
    // 模拟登录(用于开发测试)
    handleMockLogin() {
        console.log('使用模拟登录');
        const mockUserInfo = {
            nickName: '测试用户',
            avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
        };
        storage_1.StorageHelper.saveUserInfo(mockUserInfo);
        this.setData({
            userInfo: mockUserInfo
        });
        wx.showToast({
            title: '模拟登录成功',
            icon: 'success'
        });
        // 自动弹出完善信息提示
        setTimeout(() => {
            this.toggleEdit();
        }, 1500);
    },
    // 切换编辑模式
    toggleEdit() {
        console.log('toggleEdit called, isEditing:', this.data.isEditing);
        if (this.data.isEditing) {
            console.log('Already editing, calling saveProfile');
            this.saveProfile();
        }
        else {
            console.log('Entering edit mode');
            // 如果有现有资料，填充到表单中
            const { userProfile } = this.data;
            console.log('Current userProfile:', userProfile);
            if (userProfile) {
                const formData = {
                    height: userProfile.height ? userProfile.height.toString() : '',
                    weight: userProfile.weight ? userProfile.weight.toString() : '',
                    gender: userProfile.gender || 'male',
                    age: userProfile.age ? userProfile.age.toString() : '',
                    healthGoal: userProfile.healthGoal || 'maintain_health',
                    otherGoal: userProfile.otherGoal || '',
                    activityLevel: userProfile.activityLevel || 'moderate',
                    targetWeight: userProfile.targetWeight ? userProfile.targetWeight.toString() : (userProfile.weight ? userProfile.weight.toString() : '')
                };
                console.log('Setting formData:', formData);
                this.setData({
                    isEditing: true,
                    formData: formData
                });
            }
            else {
                console.log('No existing profile, using defaults');
                // 新用户，使用默认值
                this.setData({
                    isEditing: true
                });
            }
        }
    },
    // 保存用户资料
    saveProfile() {
        const { formData } = this.data;
        // 验证表单
        if (!formData.height || !formData.weight || !formData.age) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'error'
            });
            return;
        }
        if (parseFloat(formData.height) <= 0 || parseFloat(formData.weight) <= 0 || parseInt(formData.age) <= 0) {
            wx.showToast({
                title: '请输入有效的数值',
                icon: 'error'
            });
            return;
        }
        if (formData.healthGoal === 'other' && !formData.otherGoal.trim()) {
            wx.showToast({
                title: '请填写其他健康目标',
                icon: 'error'
            });
            return;
        }
        wx.showLoading({
            title: '保存中...'
        });
        try {
            console.log('保存用户资料，formData:', formData);
            
            // 构建完整的用户资料数据
            const height = parseFloat(formData.height);
            const weight = parseFloat(formData.weight);
            const age = parseInt(formData.age);
            
            // 计算BMI
            const bmi = health_calculator_1.BMICalculator.calculateBMI(height, weight);
            const bmiCategory = health_calculator_1.BMICalculator.getBMICategory(bmi);
            const bmiCategoryText = health_calculator_1.BMICalculator.getBMICategoryText(bmiCategory);
            
            // 计算目标体重范围
            const tempProfile = {
                height,
                weight,
                gender: formData.gender,
                age,
                healthGoal: formData.healthGoal,
                activityLevel: formData.activityLevel,
                bmi,
                bmiCategory,
                targetWeightRange: { min: 0, max: 0 },
                createdAt: this.data.userProfile?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const targetWeightRange = health_calculator_1.TargetWeightCalculator.calculateTargetWeight(tempProfile);
            
            // 构建完整的用户资料
            const profileData = {
                height,
                weight,
                gender: formData.gender,
                age,
                healthGoal: formData.healthGoal,
                activityLevel: formData.activityLevel,
                bmi,
                bmiCategory,
                targetWeightRange,
                createdAt: this.data.userProfile?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // 如果有目标体重，添加进去
            if (formData.targetWeight && formData.targetWeight.trim()) {
                profileData.targetWeight = parseFloat(formData.targetWeight);
            }
            
            // 如果是其他目标，添加描述
            if (formData.healthGoal === 'other' && formData.otherGoal.trim()) {
                profileData.otherGoal = formData.otherGoal.trim();
            }
            
            console.log('准备保存的完整profileData:', profileData);
            
            // 使用StorageHelper直接保存，确保数据完整性
            storage_1.StorageHelper.saveUserProfile(profileData);
            
            // 生成健康目标
            const healthGoals = health_calculator_1.HealthGoalsCalculator.generateHealthGoals(profileData);
            storage_1.StorageHelper.saveHealthGoals(healthGoals);
            
            this.setData({
                userProfile: profileData,
                healthGoals: healthGoals,
                isEditing: false,
                bmiCategoryText: bmiCategoryText
            });
            
            // 更新全局数据
            const app = getApp();
            app.globalData.userProfile = profileData;
            app.globalData.healthGoals = healthGoals;
            app.globalData.lastUpdateTime = Date.now();
            
            wx.showToast({
                title: '保存成功',
                icon: 'success'
            });
        }
        catch (error) {
            console.error('保存用户资料失败:', error);
            wx.showToast({
                title: '保存失败: ' + (error.message || '未知错误'),
                icon: 'error'
            });
        }
        finally {
            wx.hideLoading();
        }
    },
    // 取消编辑
    cancelEdit() {
        this.setData({
            isEditing: false
        });
        this.loadUserData(); // 重新加载数据
    },
    // 表单输入处理
    onHeightInput(e) {
        this.setData({
            'formData.height': e.detail.value
        });
        this.calculateBMI();
    },
    onWeightInput(e) {
        this.setData({
            'formData.weight': e.detail.value
        });
        this.calculateBMI();
    },
    onAgeInput(e) {
        this.setData({
            'formData.age': e.detail.value
        });
    },
    onGenderChange(e) {
        this.setData({
            'formData.gender': e.detail.value
        });
    },
    onActivityLevelChange(e) {
        this.setData({
            'formData.activityLevel': e.detail.value
        });
        this.calculateTargetWeight();
    },
    onHealthGoalChange(e) {
        this.setData({
            'formData.healthGoal': e.detail.value
        });
        this.calculateTargetWeight();
    },
    onTargetWeightInput(e) {
        this.setData({
            'formData.targetWeight': e.detail.value
        });
    },
    onOtherGoalInput(e) {
        this.setData({
            'formData.otherGoal': e.detail.value
        });
    },
    // 计算BMI
    calculateBMI() {
        const height = parseFloat(this.data.formData.height);
        const weight = parseFloat(this.data.formData.weight);
        if (height > 0 && weight > 0) {
            const bmi = health_calculator_1.BMICalculator.calculateBMI(height, weight);
            const bmiCategory = health_calculator_1.BMICalculator.getBMICategory(bmi);
        const bmiCategoryText = health_calculator_1.BMICalculator.getBMICategoryText(bmiCategory);
        this.setData({
            calculatedBMI: bmi,
            bmiCategory,
            bmiCategoryText
        });
        }
    },
    // 计算目标体重
    calculateTargetWeight() {
        const height = parseFloat(this.data.formData.height);
        const gender = this.data.formData.gender;
        const age = parseInt(this.data.formData.age);
        const activityLevel = this.data.formData.activityLevel;
        if (height > 0 && gender && age > 0 && activityLevel) {
            const tempProfile = {
                height,
                weight: 0, // 临时值，不影响目标体重计算
                gender,
                age,
                healthGoal: 'maintain_health',
                activityLevel,
                bmi: 0,
                bmiCategory: 'normal',
                targetWeightRange: { min: 0, max: 0 },
                createdAt: '',
                updatedAt: ''
            };
            const targetWeightRange = health_calculator_1.TargetWeightCalculator.calculateTargetWeight(tempProfile);
            this.setData({
                targetWeightRange
            });
        }
    },
    // 导航功能
    navigateToData() {
        wx.switchTab({
            url: '/pages/data/data'
        });
    },
    navigateToSettings() {
        wx.navigateTo({
            url: '/pages/settings/settings'
        });
    },
    // 数据导出
    exportData() {
        wx.showLoading({
            title: '导出中...'
        });
        try {
            const exportData = storage_1.StorageHelper.exportAllData();
            // 这里应该调用文件保存API，但微信小程序有限制
            // 简化处理，显示导出成功提示
            wx.showModal({
                title: '导出成功',
                content: '数据已准备完成，建议定期导出备份您的健康数据',
                showCancel: false
            });
        }
        catch (error) {
            wx.showToast({
                title: '导出失败',
                icon: 'error'
            });
        }
        finally {
            wx.hideLoading();
        }
    },
    // 清理数据
    clearData() {
        wx.showModal({
            title: '确认清理',
            content: '此操作将删除所有历史数据，是否继续？',
            confirmText: '确认删除',
            confirmColor: '#ff4444',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '清理中...'
                    });
                    try {
                        storage_1.StorageHelper.clearOldData(0); // 删除所有历史数据
                        wx.showToast({
                            title: '清理完成',
                            icon: 'success'
                        });
                    }
                    catch (error) {
                        wx.showToast({
                            title: '清理失败',
                            icon: 'error'
                        });
                    }
                    finally {
                        wx.hideLoading();
                    }
                }
            }
        });
    },
    // 刷新健康数据
    refreshHealthData() {
        console.log('手动刷新健康数据');
        wx.showLoading({
            title: '刷新中...'
        });
        
        try {
            const userProfile = storage_1.StorageHelper.getUserProfile();
            if (userProfile) {
                // 重新计算BMI和目标体重
                let needsUpdate = false;
                
                // 强制重新计算BMI
                if (userProfile.height && userProfile.weight) {
                    const newBMI = health_calculator_1.BMICalculator.calculateBMI(userProfile.height, userProfile.weight);
                    const newBMICategory = health_calculator_1.BMICalculator.getBMICategory(newBMI);
                    
                    userProfile.bmi = newBMI;
                    userProfile.bmiCategory = newBMICategory;
                    needsUpdate = true;
                    console.log('强制更新BMI:', newBMI, newBMICategory);
                }
                
                // 强制重新计算目标体重范围（无论现有值是否存在）
                const newTargetWeightRange = health_calculator_1.TargetWeightCalculator.calculateTargetWeight(userProfile);
                userProfile.targetWeightRange = newTargetWeightRange;
                needsUpdate = true;
                console.log('强制更新目标体重范围:', newTargetWeightRange, '健康目标:', userProfile.healthGoal);
                
                // 验证计算结果
                console.log('用户数据验证:', {
                    height: userProfile.height,
                    weight: userProfile.weight,
                    gender: userProfile.gender,
                    age: userProfile.age,
                    healthGoal: userProfile.healthGoal,
                    activityLevel: userProfile.activityLevel
                });
                
                // 保存更新后的数据
                if (needsUpdate) {
                    userProfile.updatedAt = new Date().toISOString();
                    storage_1.StorageHelper.saveUserProfile(userProfile);
                    
                    // 更新全局数据
                    const app = getApp();
                    if (app.globalData) {
                        app.globalData.userProfile = userProfile;
                        app.globalData.lastUpdateTime = Date.now();
                    }
                }
                
                // 重新加载显示数据
                this.loadUserData();
                
                wx.showToast({
                    title: '刷新完成',
                    icon: 'success'
                });
            } else {
                wx.showToast({
                    title: '请先完善健康信息',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('刷新健康数据失败:', error);
            wx.showToast({
                title: '刷新失败',
                icon: 'error'
            });
        } finally {
            wx.hideLoading();
        }
    },
    // 关于应用
    showAbout() {
        wx.showModal({
            title: '关于应用',
            content: '健康习惯打卡小程序 v1.0\n\n专注于个人健康习惯管理的轻量化应用，帮助您建立良好的健康习惯。',
            showCancel: false
        });
    }
});
