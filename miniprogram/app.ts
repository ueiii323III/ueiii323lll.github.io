// app.ts
App<IAppOption>({
  globalData: {
    userInfo: undefined,
    userProfile: undefined,
    healthGoals: undefined,
    todayRecords: undefined
  },
  onLaunch() {
    // 初始化应用
    console.log('健康习惯打卡小程序启动')
    
    // 检查用户登录状态
    this.checkLoginStatus()
    
    // 初始化今日数据
    this.initTodayData()
  },
  
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.loadUserProfile()
    }
  },
  
  loadUserProfile() {
    const userProfile = wx.getStorageSync('userProfile')
    if (userProfile) {
      this.globalData.userProfile = userProfile
    }
    
    const healthGoals = wx.getStorageSync('healthGoals')
    if (healthGoals) {
      this.globalData.healthGoals = healthGoals
    }
  },
  
  initTodayData() {
    const today = this.getTodayString()
    let todayRecords = wx.getStorageSync(`records_${today}`)
    if (!todayRecords) {
      todayRecords = {
        water: [],
        food: [],
        exercise: []
      }
    }
    this.globalData.todayRecords = todayRecords
  },
  
  getTodayString() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  saveTodayRecords() {
    const today = this.getTodayString()
    wx.setStorageSync(`records_${today}`, this.globalData.todayRecords)
  }
})