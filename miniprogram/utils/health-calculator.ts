import { UserProfile, HealthGoals, FoodRecord, ExerciseRecord } from '../../typings/types'

// BMI计算器
export class BMICalculator {
  static calculateBMI(height: number, weight: number): number {
    const heightInMeters = height / 100
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
  }
  
  static getBMICategory(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
    if (bmi < 18.5) return 'underweight'
    if (bmi < 24.0) return 'normal'
    if (bmi < 28.0) return 'overweight'
    return 'obese'
  }
  
  static getBMICategoryText(category: string): string {
    const categoryMap = {
      'underweight': '偏瘦',
      'normal': '正常',
      'overweight': '超重',
      'obese': '肥胖'
    }
    return categoryMap[category as keyof typeof categoryMap] || '未知'
  }
}

// 目标体重计算器
export class TargetWeightCalculator {
  static calculateTargetWeight(profile: UserProfile): { min: number; max: number } {
    const { height, gender, age, healthGoal, activityLevel } = profile
    
    // 基础代谢率计算
    let bmr: number
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * height) - (5.677 * age)
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * height) - (4.330 * age)
    }
    
    // 活动系数
    const activityFactors = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'high': 1.725
    }
    
    // const tdee = bmr * activityFactors[activityLevel as keyof typeof activityFactors]
    
    // 根据健康目标调整目标体重范围
    const heightInMeters = height / 100
    let minBMI: number, maxBMI: number
    
    switch (healthGoal) {
      case 'weight_loss':
        minBMI = 18.5
        maxBMI = 22.9
        break
      case 'muscle_gain':
        minBMI = 20.0
        maxBMI = 24.0
        break
      case 'maintain_health':
        minBMI = 18.5
        maxBMI = 23.9
        break
      default:
        minBMI = 18.5
        maxBMI = 23.9
    }
    
    return {
      min: Number((minBMI * heightInMeters * heightInMeters).toFixed(1)),
      max: Number((maxBMI * heightInMeters * heightInMeters).toFixed(1))
    }
  }
}

// 健康目标计算器
export class HealthGoalsCalculator {
  static generateHealthGoals(profile: UserProfile): HealthGoals {
    const { weight, height, gender, age, activityLevel, healthGoal } = profile
    
    // 每日推荐饮水量 (体重kg × 30-35ml)
    const dailyWaterIntake = Math.round(weight * 33)
    
    // 基础代谢率
    let bmr: number
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    }
    
    // 活动系数
    const activityFactors = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'high': 1.725
    }
    
    // const tdee = bmr * activityFactors[activityLevel as keyof typeof activityFactors]
    
    // 根据健康目标调整热量摄入
    let calorieAdjustment = 0
    switch (healthGoal) {
      case 'weight_loss':
        calorieAdjustment = -300 // 减少300大卡
        break
      case 'muscle_gain':
        calorieAdjustment = 300 // 增加300大卡
        break
      case 'maintain_health':
        calorieAdjustment = 0
        break
    }
    
    const targetCalories = Math.round(tdee + calorieAdjustment)
    
    return {
      dailyWaterIntake,
      dailyCalorieMin: Math.round(targetCalories * 0.9), // 允许10%的波动
      dailyCalorieMax: Math.round(targetCalories * 1.1),
      dailyExerciseDuration: 30, // 建议每日运动30分钟
      weeklyExerciseFrequency: 5, // 建议每周运动5次
      targetWeight: weight // 初始目标体重设为当前体重
    }
  }
}

// 食物热量计算器
export class FoodCalorieCalculator {
  private static foodDatabase: { [key: string]: { calories: number; unit: string } } = {
    '米饭': { calories: 116, unit: '100g' },
    '面条': { calories: 137, unit: '100g' },
    '馒头': { calories: 221, unit: '100g' },
    '面包': { calories: 265, unit: '100g' },
    '鸡蛋': { calories: 155, unit: '100g' },
    '牛奶': { calories: 54, unit: '100ml' },
    '苹果': { calories: 52, unit: '100g' },
    '香蕉': { calories: 89, unit: '100g' },
    '鸡胸肉': { calories: 165, unit: '100g' },
    '牛肉': { calories: 250, unit: '100g' },
    '猪肉': { calories: 242, unit: '100g' },
    '鱼': { calories: 206, unit: '100g' },
    '白菜': { calories: 17, unit: '100g' },
    '菠菜': { calories: 23, unit: '100g' },
    '西红柿': { calories: 18, unit: '100g' },
    '黄瓜': { calories: 15, unit: '100g' },
    '土豆': { calories: 77, unit: '100g' },
    '红薯': { calories: 86, unit: '100g' },
    '玉米': { calories: 365, unit: '100g' },
    '豆腐': { calories: 76, unit: '100g' }
  }
  
  static calculateCalories(foodName: string, amount: number, unit: string): number {
    const foodData = this.foodDatabase[foodName]
    if (!foodData) {
      // 如果没有找到食物数据，使用默认估算
      return Math.round(amount * 2) // 简单估算，大多数食物每100g约200大卡
    }
    
    // 计算热量
    // let standardAmount = amount
    // let standardUnit = unit
    
    // 单位转换到100g
    if (unit.includes('碗')) {
      standardAmount = amount * 100 // 一碗米饭约100g
      standardUnit = '100g'
    } else if (unit.includes('份')) {
      standardAmount = amount * 150 // 一份约150g
      standardUnit = '100g'
    } else if (unit.includes('ml')) {
      // 液体按100ml计算
      standardAmount = amount
      standardUnit = '100ml'
    }
    
    const caloriesPer100g = foodData.calories
    const factor = unit.includes('g') ? amount / 100 : amount / 100
    
    return Math.round(caloriesPer100g * factor)
  }
  
  static getFoodSuggestion(keyword: string): string[] {
    const suggestions: string[] = []
    for (const foodName in this.foodDatabase) {
      if (foodName.includes(keyword)) {
        suggestions.push(foodName)
      }
    }
    return suggestions
  }
}

// 运动热量计算器
export class ExerciseCalorieCalculator {
  private static exerciseMET: { [key: string]: number } = {
    '跑步': 8.0,
    '游泳': 7.0,
    '骑行': 6.0,
    '健身': 5.0,
    '瑜伽': 2.5,
    '快走': 4.0,
    '慢跑': 6.0,
    '跳绳': 8.8,
    '篮球': 6.5,
    '足球': 7.0,
    '乒乓球': 4.0,
    '羽毛球': 5.5,
    '跳舞': 4.8,
    '爬山': 6.5,
    '俯卧撑': 3.8,
    '仰卧起坐': 3.5,
    '深蹲': 5.0
  }
  
  static calculateCalories(exerciseType: string, duration: number, intensity: 'low' | 'medium' | 'high', weight: number): number {
    // 验证输入参数
    if (!exerciseType || duration <= 0 || !weight || weight <= 0) {
      console.log('热量计算参数无效:', { exerciseType, duration, weight })
      return 0
    }
    
    const met = this.exerciseMET[exerciseType] || 4.0 // 默认MET值
    
    // 强度调整系数
    const intensityFactors = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.3
    }
    
    const adjustedMET = met * intensityFactors[intensity]
    
    // 热量消耗公式：MET × 体重kg × 时间(小时)
    const calories = Math.round(adjustedMET * weight * (duration / 60))
    
    console.log('热量计算详情:', {
      exerciseType,
      met,
      intensity,
      intensityFactor: intensityFactors[intensity],
      adjustedMET,
      weight,
      duration,
      durationHours: duration / 60,
      calories
    })
    
    return calories
  }
  
  static getExerciseList(): string[] {
    return Object.keys(this.exerciseMET)
  }
}

// 健康建议生成器
export class HealthAdviceGenerator {
  static generateRealtimeAdvice(
    waterRecords: any[],
    foodRecords: FoodRecord[],
    exerciseRecords: any[],
    healthGoals: HealthGoals,
    // userProfile: UserProfile
  ): string[] {
    const advices: string[] = []
    
    // 饮水建议
    const totalWater = waterRecords.reduce((sum, record) => sum + record.amount, 0)
    if (totalWater < healthGoals.dailyWaterIntake * 0.5) {
      advices.push(`今日饮水量仅${totalWater}ml，建议增加饮水，目标${healthGoals.dailyWaterIntake}ml`)
    } else if (totalWater >= healthGoals.dailyWaterIntake) {
      advices.push(`今日饮水量已达标！继续保持良好习惯`)
    }
    
    // 饮食建议
    const totalCalories = foodRecords.reduce((sum, record) => sum + record.calories, 0)
    if (totalCalories > healthGoals.dailyCalorieMax) {
      advices.push(`今日热量摄入${totalCalories}大卡已超标，建议控制饮食`)
    } else if (totalCalories < healthGoals.dailyCalorieMin) {
      advices.push(`今日热量摄入${totalCalories}大卡偏低，建议适当补充营养`)
    }
    
    // 运动建议
    const totalExercise = exerciseRecords.reduce((sum, record) => sum + record.duration, 0)
    if (totalExercise < healthGoals.dailyExerciseDuration) {
      advices.push(`今日运动时长${totalExercise}分钟不足，建议完成${healthGoals.dailyExerciseDuration}分钟运动`)
    } else {
      advices.push(`今日运动目标已达成！坚持就是胜利`)
    }
    
    return advices
  }
  
  static generatePeriodicAdvice(
    weeklyData: any[],
    // userProfile: UserProfile
  ): string[] {
    const advices: string[] = []
    
    // 分析一周的运动情况 - 修复数据结构访问
    const exerciseDays = weeklyData.filter(day => 
      day.records && day.records.exerciseRecords && day.records.exerciseRecords.length > 0
    ).length
    
    if (exerciseDays < 3) {
      advices.push('近一周运动天数较少，建议增加运动频率')
    } else if (exerciseDays >= 5) {
      advices.push('近一周运动很规律，继续保持！')
    }
    
    // 分析体重趋势（如果有体重记录）
    // 这里简化处理，实际应该分析体重变化趋势
    if (userProfile.healthGoal === 'weight_loss') {
      advices.push('减脂期间建议控制热量摄入，增加有氧运动')
    } else if (userProfile.healthGoal === 'muscle_gain') {
      advices.push('增肌期间建议增加蛋白质摄入，配合力量训练')
    }
    
    return advices
  }
}