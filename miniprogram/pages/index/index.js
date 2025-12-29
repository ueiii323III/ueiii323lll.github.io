"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts
const auth_1 = require("../../utils/auth");
const storage_1 = require("../../utils/storage");
const health_calculator_1 = require("../../utils/health-calculator");
const app = getApp();
Page({
    data: {
        userInfo: null,
        userProfile: null,
        healthGoals: null,
        todayStats: {
            waterAmount: 0,
            waterProgress: 0,
            calorieIntake: 0,
            calorieProgress: 0,
            exerciseDuration: 0,
            exerciseProgress: 0,
            completedTasks: 0,
            totalTasks: 3
        },
        healthAdvices: [],
        hasUserInfo: false,
        isProfileComplete: false,
        quickRecord: {
            water: '',
            exercise: ''
        },
        lastUpdateTime: 0
    },
    onLoad() {
        this.initPage();
    },
    onShow() {
        // 检查是否有数据更新
        const app = getApp();
        const lastUpdateTime = app.globalData.lastUpdateTime || 0;
        const currentPageUpdateTime = this.data.lastUpdateTime || 0;
        // 如果数据有更新，强制刷新
        if (lastUpdateTime > currentPageUpdateTime) {
            console.log('检测到数据更新，刷新首页数据');
            this.refreshData();
            this.setData({
                lastUpdateTime: lastUpdateTime
            });
        }
        else if (!this.data.isInitialized) {
            this.refreshData();
            this.setData({
                isInitialized: true
            });
        }
    },
    initPage() {
        const hasUserInfo = auth_1.AuthHelper.checkLoginStatus();
        const isProfileComplete = auth_1.AuthHelper.isUserProfileComplete();
        this.setData({
            hasUserInfo,
            isProfileComplete
        });
        if (hasUserInfo && isProfileComplete) {
            this.loadUserData();
            this.calculateTodayStats();
            this.generateHealthAdvices();
        }
    },
    refreshData() {
        if (this.data.hasUserInfo && this.data.isProfileComplete) {
            // 使用批量setData，减少页面重绘
            wx.showLoading({
                title: '刷新中...'
            });
            try {
                this.loadUserData();
                this.calculateTodayStats();
                this.generateHealthAdvices();
                setTimeout(() => {
                    wx.hideLoading();
                }, 300); // 给用户感知，避免太快完成
            }
            catch (error) {
                wx.hideLoading();
                console.error('刷新数据失败:', error);
            }
        }
    },
    
    // 手动刷新数据
    forceRefreshData() {
        console.log('手动刷新首页数据');
        wx.showLoading({
            title: '刷新中...'
        });
        
        try {
            // 重新加载所有数据
            this.loadUserData();
            this.calculateTodayStats();
            this.generateHealthAdvices();
            
            // 更新刷新时间
            this.setData({
                lastUpdateTime: Date.now()
            });
            
            setTimeout(() => {
                wx.hideLoading();
                wx.showToast({
                    title: '刷新完成',
                    icon: 'success'
                });
            }, 500);
        } catch (error) {
            wx.hideLoading();
            console.error('手动刷新失败:', error);
            wx.showToast({
                title: '刷新失败',
                icon: 'error'
            });
        }
    },
    loadUserData() {
        const completeInfo = auth_1.AuthHelper.getUserCompleteInfo();
        console.log('首页加载用户数据:', completeInfo);
        
        // 确保用户资料数据完整
        let userProfile = completeInfo.userProfile;
        if (userProfile) {
            // 检查并修复缺失的BMI
            if (!userProfile.bmi && userProfile.height && userProfile.weight) {
                userProfile.bmi = health_calculator_1.BMICalculator.calculateBMI(userProfile.height, userProfile.weight);
                userProfile.bmiCategory = health_calculator_1.BMICalculator.getBMICategory(userProfile.bmi);
                console.log('首页修复BMI数据:', userProfile.bmi, userProfile.bmiCategory);
            }
            
            // 检查并修复缺失的目标体重
            if (!userProfile.targetWeightRange || userProfile.targetWeightRange.min <= 0) {
                userProfile.targetWeightRange = health_calculator_1.TargetWeightCalculator.calculateTargetWeight(userProfile);
                console.log('首页修复目标体重数据:', userProfile.targetWeightRange);
            }
            
            // 更新存储
            storage_1.StorageHelper.saveUserProfile(userProfile);
        }
        
        this.setData({
            userInfo: completeInfo.userInfo,
            userProfile: userProfile,
            healthGoals: completeInfo.healthGoals || this.getDefaultHealthGoals(userProfile)
        });
    },
    
    // 获取默认健康目标
    getDefaultHealthGoals(userProfile) {
        if (!userProfile) return null;
        
        return {
            dailyWaterIntake: Math.round(userProfile.weight * 33),
            dailyCalorieMin: 1800,
            dailyCalorieMax: 2200,
            dailyExerciseDuration: 30,
            weeklyExerciseFrequency: 5,
            targetWeight: userProfile.weight
        };
    },
    calculateTodayStats: function () {
        // 使用节流，避免频繁计算
        if (this.calculateTimer) {
            clearTimeout(this.calculateTimer);
        }
        this.calculateTimer = setTimeout(() => {
            const todayRecords = storage_1.StorageHelper.getTodayRecords();
            const healthGoals = storage_1.StorageHelper.getHealthGoals();
            if (!healthGoals) {
                // 如果没有健康目标，使用默认值
                console.log('使用默认健康目标计算统计数据');
                this.setData({
                    todayStats: {
                        waterAmount: 0,
                        waterProgress: 0,
                        calorieIntake: 0,
                        calorieProgress: 0,
                        exerciseDuration: 0,
                        exerciseProgress: 0,
                        completedTasks: 0,
                        totalTasks: 3
                    }
                });
                return;
            }
            // 计算饮水统计
            const waterAmount = todayRecords.water.reduce((sum, record) => sum + record.amount, 0);
            const waterProgress = Math.min((waterAmount / healthGoals.dailyWaterIntake) * 100, 100);
            // 计算饮食统计
            const calorieIntake = todayRecords.food.reduce((sum, record) => sum + record.calories, 0);
            const calorieProgress = Math.min((calorieIntake / healthGoals.dailyCalorieMax) * 100, 100);
            // 计算运动统计
            const exerciseDuration = todayRecords.exercise.reduce((sum, record) => sum + record.duration, 0);
            const exerciseProgress = Math.min((exerciseDuration / healthGoals.dailyExerciseDuration) * 100, 100);
            // 计算完成任务数
            let completedTasks = 0;
            if (waterProgress >= 100)
                completedTasks++;
            if (calorieIntake >= healthGoals.dailyCalorieMin && calorieIntake <= healthGoals.dailyCalorieMax)
                completedTasks++;
            if (exerciseProgress >= 100)
                completedTasks++;
            this.setData({
                todayStats: {
                    waterAmount,
                    waterProgress: Math.round(waterProgress),
                    calorieIntake,
                    calorieProgress: Math.round(calorieProgress),
                    exerciseDuration,
                    exerciseProgress: Math.round(exerciseProgress),
                    completedTasks,
                    totalTasks: 3
                }
            });
        }, 50); // 50ms节流
    },
    generateHealthAdvices() {
        const todayRecords = storage_1.StorageHelper.getTodayRecords();
        const healthGoals = storage_1.StorageHelper.getHealthGoals();
        const userProfile = storage_1.StorageHelper.getUserProfile();
        if (!healthGoals || !userProfile)
            return;
        const advices = health_calculator_1.HealthAdviceGenerator.generateRealtimeAdvice(todayRecords.water, todayRecords.food, todayRecords.exercise, healthGoals, userProfile);
        this.setData({
            healthAdvices: advices.slice(0, 2) // 只显示前2条建议
        });
    },
    // 模拟登录(开发测试)
    handleMockLogin() {
        const mockUserInfo = {
            nickName: '测试用户',
            avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
        };
        storage_1.StorageHelper.saveUserInfo(mockUserInfo);
        this.setData({
            hasUserInfo: true,
            userInfo: mockUserInfo
        });
        wx.showToast({
            title: '模拟登录成功',
            icon: 'success'
        });
        // 检查是否完善了基础信息
        const isProfileComplete = auth_1.AuthHelper.isUserProfileComplete();
        if (!isProfileComplete) {
            setTimeout(() => {
                wx.showModal({
                    title: '完善信息',
                    content: auth_1.AuthHelper.getProfileCompletePromptMessage(),
                    confirmText: '去完善',
                    success: (res) => {
                        if (res.confirm) {
                            wx.navigateTo({
                                url: '/pages/profile/profile'
                            });
                        }
                    }
                });
            }, 1500);
        }
        else {
            this.initPage();
        }
    },
    // 微信登录
    handleLogin() {
        wx.showLoading({
            title: '登录中...'
        });
        auth_1.AuthHelper.wxLogin().then(userInfo => {
            this.setData({
                hasUserInfo: true,
                userInfo
            });
            // 检查是否完善了基础信息
            const isProfileComplete = auth_1.AuthHelper.isUserProfileComplete();
            if (!isProfileComplete) {
                wx.showModal({
                    title: '完善信息',
                    content: auth_1.AuthHelper.getProfileCompletePromptMessage(),
                    confirmText: '去完善',
                    success: (res) => {
                        if (res.confirm) {
                            wx.navigateTo({
                                url: '/pages/profile/profile'
                            });
                        }
                    }
                });
            }
            else {
                this.initPage();
            }
            wx.hideLoading();
        }).catch(error => {
            wx.hideLoading();
            wx.showToast({
                title: '登录失败',
                icon: 'error'
            });
        });
    },
    // 导航到打卡页面
    navigateToWater() {
        wx.navigateTo({
            url: '/pages/water/water'
        });
    },
    navigateToFood() {
        wx.navigateTo({
            url: '/pages/food/food'
        });
    },
    navigateToExercise() {
        wx.navigateTo({
            url: '/pages/exercise/exercise'
        });
    },
    // 导航到其他页面
    navigateToData() {
        wx.switchTab({
            url: '/pages/data/data'
        });
    },
    navigateToProfile() {
        wx.switchTab({
            url: '/pages/profile/profile'
        });
    },
    // 快速记录相关数据
    quickRecord: {
        water: '',
        exercise: ''
    },
    // 防抖定时器
    waterInputTimer: null,
    exerciseInputTimer: null,
    calculateTimer: null,
    // 初始化标记
    isInitialized: false,
    // 饮水输入 - 防抖处理
    onQuickWaterInput: function (e) {
        if (this.waterInputTimer) {
            clearTimeout(this.waterInputTimer);
        }
        this.waterInputTimer = setTimeout(() => {
            this.setData({
                'quickRecord.water': e.detail.value
            });
        }, 100);
    },
    // 运动输入 - 防抖处理
    onQuickExerciseInput: function (e) {
        if (this.exerciseInputTimer) {
            clearTimeout(this.exerciseInputTimer);
        }
        this.exerciseInputTimer = setTimeout(() => {
            this.setData({
                'quickRecord.exercise': e.detail.value
            });
        }, 100);
    },
    // 快速记录饮水 - 性能优化
    quickRecordWater: function () {
        const amount = parseInt(this.data.quickRecord.water);
        if (!amount || amount <= 0) {
            wx.showToast({
                title: '请输入有效的饮水量',
                icon: 'error'
            });
            return;
        }
        // 显示loading
        wx.showLoading({
            title: '记录中...'
        });
        try {
            const today = new Date();
            const record = {
                id: Date.now(),
                amount,
                time: `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`,
                createdTime: today.toISOString()
            };
            // 保存记录
            storage_1.StorageHelper.addWaterRecord(record);
            // 批量更新数据，减少页面重绘
            this.setData({
                'quickRecord.water': '',
                'todayStats.waterAmount': this.data.todayStats.waterAmount + amount,
                'todayStats.waterProgress': Math.min(Math.round(((this.data.todayStats.waterAmount + amount) / this.data.healthGoals.dailyWaterIntake) * 100), 100)
            });
            setTimeout(() => {
                wx.hideLoading();
                wx.showToast({
                    title: '记录成功',
                    icon: 'success'
                });
            }, 200);
        }
        catch (error) {
            wx.hideLoading();
            wx.showToast({
                title: '记录失败',
                icon: 'error'
            });
        }
    },
    // 快速记录运动 - 性能优化
    quickRecordExercise: function () {
        const duration = parseInt(this.data.quickRecord.exercise);
        if (!duration || duration <= 0) {
            wx.showToast({
                title: '请输入有效的运动时长',
                icon: 'error'
            });
            return;
        }
        // 显示loading
        wx.showLoading({
            title: '记录中...'
        });
        try {
            const today = new Date();
            const record = {
                id: Date.now(),
                type: '跑步',
                duration,
                intensity: '中等',
                calories: Math.round(duration * 8), // 简单计算：每分钟消耗8卡路里
                time: `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`,
                createdTime: today.toISOString()
            };
            // 保存记录
            storage_1.StorageHelper.addExerciseRecord(record);
            // 批量更新数据，减少页面重绘
            this.setData({
                'quickRecord.exercise': '',
                'todayStats.exerciseDuration': this.data.todayStats.exerciseDuration + duration,
                'todayStats.exerciseProgress': Math.min(Math.round(((this.data.todayStats.exerciseDuration + duration) / this.data.healthGoals.dailyExerciseDuration) * 100), 100)
            });
            setTimeout(() => {
                wx.hideLoading();
                wx.showToast({
                    title: '记录成功',
                    icon: 'success'
                });
            }, 200);
        }
        catch (error) {
            wx.hideLoading();
            wx.showToast({
                title: '记录失败',
                icon: 'error'
            });
        }
    }
});
