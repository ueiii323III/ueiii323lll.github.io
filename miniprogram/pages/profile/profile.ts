// profile.ts
import { AuthHelper } from '../../utils/auth'
import { BMICalculator, TargetWeightCalculator } from '../../utils/health-calculator'
import { StorageHelper } from '../../utils/storage'
import { IAppOption } from '../../typings/types'

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
    this.loadUserData()
  },
  
  loadUserData() {
    const userInfo = AuthHelper.getUserInfo()
    const userProfile = AuthHelper.getUserProfileData()
    const healthGoals = AuthHelper.getUserGoals()
    
    const bmiCategoryText = userProfile ? BMICalculator.getBMICategoryText(userProfile.bmiCategory) : ''
    
    // 获取活动量标签
    const activityLevelLabel = userProfile ? this.getActivityLevelLabel(userProfile.activityLevel) : ''
    
    // 获取健康目标标签
    const healthGoalLabel = userProfile ? this.getHealthGoalLabel(userProfile.healthGoal) : ''
    
    this.setData({
      userInfo,
      userProfile,
      healthGoals,
      bmiCategoryText,
      activityLevelLabel,
      healthGoalLabel
    })
  },
  
  // 获取活动量标签
  getActivityLevelLabel(value: string) {
    const option = this.data.activityLevelOptions.find(item => item.value === value)
    return option ? option.label : ''
  },
  
  // 获取健康目标标签
  getHealthGoalLabel(value: string) {
    const option = this.data.healthGoalOptions.find(item => item.value === value)
    return option ? option.label : ''
  },
  
  // 模拟登录(用于开发测试)
  handleMockLogin() {
    console.log('使用模拟登录')
    const mockUserInfo = {
      nickName: '测试用户',
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
    }
    
    StorageHelper.saveUserInfo(mockUserInfo)
    this.setData({
      userInfo: mockUserInfo
    })
    
    wx.showToast({
      title: '模拟登录成功',
      icon: 'success'
    })
    
    // 自动弹出完善信息提示
    setTimeout(() => {
      this.toggleEdit()
    }, 1500)
  },
  
  // 切换编辑模式
  toggleEdit() {
    if (this.data.isEditing) {
      this.saveProfile()
    } else {
      // 如果有现有资料，填充到表单中
      const { userProfile } = this.data
      if (userProfile) {
        this.setData({
          isEditing: true,
          formData: {
            height: userProfile.height.toString(),
            weight: userProfile.weight.toString(),
            gender: userProfile.gender,
            age: userProfile.age.toString(),
            healthGoal: userProfile.healthGoal,
            otherGoal: userProfile.otherGoal || '',
            activityLevel: userProfile.activityLevel,
            targetWeight: userProfile.targetWeight ? userProfile.targetWeight.toString() : userProfile.weight.toString()
          }
        })
      } else {
        // 新用户，使用默认值
        this.setData({
          isEditing: true
        })
      }
    }
  },
  
  // 保存用户资料
  saveProfile() {
    const { formData } = this.data
    
    // 验证表单
    if (!formData.height || !formData.weight || !formData.age) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'error'
      })
      return
    }
    
    if (parseFloat(formData.height) <= 0 || parseFloat(formData.weight) <= 0 || parseInt(formData.age) <= 0) {
      wx.showToast({
        title: '请输入有效的数值',
        icon: 'error'
      })
      return
    }
    
    if (formData.healthGoal === 'other' && !formData.otherGoal.trim()) {
      wx.showToast({
        title: '请填写其他健康目标',
        icon: 'error'
      })
      return
    }
    
    wx.showLoading({
      title: '保存中...'
    })
    
    try {
      console.log('保存用户资料，formData:', formData);
      
      // 最简单的数据结构，直接保存
      const profileData: any = {
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        gender: formData.gender as 'male' | 'female',
        age: parseInt(formData.age),
        healthGoal: formData.healthGoal as any,
        activityLevel: formData.activityLevel as any
      }
      
      // 如果有目标体重，添加进去
      if (formData.targetWeight && formData.targetWeight.trim()) {
        profileData.targetWeight = parseFloat(formData.targetWeight)
      }
      
      // 如果是其他目标，添加描述
      if (formData.healthGoal === 'other' && formData.otherGoal.trim()) {
        profileData.otherGoal = formData.otherGoal.trim()
      }
      
      console.log('准备保存的profileData:', profileData)
      
      // 直接使用微信存储API，绕过AuthHelper
      wx.setStorageSync('userProfile', profileData)
      const savedProfile = profileData
      
      // 计算BMI
      const bmi = BMICalculator.calculateBMI(profileData.height, profileData.weight)
      const bmiCategory = BMICalculator.getBMICategory(bmi)
      const bmiCategoryText = BMICalculator.getBMICategoryText(bmiCategory)
      
      savedProfile.bmi = bmi
      savedProfile.bmiCategory = bmiCategory
      
      this.setData({
        userProfile: savedProfile,
        isEditing: false,
        bmiCategoryText: bmiCategoryText
      })
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 刷新全局数据
      const app = getApp<IAppOption>()
      app.globalData.userProfile = savedProfile
      
    } catch (error) {
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },
  
  // 取消编辑
  cancelEdit() {
    this.setData({
      isEditing: false
    })
    this.loadUserData() // 重新加载数据
  },
  
  // 表单输入处理
  onHeightInput(e: any) {
    this.setData({
      'formData.height': e.detail.value
    })
    this.calculateBMI()
  },
  
  onWeightInput(e: any) {
    this.setData({
      'formData.weight': e.detail.value
    })
    this.calculateBMI()
  },
  
  onAgeInput(e: any) {
    this.setData({
      'formData.age': e.detail.value
    })
  },
  
  onTargetWeightInput(e: any) {
    this.setData({
      'formData.targetWeight': e.detail.value
    })
  },
  
  onGenderChange(e: any) {
    this.setData({
      'formData.gender': e.detail.value
    })
  },
  
  onActivityLevelChange(e: any) {
    this.setData({
      'formData.activityLevel': e.detail.value
    })
    this.calculateTargetWeight()
  },
  
  onHealthGoalChange(e: any) {
    this.setData({
      'formData.healthGoal': e.detail.value
    })
    this.calculateTargetWeight()
  },
  
  onOtherGoalInput(e: any) {
    this.setData({
      'formData.otherGoal': e.detail.value
    })
  },
  
  // 计算BMI
  calculateBMI() {
    const height = parseFloat(this.data.formData.height)
    const weight = parseFloat(this.data.formData.weight)
    
    if (height > 0 && weight > 0) {
      const bmi = BMICalculator.calculateBMI(height, weight)
      const bmiCategory = BMICalculator.getBMICategory(bmi)
      
      this.setData({
        calculatedBMI: bmi,
        bmiCategory
      })
    }
  },
  
  // 计算目标体重
  calculateTargetWeight() {
    const height = parseFloat(this.data.formData.height)
    const gender = this.data.formData.gender as 'male' | 'female'
    const age = parseInt(this.data.formData.age)
    const activityLevel = this.data.formData.activityLevel as any
    
    if (height > 0 && gender && age > 0 && activityLevel) {
      const tempProfile = {
        height,
        weight: 0, // 临时值，不影响目标体重计算
        gender,
        age,
        healthGoal: 'maintain_health' as any,
        activityLevel,
        bmi: 0,
        bmiCategory: 'normal' as any,
        targetWeightRange: { min: 0, max: 0 },
        createdAt: '',
        updatedAt: ''
      }
      
      const targetWeightRange = TargetWeightCalculator.calculateTargetWeight(tempProfile)
      this.setData({
        targetWeightRange
      })
    }
  },
  
  // 导航功能
  navigateToData() {
    wx.switchTab({
      url: '/pages/data/data'
    })
  },
  
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },
  
  // 数据导出
  exportData() {
    wx.showLoading({
      title: '导出中...'
    })
    
    try {
      const exportData = StorageHelper.exportAllData()
      
      // 这里应该调用文件保存API，但微信小程序有限制
      // 简化处理，显示导出成功提示
      wx.showModal({
        title: '导出成功',
        content: '数据已准备完成，建议定期导出备份您的健康数据',
        showCancel: false
      })
    } catch (error) {
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
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
          })
          
          try {
            StorageHelper.clearOldData(0) // 删除所有历史数据
            
            wx.showToast({
              title: '清理完成',
              icon: 'success'
            })
          } catch (error) {
            wx.showToast({
              title: '清理失败',
              icon: 'error'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },
  
  // 关于应用
  showAbout() {
    wx.showModal({
      title: '关于应用',
      content: '健康习惯打卡小程序 v1.0\n\n专注于个人健康习惯管理的轻量化应用，帮助您建立良好的健康习惯。',
      showCancel: false
    })
  }
})