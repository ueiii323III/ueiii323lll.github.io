"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// water.ts
const storage_1 = require("../../utils/storage");
Page({
    data: {
        todayRecords: [],
        totalAmount: 0,
        targetAmount: 0,
        progress: 0,
        quickAmounts: [200, 300, 500, 1000],
        customAmount: '',
        selectedTime: '',
        showTimePicker: false,
        currentTime: '',
        recordToDelete: null,
        showDeleteConfirm: false
    },
    onLoad() {
        this.initPage();
    },
    onShow() {
        this.loadTodayRecords();
    },
    initPage() {
        // 获取健康目标
        const healthGoals = storage_1.StorageHelper.getHealthGoals();
        if (healthGoals) {
            this.setData({
                targetAmount: healthGoals.dailyWaterIntake
            });
        }
        // 设置当前时间
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        this.setData({
            currentTime: `${hours}:${minutes}`,
            selectedTime: `${hours}:${minutes}`
        });
        this.loadTodayRecords();
    },
    loadTodayRecords() {
        const todayRecords = storage_1.StorageHelper.getTodayRecords();
        const waterRecords = todayRecords.water || [];
        // 按时间排序（最新的在前）
        const sortedRecords = waterRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const totalAmount = waterRecords.reduce((sum, record) => sum + record.amount, 0);
        const progress = this.data.targetAmount > 0 ? Math.min((totalAmount / this.data.targetAmount) * 100, 100) : 0;
        this.setData({
            todayRecords: sortedRecords,
            totalAmount,
            progress: Math.round(progress)
        });
    },
    // 快捷选择饮水量
    selectQuickAmount(e) {
        const amount = e.currentTarget.dataset.amount;
        this.setData({
            customAmount: amount.toString()
        });
    },
    // 自定义饮水量输入
    onCustomAmountInput(e) {
        this.setData({
            customAmount: e.detail.value
        });
    },
    // 显示时间选择器
    showTimeSelector() {
        this.setData({
            showTimePicker: true
        });
    },
    // 隐藏时间选择器
    hideTimeSelector() {
        this.setData({
            showTimePicker: false
        });
    },
    // 时间选择器变化
    onTimeChange(e) {
        this.setData({
            selectedTime: e.detail.value
        });
    },
    // 添加饮水记录
    addWaterRecord() {
        const amount = parseFloat(this.data.customAmount);
        if (!amount || amount <= 0) {
            wx.showToast({
                title: '请输入有效的饮水量',
                icon: 'error'
            });
            return;
        }
        if (amount > 5000) {
            wx.showToast({
                title: '饮水量过大，请检查',
                icon: 'error'
            });
            return;
        }
        // 创建记录
        const record = {
            id: Date.now().toString(),
            amount,
            time: this.data.selectedTime,
            createdAt: new Date().toISOString()
        };
        // 保存记录
        const todayRecords = storage_1.StorageHelper.getTodayRecords();
        todayRecords.water.push(record);
        storage_1.StorageHelper.saveTodayRecords(todayRecords);
        // 通知数据更新
        this.notifyDataUpdate();
        // 刷新数据
        this.loadTodayRecords();
        // 清空输入
        this.setData({
            customAmount: ''
        });
        // 显示成功提示
        wx.showToast({
            title: '记录成功',
            icon: 'success'
        });
        // 震动反馈
        wx.vibrateShort();
    },
    // 通知数据更新
    notifyDataUpdate() {
        // 更新全局数据
        const app = getApp();
        if (app && app.globalData) {
            app.globalData.todayRecords = storage_1.StorageHelper.getTodayRecords();
        }
        // 使用简单的全局变量作为通知机制
        getApp().globalData.lastUpdateTime = Date.now();
        console.log('饮水数据已更新，通知其他页面刷新');
    },
    // 显示删除确认
    showDeleteConfirm(e) {
        const record = e.currentTarget.dataset.record;
        this.setData({
            recordToDelete: record,
            showDeleteConfirm: true
        });
    },
    // 隐藏删除确认
    hideDeleteConfirm() {
        this.setData({
            recordToDelete: null,
            showDeleteConfirm: false
        });
    },
    // 确认删除记录
    confirmDelete() {
        if (!this.data.recordToDelete)
            return;
        const recordToDelete = this.data.recordToDelete;
        const todayRecords = storage_1.StorageHelper.getTodayRecords();
        // 找到并删除记录
        const index = todayRecords.water.findIndex(record => record.id === recordToDelete.id);
        if (index > -1) {
            todayRecords.water.splice(index, 1);
            storage_1.StorageHelper.saveTodayRecords(todayRecords);
            // 通知数据更新
            this.notifyDataUpdate();
            // 刷新数据
            this.loadTodayRecords();
            wx.showToast({
                title: '删除成功',
                icon: 'success'
            });
        }
        this.hideDeleteConfirm();
    },
    // 返回首页
    goBack() {
        wx.navigateBack();
    },
    // 格式化时间显示
    formatTime(time) {
        return time.substring(0, 5); // 只显示时:分
    },
    // 格式化日期显示
    formatDateTime(dateString) {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}-${day} ${hours}:${minutes}`;
    }
});
