// settings.ts
import { StorageHelper } from '../../utils/storage'
import { ReminderSettings } from '../../../typings/types'

Page({
  data: {
    reminderSettings: null as ReminderSettings | null,
    
    // 饮水提醒
    waterEnabled: true,
    waterTimes: ['10:00', '15:00'],
    showWaterTimeModal: false,
    editingWaterIndex: -1,
    newWaterTime: '',
    
    // 饮食提醒
    foodEnabled: true,
    foodTimes: ['12:00', '19:00'],
    showFoodTimeModal: false,
    editingFoodIndex: -1,
    newFoodTime: '',
    
    // 运动提醒
    exerciseEnabled: true,
    exerciseTime: '20:00',
    showExerciseTimeModal: false,
    newExerciseTime: ''
  },
  
  onLoad() {
    this.loadSettings()
  },
  
  loadSettings() {
    const settings = StorageHelper.getReminderSettings()
    this.setData({
      reminderSettings: settings,
      waterEnabled: settings.water.enabled,
      waterTimes: [...settings.water.times],
      foodEnabled: settings.food.enabled,
      foodTimes: [...settings.food.times],
      exerciseEnabled: settings.exercise.enabled,
      exerciseTime: settings.exercise.time
    })
    
    // 设置订阅消息
    this.setupSubscriptions()
  },
  
  // 设置订阅消息
  setupSubscriptions() {
    // 请求订阅消息权限
    wx.requestSubscribeMessage({
      tmplIds: [], // 这里需要填入你的订阅消息模板ID
      success: (res) => {
        console.log('订阅消息权限:', res)
      },
      fail: (err) => {
        console.log('订阅消息权限失败:', err)
      }
    })
  },
  
  // 饮水提醒开关
  onWaterEnabledChange(e: any) {
    const enabled = e.detail.value
    this.setData({
      waterEnabled: enabled
    })
    this.saveSettings()
  },
  
  // 显示添加饮水提醒时间
  showAddWaterTime() {
    this.setData({
      showWaterTimeModal: true,
      editingWaterIndex: -1,
      newWaterTime: ''
    })
  },
  
  // 编辑饮水提醒时间
  editWaterTime(e: any) {
    const index = e.currentTarget.dataset.index
    const time = this.data.waterTimes[index]
    this.setData({
      showWaterTimeModal: true,
      editingWaterIndex: index,
      newWaterTime: time
    })
  },
  
  // 饮水时间输入
  onWaterTimeInput(e: any) {
    this.setData({
      newWaterTime: e.detail.value
    })
  },
  
  // 确认饮水时间
  confirmWaterTime() {
    const time = this.data.newWaterTime.trim()
    if (!time) {
      wx.showToast({
        title: '请输入时间',
        icon: 'error'
      })
      return
    }
    
    // 验证时间格式
    if (!/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(time)) {
      wx.showToast({
        title: '时间格式错误',
        icon: 'error'
      })
      return
    }
    
    const waterTimes = [...this.data.waterTimes]
    
    if (this.data.editingWaterIndex >= 0) {
      // 编辑现有时间
      waterTimes[this.data.editingWaterIndex] = time
    } else {
      // 添加新时间
      if (waterTimes.length >= 5) {
        wx.showToast({
          title: '最多设置5个提醒',
          icon: 'error'
        })
        return
      }
      waterTimes.push(time)
    }
    
    // 排序
    waterTimes.sort()
    
    this.setData({
      waterTimes,
      showWaterTimeModal: false
    })
    
    this.saveSettings()
  },
  
  // 取消饮水时间设置
  cancelWaterTime() {
    this.setData({
      showWaterTimeModal: false
    })
  },
  
  // 删除饮水提醒时间
  deleteWaterTime(e: any) {
    const index = e.currentTarget.dataset.index
    const waterTimes = [...this.data.waterTimes]
    waterTimes.splice(index, 1)
    
    this.setData({
      waterTimes
    })
    
    this.saveSettings()
  },
  
  // 饮食提醒开关
  onFoodEnabledChange(e: any) {
    const enabled = e.detail.value
    this.setData({
      foodEnabled: enabled
    })
    this.saveSettings()
  },
  
  // 显示添加饮食提醒时间
  showAddFoodTime() {
    this.setData({
      showFoodTimeModal: true,
      editingFoodIndex: -1,
      newFoodTime: ''
    })
  },
  
  // 编辑饮食提醒时间
  editFoodTime(e: any) {
    const index = e.currentTarget.dataset.index
    const time = this.data.foodTimes[index]
    this.setData({
      showFoodTimeModal: true,
      editingFoodIndex: index,
      newFoodTime: time
    })
  },
  
  // 饮食时间输入
  onFoodTimeInput(e: any) {
    this.setData({
      newFoodTime: e.detail.value
    })
  },
  
  // 确认饮食时间
  confirmFoodTime() {
    const time = this.data.newFoodTime.trim()
    if (!time) {
      wx.showToast({
        title: '请输入时间',
        icon: 'error'
      })
      return
    }
    
    // 验证时间格式
    if (!/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(time)) {
      wx.showToast({
        title: '时间格式错误',
        icon: 'error'
      })
      return
    }
    
    const foodTimes = [...this.data.foodTimes]
    
    if (this.data.editingFoodIndex >= 0) {
      // 编辑现有时间
      foodTimes[this.data.editingFoodIndex] = time
    } else {
      // 添加新时间
      if (foodTimes.length >= 5) {
        wx.showToast({
          title: '最多设置5个提醒',
          icon: 'error'
        })
        return
      }
      foodTimes.push(time)
    }
    
    // 排序
    foodTimes.sort()
    
    this.setData({
      foodTimes,
      showFoodTimeModal: false
    })
    
    this.saveSettings()
  },
  
  // 取消饮食时间设置
  cancelFoodTime() {
    this.setData({
      showFoodTimeModal: false
    })
  },
  
  // 删除饮食提醒时间
  deleteFoodTime(e: any) {
    const index = e.currentTarget.dataset.index
    const foodTimes = [...this.data.foodTimes]
    foodTimes.splice(index, 1)
    
    this.setData({
      foodTimes
    })
    
    this.saveSettings()
  },
  
  // 运动提醒开关
  onExerciseEnabledChange(e: any) {
    const enabled = e.detail.value
    this.setData({
      exerciseEnabled: enabled
    })
    this.saveSettings()
  },
  
  // 显示运动时间设置
  showExerciseTimeModal() {
    this.setData({
      showExerciseTimeModal: true,
      newExerciseTime: this.data.exerciseTime
    })
  },
  
  // 运动时间输入
  onExerciseTimeInput(e: any) {
    this.setData({
      newExerciseTime: e.detail.value
    })
  },
  
  // 确认运动时间
  confirmExerciseTime() {
    const time = this.data.newExerciseTime.trim()
    if (!time) {
      wx.showToast({
        title: '请输入时间',
        icon: 'error'
      })
      return
    }
    
    // 验证时间格式
    if (!/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(time)) {
      wx.showToast({
        title: '时间格式错误',
        icon: 'error'
      })
      return
    }
    
    this.setData({
      exerciseTime: time,
      showExerciseTimeModal: false
    })
    
    this.saveSettings()
  },
  
  // 取消运动时间设置
  cancelExerciseTime() {
    this.setData({
      showExerciseTimeModal: false
    })
  },
  
  // 保存设置
  saveSettings() {
    const settings: ReminderSettings = {
      water: {
        enabled: this.data.waterEnabled,
        times: this.data.waterTimes
      },
      food: {
        enabled: this.data.foodEnabled,
        times: this.data.foodTimes
      },
      exercise: {
        enabled: this.data.exerciseEnabled,
        time: this.data.exerciseTime
      }
    }
    
    StorageHelper.saveReminderSettings(settings)
    
    // 重新设置提醒
    this.setupReminders(settings)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },
  
  // 设置提醒
  setupReminders(settings: ReminderSettings) {
    // 清除所有现有提醒
    this.clearAllReminders()
    
    // 设置饮水提醒
    if (settings.water.enabled) {
      settings.water.times.forEach(time => {
        this.scheduleReminder('water', time, '该喝水了！保持充足的水分摄入')
      })
    }
    
    // 设置饮食提醒
    if (settings.food.enabled) {
      settings.food.times.forEach(time => {
        this.scheduleReminder('food', time, '该记录饮食了！记得按时吃饭')
      })
    }
    
    // 设置运动提醒
    if (settings.exercise.enabled) {
      this.scheduleReminder('exercise', settings.exercise.time, '该运动了！今天完成你的运动目标')
    }
  },
  
  // 调度单个提醒
  scheduleReminder(type: string, time: string, content: string) {
    console.log(`设置${type}提醒: ${time} - ${content}`)
  },
  
  // 清除所有提醒
  clearAllReminders() {
    console.log('清除所有提醒')
  },
  
  // 测试提醒
  testReminder(type: string) {
    let title = ''
    let content = ''
    
    switch (type) {
      case 'water':
        title = '饮水提醒测试'
        content = '这是饮水提醒的测试消息'
        break
      case 'food':
        title = '饮食提醒测试'
        content = '这是饮食提醒的测试消息'
        break
      case 'exercise':
        title = '运动提醒测试'
        content = '这是运动提醒的测试消息'
        break
    }
    
    wx.showToast({
      title: '测试提醒已发送',
      icon: 'success'
    })
    
    console.log(`测试${type}提醒: ${title} - ${content}`)
  },
  
  // 返回上一页
  goBack() {
    wx.navigateBack()
  }
})