// 本地存储工具类
import { UserProfile, HealthGoals, TodayRecords, HealthAdvice, ReminderSettings } from '../../typings/types'

export class StorageHelper {
  // 用户相关数据
  static saveUserInfo(userInfo: any): void {
    wx.setStorageSync('userInfo', userInfo)
  }
  
  static getUserInfo(): any {
    return wx.getStorageSync('userInfo')
  }
  
  static saveUserProfile(profile: UserProfile): void {
    // 在保存前验证和修复数据完整性
    const validatedProfile = this.validateAndRepairProfile(profile)
    wx.setStorageSync('userProfile', validatedProfile)
  }
  
  static getUserProfile(): UserProfile | null {
    return wx.getStorageSync('userProfile')
  }
  
  static saveHealthGoals(goals: HealthGoals): void {
    wx.setStorageSync('healthGoals', goals)
  }
  
  static getHealthGoals(): HealthGoals | null {
    return wx.getStorageSync('healthGoals')
  }
  
  // 今日记录相关
  static getTodayRecords(): TodayRecords {
    const today = this.getTodayString()
    let records = wx.getStorageSync(`records_${today}`)
    if (!records) {
      records = {
        water: [],
        food: [],
        exercise: []
      }
    }
    return records
  }
  
  static saveTodayRecords(records: TodayRecords): void {
    const today = this.getTodayString()
    wx.setStorageSync(`records_${today}`, records)
  }

  // 添加饮水记录
  static addWaterRecord(record: any): void {
    const todayRecords = this.getTodayRecords()
    todayRecords.water.push(record)
    this.saveTodayRecords(todayRecords)
  }

  // 添加饮食记录
  static addFoodRecord(record: any): void {
    const todayRecords = this.getTodayRecords()
    todayRecords.food.push(record)
    this.saveTodayRecords(todayRecords)
  }

  // 添加运动记录
  static addExerciseRecord(record: any): void {
    const todayRecords = this.getTodayRecords()
    todayRecords.exercise.push(record)
    this.saveTodayRecords(todayRecords)
  }
  
  // 历史记录相关
  static getRecordsByDate(date: string): TodayRecords | null {
    return wx.getStorageSync(`records_${date}`) || null
  }
  
  static getRecordsByDateRange(startDate: string, endDate: string): { date: string; records: TodayRecords }[] {
    const result: { date: string; records: TodayRecords }[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // 避免在循环中修改原对象，创建新的日期副本
    const current = new Date(start)
    
    while (current <= end) {
      const dateStr = this.formatDate(new Date(current))
      const records = this.getRecordsByDate(dateStr)
      if (records && (records.water.length > 0 || records.food.length > 0 || records.exercise.length > 0)) {
        result.push({ date: dateStr, records })
      }
      
      // 安全地增加一天
      current.setDate(current.getDate() + 1)
    }
    
    return result
  }
  
  // 健康建议相关
  static saveHealthAdvices(advices: HealthAdvice[]): void {
    wx.setStorageSync('healthAdvices', advices)
  }
  
  static getHealthAdvices(): HealthAdvice[] {
    return wx.getStorageSync('healthAdvices') || []
  }
  
  // 提醒设置相关
  static saveReminderSettings(settings: ReminderSettings): void {
    wx.setStorageSync('reminderSettings', settings)
  }
  
  static getReminderSettings(): ReminderSettings {
    const defaultSettings: ReminderSettings = {
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
    }
    return wx.getStorageSync('reminderSettings') || defaultSettings
  }
  
  // 数据清理相关
  static clearAllData(): void {
    wx.clearStorageSync()
  }
  
  static clearOldData(daysToKeep: number = 30): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffDateStr = this.formatDate(cutoffDate)
    
    // 获取所有存储键
    const storageInfo = wx.getStorageInfoSync()
    const keys = storageInfo.keys
    
    keys.forEach(key => {
      if (key.startsWith('records_')) {
        const date = key.replace('records_', '')
        if (date < cutoffDateStr) {
          wx.removeStorageSync(key)
        }
      }
    })
  }
  
  // 数据导出相关
  static exportAllData(): any {
    const userProfile = this.getUserProfile()
    const healthGoals = this.getHealthGoals()
    const healthAdvices = this.getHealthAdvices()
    
    // 获取最近30天的记录
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const records = this.getRecordsByDateRange(
      this.formatDate(startDate),
      this.formatDate(endDate)
    )
    
    return {
      userProfile,
      healthGoals,
      records,
      healthAdvices,
      exportDate: new Date().toISOString()
    }
  }
  
  // 工具方法
  static getTodayString(): string {
    return this.formatDate(new Date())
  }
  
  static formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  static formatDateTime(date: Date): string {
    const dateStr = this.formatDate(date)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${dateStr} ${hours}:${minutes}`
  }
  
  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  // 验证和修复用户资料数据
  static validateAndRepairProfile(profile: UserProfile): UserProfile {
    const healthCalculator = require('./health-calculator')
    const { BMICalculator, TargetWeightCalculator } = healthCalculator
    
    let needsUpdate = false
    const repairedProfile = { ...profile }
    
    // 验证和修复BMI
    if (repairedProfile.height && repairedProfile.weight) {
      const correctBMI = BMICalculator.calculateBMI(repairedProfile.height, repairedProfile.weight)
      const correctBMICategory = BMICalculator.getBMICategory(correctBMI)
      
      if (!repairedProfile.bmi || repairedProfile.bmi !== correctBMI) {
        repairedProfile.bmi = correctBMI
        repairedProfile.bmiCategory = correctBMICategory
        needsUpdate = true
        console.log('StorageHelper: 修复BMI数据', correctBMI, correctBMICategory)
      }
    }
    
    // 验证和修复目标体重范围
    if (repairedProfile.height) {
      const correctTargetWeightRange = TargetWeightCalculator.calculateTargetWeight(repairedProfile)
      
      if (!repairedProfile.targetWeightRange || 
          repairedProfile.targetWeightRange.min !== correctTargetWeightRange.min ||
          repairedProfile.targetWeightRange.max !== correctTargetWeightRange.max) {
        repairedProfile.targetWeightRange = correctTargetWeightRange
        needsUpdate = true
        console.log('StorageHelper: 修复目标体重范围', correctTargetWeightRange)
      }
    }
    
    // 确保时间戳存在
    if (!repairedProfile.updatedAt) {
      repairedProfile.updatedAt = new Date().toISOString()
      needsUpdate = true
    }
    
    if (needsUpdate) {
      console.log('StorageHelper: 用户资料数据已修复', repairedProfile)
    }
    
    return repairedProfile
  }

  // 强制同步所有页面的健康数据
  static syncHealthDataAcrossPages(): void {
    const profile = this.getUserProfile()
    if (profile) {
      const syncedProfile = this.validateAndRepairProfile(profile)
      if (JSON.stringify(profile) !== JSON.stringify(syncedProfile)) {
        this.saveUserProfile(syncedProfile)
        console.log('StorageHelper: 跨页面数据同步完成')
      }
    }
  }
}