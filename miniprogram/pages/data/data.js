"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// data.ts
const storage_1 = require("../../utils/storage");
Page({
    // 添加加载状态标记
    loadingData: false,
    data: {
        // 时间维度
        timeRange: 'week', // week, month
        startDate: '',
        endDate: '',
        // 数据统计
        weeklyStats: {
            totalWater: 0,
            totalCalories: 0,
            totalExercise: 0,
            completedDays: 0,
            totalDays: 7
        },
        monthlyStats: {
            totalWater: 0,
            totalCalories: 0,
            totalExercise: 0,
            completedDays: 0,
            totalDays: 30
        },
        // 每日数据
        dailyData: [],
        // 健康建议
        healthAdvices: [],
        // 目标信息
        healthGoals: null,
        userProfile: null,
        // 格式化后的平均值数据
        averageStats: {
            avgWater: 0,
            avgExercise: 0,
            avgCalories: 0
        },
        // 完成率
        weeklyCompletionRate: 0,
        monthlyCompletionRate: 0,
        // 今日数据统计
        todayStats: {
            waterAmount: 0,
            calorieIntake: 0,
            exerciseDuration: 0
        },
        // 时间范围显示
        todayRecords: {
            water: [],
            food: [],
            exercise: []
        }
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
            console.log('检测到数据更新，刷新数据中心数据');
            this.loadData();
            this.setData({
                lastUpdateTime: lastUpdateTime
            });
        }
        else {
            this.loadData();
        }
    },
    
    initPage() {
        // 设置时间范围
        this.setTimeRange('week');
        this.loadData();
    },
    
    // 设置时间范围
    setTimeRange(range) {
        const endDate = new Date();
        const startDate = new Date();
        if (range === 'today') {
            // 今日数据，不需要日期范围
            this.setData({
                timeRange: range,
                startDate: this.formatDate(startDate),
                endDate: this.formatDate(endDate)
            });
            return;
        }
        else if (range === 'week') {
            startDate.setDate(startDate.getDate() - 6); // 最近7天
        }
        else {
            startDate.setDate(startDate.getDate() - 29); // 最近30天
        }
        this.setData({
            timeRange: range,
            startDate: this.formatDate(startDate),
            endDate: this.formatDate(endDate)
        });
    },
    
    // 切换时间范围
    onTimeRangeChange(e) {
        const range = e.currentTarget.dataset.range;
        this.setTimeRange(range);
        this.loadData();
    },
    
    // 加载数据
    loadData() {
        // 防止频繁调用，添加节流
        if (this.loadingData) {
            console.log('数据正在加载中，跳过重复调用');
            return;
        }
        this.loadingData = true;
        try {
            const userProfile = storage_1.StorageHelper.getUserProfile();
            const healthGoals = storage_1.StorageHelper.getHealthGoals();
            
            console.log('数据中心开始加载数据 - userProfile:', userProfile);
            console.log('数据中心开始加载数据 - healthGoals:', healthGoals);
            
            // 如果没有用户资料，显示提示
            if (!userProfile) {
                console.log('用户资料不存在，显示提示信息');
                wx.showModal({
                    title: '提示',
                    content: '请先完善基础健康信息（身高、体重等），才能查看数据分析',
                    confirmText: '去完善',
                    cancelText: '取消',
                    success: (res) => {
                        if (res.confirm) {
                            wx.switchTab({
                                url: '/pages/profile/profile'
                            });
                        }
                    }
                });
                return;
            }
            
            // 设置数据到页面
            this.setData({
                userProfile: userProfile,
                healthGoals: healthGoals
            });
            
            // 计算今日数据
            this.calculateTodayStats();
            
            // 根据时间范围加载不同的数据
            if (this.data.timeRange === 'today') {
                // 今日数据：不返回，继续执行后续流程
                console.log('加载今日数据完成');
            }
            else if (this.data.timeRange === 'week') {
                this.loadWeeklyData();
            }
            else {
                this.loadMonthlyData();
            }
            
            // 延迟生成建议，避免阻塞主流程
            setTimeout(() => {
                this.generateHealthAdvices();
            }, 100);
        }
        catch (error) {
            console.error('加载数据失败:', error);
            wx.showToast({
                title: '加载失败',
                icon: 'none'
            });
        }
        finally {
            this.loadingData = false;
        }
    },
    
    // 计算今日数据
    calculateTodayStats() {
        if (!this.data.userProfile) {
            return;
        }
        const today = this.formatDate(new Date());
        const todayRecords = storage_1.StorageHelper.getRecordsByDate(today);
        
        const waterAmount = todayRecords.water.reduce((sum, record) => sum + record.amount, 0);
        const calorieIntake = todayRecords.food.reduce((sum, record) => sum + record.calories, 0);
        const exerciseDuration = todayRecords.exercise.reduce((sum, record) => sum + record.duration, 0);
        
        this.setData({
            todayStats: {
                waterAmount,
                calorieIntake,
                exerciseDuration
            },
            todayRecords: todayRecords
        });
    },
    
    // 加载周数据
    loadWeeklyData() {
        const weeklyData = storage_1.StorageHelper.getWeeklyData(this.data.startDate, this.data.endDate);
        const stats = this.calculateStats(weeklyData, 'week');
        
        this.setData({
            dailyData: weeklyData,
            weeklyStats: stats.weekly,
            averageStats: stats.average,
            weeklyCompletionRate: stats.completionRate
        });
    },
    
    // 加载月数据
    loadMonthlyData() {
        const monthlyData = storage_1.StorageHelper.getWeeklyData(this.data.startDate, this.data.endDate);
        const stats = this.calculateStats(monthlyData, 'month');
        
        this.setData({
            dailyData: monthlyData,
            monthlyStats: stats.monthly,
            averageStats: stats.average,
            monthlyCompletionRate: stats.completionRate
        });
    },
    
    // 计算统计数据
    calculateStats(dailyData, period) {
        const stats = period === 'week' ? { ...this.data.weeklyStats } : { ...this.data.monthlyStats };
        
        stats.totalWater = 0;
        stats.totalCalories = 0;
        stats.totalExercise = 0;
        stats.completedDays = 0;
        
        dailyData.forEach(day => {
            if (!day || !day.records)
                return;
            
            let dayWater = 0;
            let dayCalories = 0;
            let dayExercise = 0;
            
            if (day.records.water && day.records.water.length > 0) {
                dayWater = day.records.water.reduce((sum, record) => sum + (record.amount || 0), 0);
            }
            if (day.records.food && day.records.food.length > 0) {
                dayCalories = day.records.food.reduce((sum, record) => sum + (record.calories || 0), 0);
            }
            if (day.records.exercise && day.records.exercise.length > 0) {
                dayExercise = day.records.exercise.reduce((sum, record) => sum + (record.duration || 0), 0);
            }
            
            stats.totalWater += dayWater;
            stats.totalCalories += dayCalories;
            stats.totalExercise += dayExercise;
            
            // 简化完成判断逻辑
            const hasGoals = this.data.healthGoals;
            const hasRecords = day.records.water.length > 0 || day.records.food.length > 0 || day.records.exercise.length > 0;
            
            if (hasGoals) {
                if (dayWater >= this.data.healthGoals.dailyWaterIntake &&
                    dayExercise >= this.data.healthGoals.dailyExerciseDuration &&
                    dayCalories >= this.data.healthGoals.dailyCalorieMin &&
                    dayCalories <= this.data.healthGoals.dailyCalorieMax) {
                    stats.completedDays++;
                }
            }
            else if (hasRecords) {
                stats.completedDays++;
            }
        });
        
        // 计算平均值和完成率
        const averageStats = {
            avgWater: Math.round(stats.totalWater / dailyData.length),
            avgExercise: Math.round(stats.totalExercise / dailyData.length),
            avgCalories: Math.round(stats.totalCalories / dailyData.length)
        };
        
        const completionRate = Math.round((stats.completedDays / dailyData.length) * 100);
        
        return {
            [period]: stats,
            average: averageStats,
            completionRate
        };
    },
    
    // 生成健康建议
    generateHealthAdvices() {
        const { healthAdvices } = this.generateWeeklyAdvices();
        this.setData({
            healthAdvices
        });
    },
    
    generateWeeklyAdvices() {
        if (!this.data.userProfile || !this.data.healthGoals) {
            return { healthAdvices: [] };
        }
        
        const weekData = this.data.dailyData;
        const userProfile = this.data.userProfile;
        const healthGoals = this.data.healthGoals;
        
        const healthCalculator = require('../../utils/health-calculator');
        const { HealthAdviceGenerator } = healthCalculator;
        
        // 简化传入的数据结构
        const waterRecords = [];
        const foodRecords = [];
        const exerciseRecords = [];
        
        weekData.forEach(day => {
            if (day && day.records) {
                if (day.records.water) {
                    waterRecords.push(...day.records.water);
                }
                if (day.records.food) {
                    foodRecords.push(...day.records.food);
                }
                if (day.records.exercise) {
                    exerciseRecords.push(...day.records.exercise);
                }
            }
        });
        
        const healthAdvices = HealthAdviceGenerator.generateRealtimeAdvice(
            waterRecords,
            foodRecords,
            exerciseRecords,
            healthGoals,
            userProfile
        );
        
        return { healthAdvices };
    },
    
    // 格式化日期
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // 导出数据
    exportData() {
        try {
            const userProfile = storage_1.StorageHelper.getUserProfile();
            const healthGoals = storage_1.StorageHelper.getHealthGoals();
            const weeklyData = storage_1.StorageHelper.getWeeklyData(this.data.startDate, this.data.endDate);
            
            const exportData = {
                userProfile,
                healthGoals,
                statistics: this.data.timeRange === 'week' ? this.data.weeklyStats : this.data.monthlyStats,
                dailyData: weeklyData,
                exportTime: new Date().toISOString()
            };
            
            // 这里可以实现导出到Excel或其他格式
            wx.setClipboardData({
                data: JSON.stringify(exportData, null, 2),
                success: () => {
                    wx.showToast({
                        title: '数据已复制到剪贴板',
                        icon: 'success'
                    });
                }
            });
        } catch (error) {
            console.error('导出数据失败:', error);
            wx.showToast({
                title: '导出失败',
                icon: 'none'
            });
        }
    },
    
    // 跳转到个人资料页
    goToProfile() {
        wx.switchTab({
            url: '/pages/profile/profile'
        });
    },
    
    // 返回上一页
    handleBack() {
        wx.navigateBack();
    }
});