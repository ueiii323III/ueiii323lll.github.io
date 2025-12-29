"use strict";
// app.ts
App({
    globalData: {
        userInfo: null,
        userProfile: null,
        healthGoals: null,
        todayRecords: null
    },
    onLaunch() {
        // 初始化应用
        console.log('健康习惯打卡小程序启动');
        // 检查用户登录状态
        this.checkLoginStatus();
        // 初始化今日数据
        this.initTodayData();
        // 初始化数据同步机制
        this.initDataSync();
    },
    checkLoginStatus() {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
            this.globalData.userInfo = userInfo;
            this.loadUserProfile();
        }
    },
    loadUserProfile() {
        const userProfile = wx.getStorageSync('userProfile');
        if (userProfile) {
            this.globalData.userProfile = userProfile;
        }
        const healthGoals = wx.getStorageSync('healthGoals');
        if (healthGoals) {
            this.globalData.healthGoals = healthGoals;
        }
    },
    initTodayData() {
        const today = this.getTodayString();
        let todayRecords = wx.getStorageSync(`records_${today}`);
        if (!todayRecords) {
            todayRecords = {
                water: [],
                food: [],
                exercise: []
            };
        }
        this.globalData.todayRecords = todayRecords;
    },
    getTodayString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    saveTodayRecords() {
        const today = this.getTodayString();
        wx.setStorageSync(`records_${today}`, this.globalData.todayRecords);
    },
    // 初始化数据同步机制
    initDataSync() {
        // 添加全局数据更新时间戳
        this.globalData.lastUpdateTime = Date.now();
        
        // 定期同步健康数据（每30秒检查一次）
        setInterval(() => {
            this.syncHealthData();
        }, 30000);
    },
    // 同步健康数据
    syncHealthData() {
        try {
            const StorageHelper = require('./utils/storage').StorageHelper;
            
            // 同步用户资料数据
            const currentProfile = this.globalData.userProfile;
            const storedProfile = StorageHelper.getUserProfile();
            
            if (storedProfile && JSON.stringify(currentProfile) !== JSON.stringify(storedProfile)) {
                // 使用StorageHelper的验证和修复功能
                const validatedProfile = StorageHelper.validateAndRepairProfile(storedProfile);
                this.globalData.userProfile = validatedProfile;
                this.globalData.lastUpdateTime = Date.now();
                console.log('App: 用户资料数据已同步');
            }
            
            // 同步健康目标数据
            const storedGoals = StorageHelper.getHealthGoals();
            if (storedGoals && JSON.stringify(this.globalData.healthGoals) !== JSON.stringify(storedGoals)) {
                this.globalData.healthGoals = storedGoals;
                this.globalData.lastUpdateTime = Date.now();
                console.log('App: 健康目标数据已同步');
            }
        } catch (error) {
            console.error('数据同步失败:', error);
        }
    },
    // 手动触发数据同步
    forceSyncData() {
        this.globalData.lastUpdateTime = Date.now();
        this.syncHealthData();
    }
});
