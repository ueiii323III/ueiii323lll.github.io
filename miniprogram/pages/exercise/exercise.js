"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exercise.ts
const storage_1 = require("../../utils/storage");
const health_calculator_1 = require("../../utils/health-calculator");
Page({
    data: {
        todayRecords: [],
        totalDuration: 0,
        totalCalories: 0,
        targetDuration: 0,
        durationProgress: 0,
        // 表单数据
        exerciseType: '',
        duration: '',
        intensity: 'medium',
        photo: '',
        // 选项数据
        exerciseTypes: [],
        intensityOptions: [
            { value: 'low', label: '低强度', desc: '轻松运动，微微出汗' },
            { value: 'medium', label: '中强度', desc: '中等强度，明显出汗' },
            { value: 'high', label: '高强度', desc: '剧烈运动，大量出汗' }
        ],
        // 时间选择
        selectedTime: '',
        // 删除相关
        recordToDelete: null,
        showDeleteConfirm: false,
        // 计算结果
        calculatedCalories: 0,
        showCalculatedResult: false,
        // 用户体重（用于计算热量）
        userWeight: 70 // 默认值
    },
    onLoad() {
        this.initPage();
    },
    onShow() {
        this.loadTodayRecords();
    },
    initPage() {
        // 获取健康目标和用户信息
        const healthGoals = storage_1.StorageHelper.getHealthGoals();
        const userProfile = storage_1.StorageHelper.getUserProfile();
        if (healthGoals) {
            this.setData({
                targetDuration: healthGoals.dailyExerciseDuration
            });
        }
        if (userProfile) {
            this.setData({
                userWeight: userProfile.weight
            });
        }
        // 获取运动类型列表
        const exerciseTypes = health_calculator_1.ExerciseCalorieCalculator.getExerciseList();
        this.setData({
            exerciseTypes
        });
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
        const exerciseRecords = todayRecords.exercise || [];
        // 按时间排序（最新的在前）
        const sortedRecords = exerciseRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const totalDuration = exerciseRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
        const totalCalories = exerciseRecords.reduce((sum, record) => sum + (record.calories || 0), 0);
        console.log('运动数据统计:', {
            recordCount: exerciseRecords.length,
            records: exerciseRecords,
            totalDuration,
            totalCalories
        });
        // 计算进度
        const progress = this.data.targetDuration > 0 ?
            Math.min((totalDuration / this.data.targetDuration) * 100, 100) : 0;
        this.setData({
            todayRecords: sortedRecords,
            totalDuration,
            totalCalories,
            durationProgress: Math.round(progress)
        });
    },
    // 运动类型选择
    onExerciseTypeChange(e) {
        this.setData({
            exerciseType: e.detail.value
        });
        this.calculateCalories();
    },
    // 运动时长输入
    onDurationInput(e) {
        this.setData({
            duration: e.detail.value
        });
        this.calculateCalories();
    },
    // 强度选择
    onIntensityChange(e) {
        this.setData({
            intensity: e.detail.value
        });
        this.calculateCalories();
    },
    // 计算消耗热量
    calculateCalories() {
        const exerciseType = this.data.exerciseType;
        const duration = parseFloat(this.data.duration);
        const userWeight = this.data.userWeight || 70; // 使用默认体重作为备用
        if (exerciseType && duration && duration > 0) {
            const calories = health_calculator_1.ExerciseCalorieCalculator.calculateCalories(exerciseType, duration, this.data.intensity, userWeight);
            console.log('表单热量计算:', {
                exerciseType,
                duration,
                intensity: this.data.intensity,
                userWeight,
                calculatedCalories: calories
            });
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
    // 添加运动记录
    addExerciseRecord() {
        const exerciseType = this.data.exerciseType;
        const duration = parseFloat(this.data.duration);
        if (!exerciseType) {
            wx.showToast({
                title: '请选择运动类型',
                icon: 'error'
            });
            return;
        }
        if (!duration || duration <= 0) {
            wx.showToast({
                title: '请输入有效的运动时长',
                icon: 'error'
            });
            return;
        }
        if (duration > 300) { // 5小时限制
            wx.showToast({
                title: '运动时长过长，请检查',
                icon: 'error'
            });
            return;
        }
        // 计算热量消耗
        const weight = this.data.userWeight || 70; // 使用默认体重作为备用
        const calculatedCalories = health_calculator_1.ExerciseCalorieCalculator.calculateCalories(exerciseType, duration, this.data.intensity, weight);
        console.log('运动记录创建时的热量计算:', {
            exerciseType,
            duration,
            intensity: this.data.intensity,
            weight,
            calculatedCalories
        });
        // 创建记录
        const record = {
            id: Date.now().toString(),
            exerciseType,
            duration,
            intensity: this.data.intensity,
            calories: calculatedCalories,
            photo: this.data.photo,
            time: this.data.selectedTime,
            createdAt: new Date().toISOString()
        };
        // 保存记录
        const todayRecords = storage_1.StorageHelper.getTodayRecords();
        todayRecords.exercise.push(record);
        storage_1.StorageHelper.saveTodayRecords(todayRecords);
        // 通知数据更新
        this.notifyDataUpdate();
        // 刷新数据
        this.loadTodayRecords();
        // 清空表单
        this.setData({
            exerciseType: '',
            duration: '',
            intensity: 'medium',
            photo: '',
            calculatedCalories: 0,
            showCalculatedResult: false
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
        const index = todayRecords.exercise.findIndex(record => record.id === recordToDelete.id);
        if (index > -1) {
            todayRecords.exercise.splice(index, 1);
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
    // 获取强度显示文本
    getIntensityText(intensity) {
        const intensityMap = {
            'low': '低强度',
            'medium': '中强度',
            'high': '高强度'
        };
        return intensityMap[intensity] || '未知';
    },
    // 格式化时间
    formatDateTime(dateString) {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}-${day} ${hours}:${minutes}`;
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
        console.log('运动数据已更新，通知其他页面刷新');
    }
});
