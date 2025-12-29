// 微信小程序类型定义
export interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    userProfile?: UserProfile;
    healthGoals?: HealthGoals;
    todayRecords?: TodayRecords;
    lastUpdateTime?: number;
  }
  
  checkLoginStatus(): void
  loadUserProfile(): void
  initTodayData(): void
  getTodayString(): string
  saveTodayRecords(): void
}

// 用户基础信息
export interface UserProfile {
  height: number      // 身高(cm)
  weight: number      // 体重(kg)
  gender: 'male' | 'female'  // 性别
  age: number         // 年龄
  healthGoal: 'weight_loss' | 'muscle_gain' | 'maintain_health' | 'other'  // 健康目标
  otherGoal?: string  // 其他目标描述
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high'  // 活动量
  bmi: number         // BMI值
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese'  // BMI分类
  targetWeightRange: {
    min: number
    max: number
  }
  createdAt: string
  updatedAt: string
}

// 健康目标
export interface HealthGoals {
  dailyWaterIntake: number        // 每日饮水量(ml)
  dailyCalorieMin: number        // 每日最小热量摄入(kcal)
  dailyCalorieMax: number        // 每日最大热量摄入(kcal)
  dailyExerciseDuration: number  // 每日运动时长(分钟)
  weeklyExerciseFrequency: number // 每周运动次数
  targetWeight: number            // 目标体重(kg)
  targetDate?: string            // 目标达成日期
}

// 今日记录
export interface TodayRecords {
  water: WaterRecord[]
  food: FoodRecord[]
  exercise: ExerciseRecord[]
}

// 饮水记录
export interface WaterRecord {
  id: string
  amount: number     // 饮水量(ml)
  time: string       // 记录时间
  createdAt: string
}

// 饮食记录
export interface FoodRecord {
  id: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'  // 餐次
  foodName: string   // 食物名称
  amount: number      // 摄入量
  unit: string        // 单位(g/份/碗等)
  calories: number    // 热量(kcal)
  photo?: string      // 食物照片
  time: string        // 记录时间
  createdAt: string
}

// 运动记录
export interface ExerciseRecord {
  id: string
  exerciseType: string // 运动类型
  duration: number     // 运动时长(分钟)
  intensity: 'low' | 'medium' | 'high'  // 运动强度
  calories: number     // 消耗热量(kcal)
  photo?: string       // 运动照片/截图
  time: string         // 记录时间
  createdAt: string
}

// 健康建议
export interface HealthAdvice {
  id: string
  type: 'realtime' | 'periodic'  // 实时/周期性
  category: 'water' | 'food' | 'exercise' | 'general'  // 建议类别
  title: string       // 建议标题
  content: string     // 建议内容
  priority: 'high' | 'medium' | 'low'  // 优先级
  createdAt: string
}

// 打卡提醒设置
export interface ReminderSettings {
  water: {
    enabled: boolean
    times: string[]    // 提醒时间数组，如 ['10:00', '15:00']
  }
  food: {
    enabled: boolean
    times: string[]    // 提醒时间数组，如 ['12:00', '19:00']
  }
  exercise: {
    enabled: boolean
    time: string       // 提醒时间，如 '20:00'
  }
}

// 数据导出格式
export interface ExportData {
  userProfile: UserProfile
  healthGoals: HealthGoals
  records: {
    date: string
    records: TodayRecords
  }[]
  advice: HealthAdvice[]
}

// 食物热量数据
export interface FoodCalorieData {
  name: string
  calories: number    // 每100g热量(kcal)
  category: string    // 食物分类
  commonUnit: string  // 常用单位
}

// 运动热量消耗数据
export interface ExerciseCalorieData {
  name: string
  met: number         // 代谢当量
  category: string    // 运动分类
  defaultIntensity: 'low' | 'medium' | 'high'
}