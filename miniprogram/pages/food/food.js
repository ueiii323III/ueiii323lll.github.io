"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// food.ts
const storage_1 = require("../../utils/storage");
const health_calculator_1 = require("../../utils/health-calculator");
Page({
    data: {
        todayRecords: [],
        totalCalories: 0,
        targetMinCalories: 0,
        targetMaxCalories: 0,
        progress: 0,
        // 表单数据
        mealType: 'breakfast',
        foodName: '',
        amount: '',
        unit: 'g',
        photo: '',
        // 选项数据
        mealTypes: [
            { value: 'breakfast', label: '早餐', icon: '🌅' },
            { value: 'lunch', label: '午餐', icon: '☀️' },
            { value: 'dinner', label: '晚餐', icon: '🌙' },
            { value: 'snack', label: '加餐', icon: '🍎' }
        ],
        units: ['g', 'ml', '份', '碗', '个', '片'],
        // 食物联想
        foodSuggestions: [],
        showSuggestions: false,
        // 时间选择
        selectedTime: '',
        // 删除相关
        recordToDelete: null,
        showDeleteConfirm: false,
        // 计算结果
        calculatedCalories: 0,
        showCalculatedResult: false
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
                targetMinCalories: healthGoals.dailyCalorieMin,
                targetMaxCalories: healthGoals.dailyCalorieMax
            });
        }
        // 设置当前时间
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        this.setData({
            selectedTime: `${hours}:${minutes}`
        });
        this.loadTodayRecords();
    },
    loadTodayRecords() {
        const todayRecords = storage_1.StorageHelper.getTodayRecords();
        const foodRecords = todayRecords.food || [];
        // 按时间排序（最新的在前）
        const sortedRecords = foodRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const totalCalories = foodRecords.reduce((sum, record) => sum + record.calories, 0);
        // 计算进度（基于最大目标值）
        const progress = this.data.targetMaxCalories > 0 ?
            Math.min((totalCalories / this.data.targetMaxCalories) * 100, 100) : 0;
        this.setData({
            todayRecords: sortedRecords,
            totalCalories,
            progress: Math.round(progress)
        });
    },
    // 餐次选择
    onMealTypeChange(e) {
        this.setData({
            mealType: e.detail.value
        });
    },
    // 食物名称输入
    onFoodNameInput(e) {
        const value = e.detail.value;
        this.setData({
            foodName: value
        });
        // 获取食物建议
        if (value.length > 0) {
            const suggestions = health_calculator_1.FoodCalorieCalculator.getFoodSuggestion(value);
            this.setData({
                foodSuggestions: suggestions.slice(0, 5), // 最多显示5个建议
                showSuggestions: suggestions.length > 0
            });
        }
        else {
            this.setData({
                foodSuggestions: [],
                showSuggestions: false
            });
        }
        // 如果有食物名称和数量，自动计算热量
        this.calculateCalories();
    },
    // 选择食物建议
    selectFoodSuggestion(e) {
        const foodName = e.currentTarget.dataset.food;
        this.setData({
            foodName,
            foodSuggestions: [],
            showSuggestions: false
        });
        this.calculateCalories();
    },
    // 数量输入
    onAmountInput(e) {
        this.setData({
            amount: e.detail.value
        });
        this.calculateCalories();
    },
    // 单位选择
    onUnitChange(e) {
        this.setData({
            unit: e.detail.value
        });
        this.calculateCalories();
    },
    // 计算热量
    calculateCalories() {
        const foodName = this.data.foodName.trim();
        const amount = parseFloat(this.data.amount);
        if (foodName && amount && amount > 0) {
            const calories = health_calculator_1.FoodCalorieCalculator.calculateCalories(foodName, amount, this.data.unit);
            this.setData({
                calculatedCalories: calories,
                showCalculatedResult: true
            });
        }
        else {
            this.setData({
                calculatedCalories: 0,
                showCalculatedResult: false
            });
        }
    },
    // 时间选择
    onTimeChange(e) {
        this.setData({
            selectedTime: e.detail.value
        });
    },
    // 拍照或选择图片
    chooseImage() {
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                this.setData({
                    photo: res.tempFilePaths[0]
                });
            }
        });
    },
    // 添加饮食记录
    addFoodRecord() {
        const foodName = this.data.foodName.trim();
        const amount = parseFloat(this.data.amount);
        if (!foodName) {
            wx.showToast({
                title: '请输入食物名称',
                icon: 'error'
            });
            return;
        }
        if (!amount || amount <= 0) {
            wx.showToast({
                title: '请输入有效的摄入量',
                icon: 'error'
            });
            return;
        }
        if (amount > 10000) {
            wx.showToast({
                title: '摄入量过大，请检查',
                icon: 'error'
            });
            return;
        }
        // 创建记录
        const record = {
            id: Date.now().toString(),
            mealType: this.data.mealType,
            foodName,
            amount,
            unit: this.data.unit,
            calories: this.data.calculatedCalories ||
                health_calculator_1.FoodCalorieCalculator.calculateCalories(foodName, amount, this.data.unit),
            photo: this.data.photo,
            time: this.data.selectedTime,
            createdAt: new Date().toISOString()
        };
        // 保存记录
        const todayRecords = storage_1.StorageHelper.getTodayRecords();
        todayRecords.food.push(record);
        storage_1.StorageHelper.saveTodayRecords(todayRecords);
        // 通知其他页面数据已更新
        this.notifyDataUpdate();
        // 刷新数据
        this.loadTodayRecords();
        // 清空表单
        this.setData({
            foodName: '',
            amount: '',
            unit: 'g',
            photo: '',
            calculatedCalories: 0,
            showCalculatedResult: false,
            foodSuggestions: [],
            showSuggestions: false
        });
        // 显示成功提示
        wx.showToast({
            title: '记录成功',
            icon: 'success'
        });
        // 震动反馈
        wx.vibrateShort();
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
        const index = todayRecords.food.findIndex(record => record.id === recordToDelete.id);
        if (index > -1) {
            todayRecords.food.splice(index, 1);
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
    // 获取餐次显示文本
    getMealTypeText(mealType) {
        const typeMap = {
            'breakfast': '早餐',
            'lunch': '午餐',
            'dinner': '晚餐',
            'snack': '加餐'
        };
        return typeMap[mealType] || '其他';
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
        console.log('饮食数据已更新，通知其他页面刷新');
    },
    // 格式化时间
    formatDateTime(dateString) {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}-${day} ${hours}:${minutes}`;
    }
});
