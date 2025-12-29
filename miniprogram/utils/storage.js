"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageHelper = void 0;
class StorageHelper {
    // 用户相关数据
    static saveUserInfo(userInfo) {
        wx.setStorageSync('userInfo', userInfo);
    }
    static getUserInfo() {
        return wx.getStorageSync('userInfo');
    }
    static saveUserProfile(profile) {
        wx.setStorageSync('userProfile', profile);
    }
    static getUserProfile() {
        return wx.getStorageSync('userProfile');
    }
    static saveHealthGoals(goals) {
        wx.setStorageSync('healthGoals', goals);
    }
    static getHealthGoals() {
        return wx.getStorageSync('healthGoals');
    }
    // 今日记录相关
    static getTodayRecords() {
        const today = this.getTodayString();
        let records = wx.getStorageSync(`records_${today}`);
        if (!records) {
            records = {
                water: [],
                food: [],
                exercise: []
            };
        }
        return records;
    }
    static saveTodayRecords(records) {
        const today = this.getTodayString();
        wx.setStorageSync(`records_${today}`, records);
    }
    // 添加饮水记录
    static addWaterRecord(record) {
        const todayRecords = this.getTodayRecords();
        todayRecords.water.push(record);
        this.saveTodayRecords(todayRecords);
    }
    // 添加饮食记录
    static addFoodRecord(record) {
        const todayRecords = this.getTodayRecords();
        todayRecords.food.push(record);
        this.saveTodayRecords(todayRecords);
    }
    // 添加运动记录
    static addExerciseRecord(record) {
        const todayRecords = this.getTodayRecords();
        todayRecords.exercise.push(record);
        this.saveTodayRecords(todayRecords);
    }
    // 历史记录相关
    static getRecordsByDate(date) {
        return wx.getStorageSync(`records_${date}`) || null;
    }
    static getRecordsByDateRange(startDate, endDate) {
        const result = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        // 避免在循环中修改原对象，创建新的日期副本
        const current = new Date(start);
        while (current <= end) {
            const dateStr = this.formatDate(new Date(current));
            const records = this.getRecordsByDate(dateStr);
            if (records && (records.water.length > 0 || records.food.length > 0 || records.exercise.length > 0)) {
                result.push({ date: dateStr, records });
            }
            // 安全地增加一天
            current.setDate(current.getDate() + 1);
        }
        return result;
    }
    // 健康建议相关
    static saveHealthAdvices(advices) {
        wx.setStorageSync('healthAdvices', advices);
    }
    static getHealthAdvices() {
        return wx.getStorageSync('healthAdvices') || [];
    }
    // 提醒设置相关
    static saveReminderSettings(settings) {
        wx.setStorageSync('reminderSettings', settings);
    }
    static getReminderSettings() {
        const defaultSettings = {
            water: {
                enabled: true,
                times: ['10:00', '15:00']
            },
            food: {
                enabled: true,
                times: ['12:00', '19:00']
            },
            exercise: {
                enabled: true,
                time: '20:00'
            }
        };
        return wx.getStorageSync('reminderSettings') || defaultSettings;
    }
    // 数据清理相关
    static clearAllData() {
        wx.clearStorageSync();
    }
    static clearOldData(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffDateStr = this.formatDate(cutoffDate);
        // 获取所有存储键
        const storageInfo = wx.getStorageInfoSync();
        const keys = storageInfo.keys;
        keys.forEach(key => {
            if (key.startsWith('records_')) {
                const date = key.replace('records_', '');
                if (date < cutoffDateStr) {
                    wx.removeStorageSync(key);
                }
            }
        });
    }
    // 数据导出相关
    static exportAllData() {
        const userProfile = this.getUserProfile();
        const healthGoals = this.getHealthGoals();
        const healthAdvices = this.getHealthAdvices();
        // 获取最近30天的记录
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const records = this.getRecordsByDateRange(this.formatDate(startDate), this.formatDate(endDate));
        return {
            userProfile,
            healthGoals,
            records,
            healthAdvices,
            exportDate: new Date().toISOString()
        };
    }
    // 工具方法
    static getTodayString() {
        return this.formatDate(new Date());
    }
    static formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    static formatDateTime(date) {
        const dateStr = this.formatDate(date);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${dateStr} ${hours}:${minutes}`;
    }
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
}
exports.StorageHelper = StorageHelper;
