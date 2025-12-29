// 用户认证工具类
import { UserProfile, HealthGoals } from '../../typings/types'
import { BMICalculator, TargetWeightCalculator, HealthGoalsCalculator } from './health-calculator'
import { StorageHelper } from './storage'

export class AuthHelper {
  // 微信登录
  static wxLogin(): Promise<any> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 获取用户信息
            AuthHelper.getUserProfile().then(userInfo => {
              StorageHelper.saveUserInfo(userInfo)
              resolve(userInfo)
            }).catch(reject)
          } else {
            reject(new Error('登录失败'))
          }
        },
        fail: reject
      })
    })
  }
  
  // 获取用户信息
  static getUserProfile(): Promise<any> {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('getUserProfile success:', res)
          resolve(res.userInfo)
        },
        fail: (err) => {
          console.log('getUserProfile fail:', err)
          
          // 在开发者工具中，提供一个模拟的用户信息
          const systemInfo = wx.getSystemInfoSync()
          if (systemInfo.platform === 'devtools' || err.errMsg.includes('getUserProfile:fail can only be invoked by user')) {
            const mockUserInfo = {
              nickName: '测试用户',
              avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
            }
            console.log('使用模拟用户信息:', mockUserInfo)
            resolve(mockUserInfo)
          } else {
            reject(err)
          }
        }
      })
    })
  }
  
  // 获取用户信息
  static getUserInfo(): any {
    return StorageHelper.getUserInfo()
  }
  
  // 获取用户资料
  static getUserProfileData(): UserProfile | null {
    return StorageHelper.getUserProfile()
  }
  
  // 获取健康目标
  static getUserGoals(): HealthGoals | null {
    return StorageHelper.getHealthGoals()
  }
  
  // 检查登录状态
  static checkLoginStatus(): boolean {
    const userInfo = StorageHelper.getUserInfo()
    return !!userInfo
  }
  
  // 退出登录
  static logout(): void {
    wx.removeStorageSync('userInfo')
    // 保留用户健康数据，只清除登录状态
  }
  
  // 保存用户基础信息
  static saveUserProfile(profileData: Partial<UserProfile>): UserProfile {
    const existingProfile = StorageHelper.getUserProfile()
    
    // 计算BMI
    const bmi = BMICalculator.calculateBMI(profileData.height!, profileData.weight!)
    const bmiCategory = BMICalculator.getBMICategory(bmi)
    
    // 计算目标体重范围
    const tempProfile: UserProfile = {
      height: profileData.height!,
      weight: profileData.weight!,
      gender: profileData.gender!,
      age: profileData.age!,
      healthGoal: profileData.healthGoal!,
      activityLevel: profileData.activityLevel!,
      bmi,
      bmiCategory,
      targetWeightRange: { min: 0, max: 0 },
      createdAt: (existingProfile && existingProfile.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const targetWeightRange = TargetWeightCalculator.calculateTargetWeight(tempProfile)
    
    const profile: UserProfile = {
      ...tempProfile,
      targetWeightRange,
      ...(profileData.otherGoal && { otherGoal: profileData.otherGoal })
    }
    
    StorageHelper.saveUserProfile(profile)
    return profile
  }
  
  // 生成健康目标
  static generateHealthGoals(profile: UserProfile): HealthGoals {
    const goals = HealthGoalsCalculator.generateHealthGoals(profile)
    StorageHelper.saveHealthGoals(goals)
    return goals
  }
  
  // 更新用户目标
  static updateHealthGoals(updates: Partial<HealthGoals>): HealthGoals {
    const existingGoals = StorageHelper.getHealthGoals()
    const updatedGoals: HealthGoals = {
      ...existingGoals!,
      ...updates
    }
    StorageHelper.saveHealthGoals(updatedGoals)
    return updatedGoals
  }
  
  // 获取用户完整信息
  static getUserCompleteInfo(): {
    userInfo: any
    userProfile: UserProfile | null
    healthGoals: HealthGoals | null
  } {
    return {
      userInfo: StorageHelper.getUserInfo(),
      userProfile: StorageHelper.getUserProfile(),
      healthGoals: StorageHelper.getHealthGoals()
    }
  }
  
  // 检查用户是否完善基础信息
  static isUserProfileComplete(): boolean {
    const profile = StorageHelper.getUserProfile()
    if (!profile) return false
    
    const requiredFields = ['height', 'weight', 'gender', 'age', 'healthGoal', 'activityLevel']
    return requiredFields.every(field => profile[field as keyof UserProfile] !== undefined && profile[field as keyof UserProfile] !== null)
  }
  
  // 获取用户登录提示文案
  static getLoginPromptMessage(): string {
    return '为了更好地为您提供个性化健康管理服务，请授权微信登录'
  }
  
  // 获取完善信息提示文案
  static getProfileCompletePromptMessage(): string {
    return '请完善您的基础健康信息，我们将为您生成个性化的健康目标和建议'
  }
}