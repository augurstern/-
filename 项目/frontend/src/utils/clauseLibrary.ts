/**
 * 条款项类型定义
 */
export interface ClauseItem {
  id: string;
  category: string;
  title: string;
  content: string;
}

/**
 * 条款库分类
 */
export const clauseCategories: Record<string, string> = {
  common: '通用条款',
  intellectual: '知识产权',
  confidentiality: '保密条款',
  liability: '责任条款',
  termination: '终止条款',
  force_majeure: '不可抗力',
  dispute: '争议解决',
  payment: '付款条款',
  delivery: '交付条款',
  warranty: '保证条款'
}

/**
 * 合同模板类型选项
 */
export const contractTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '销售合同', value: 'sales' },
  { label: '采购合同', value: 'purchase' },
  { label: '服务合同', value: 'service' },
  { label: '劳动合同', value: 'employment' },
  { label: '租赁合同', value: 'lease' },
  { label: '其他', value: 'other' }
]

/**
 * 模板类型名称映射
 */
export const typeNameMap: Record<string, string> = {
  'sales': '销售合同',
  'purchase': '采购合同',
  'service': '服务合同',
  'employment': '劳动合同',
  'lease': '租赁合同',
  'other': '其他'
}

/**
 * 通用条款库
 */
export const commonClauses: ClauseItem[] = [
  {
    id: 'common_force_1',
    category: 'force_majeure',
    title: '不可抗力条款',
    content: `第【】条 不可抗力
1. 不可抗力是指不能预见、不能避免并不能克服的客观情况，包括但不限于自然灾害、战争、政府行为等。
2. 遇有不可抗力的一方应在不可抗力发生后【】日内通知对方，并在【】日内提供不可抗力的详细情况及合同不能履行或部分不能履行的理由的有效证明文件。
3. 因不可抗力导致合同无法履行的，双方应根据不可抗力的影响程度，协商决定是否解除合同，或部分免除受不可抗力影响的一方的责任，或延期履行合同。`
  },
  {
    id: 'common_confidentiality_1',
    category: 'confidentiality',
    title: '保密条款',
    content: `第【】条 保密义务
1. 双方应对因本合同履行过程中知悉的对方的商业秘密、技术秘密及其他应保密信息予以保密。未经信息披露方书面同意，信息接收方不得向任何第三方披露上述信息。
2. 保密期限为自本合同签订之日起至保密信息成为公知信息之日止。
3. 任何一方违反保密义务的，应赔偿对方因此遭受的直接损失，并支付合同总金额【】%的违约金。`
  },
  {
    id: 'common_dispute_1',
    category: 'dispute',
    title: '争议解决',
    content: `第【】条 争议解决
1. 因本合同引起的或与本合同有关的任何争议，双方应首先通过友好协商解决。
2. 协商不成的，任何一方均有权将争议提交【合同签订地/被告住所地】有管辖权的人民法院诉讼解决。
3. 在争议解决期间，除争议部分外，双方应继续履行本合同的其他部分。`
  },
  {
    id: 'common_termination_1',
    category: 'termination',
    title: '合同解除',
    content: `第【】条 合同解除
1. 有下列情形之一的，任何一方有权解除本合同：
   a) 因不可抗力致使合同目的不能实现的；
   b) 对方严重违约，致使合同目的不能实现的；
   c) 对方破产、清算或丧失履约能力的；
   d) 双方协商一致解除合同的。
2. 解除合同的一方应以书面形式通知对方，合同自通知送达对方之日起解除。
3. 合同解除后，不影响守约方要求违约方承担违约责任的权利。`
  }
]

/**
 * 销售合同条款库
 */
export const salesClauses: ClauseItem[] = [
  {
    id: 'sales_payment_1',
    category: 'payment',
    title: '分期付款条款',
    content: `第【】条 付款方式
1. 买方应当按照以下方式向卖方支付货款:
   a) 合同签订后【】个工作日内，买方向卖方支付合同总金额的【】%作为预付款，计人民币【】元；
   b) 卖方交付货物并经买方验收合格后【】个工作日内，买方向卖方支付合同总金额的【】%，计人民币【】元；
   c) 剩余【】%的货款作为质保金，在质保期满且无质量问题后【】个工作日内，由买方向卖方支付，计人民币【】元。
2. 买方应通过银行转账方式支付上述款项至卖方指定账户。`
  },
  {
    id: 'sales_delivery_1',
    category: 'delivery',
    title: '交付时间与方式',
    content: `第【】条 交付
1. 卖方应于【具体日期】或【合同签订后的时间】内将货物交付至【具体地点】。
2. 交付方式：【货交承运人/卖方仓库交货/买方仓库交货】。
3. 货物风险自【交付时点】转移至买方。`
  },
  {
    id: 'sales_warranty_1',
    category: 'warranty',
    title: '质量保证条款',
    content: `第【】条 质量保证
1. 卖方保证所交付的货物符合【国家标准/行业标准/双方约定的标准】，质量合格且无任何缺陷。
2. 质保期为【自交付之日起/自验收合格之日起】【】个月。
3. 在质保期内，如货物出现质量问题，卖方应在接到买方通知后【】小时内响应，并在【】个工作日内进行【维修/更换/退款】，相关费用由卖方承担。`
  },
  {
    id: 'sales_penalty_1',
    category: 'liability',
    title: '逾期交付违约金',
    content: `第【】条 违约责任
1. 卖方逾期交付货物的，应按照以下标准向买方支付违约金：逾期交付【】天以内的，按照逾期交付部分货款的【】%/天计算；逾期交付超过【】天的，买方有权解除合同并要求卖方赔偿损失。
2. 买方逾期付款的，应按照以下标准向卖方支付违约金：逾期付款【】天以内的，按照逾期付款金额的【】%/天计算；逾期付款超过【】天的，卖方有权解除合同并要求买方赔偿损失。
3. 支付违约金不影响守约方要求继续履行合同的权利。`
  }
]

/**
 * 服务合同条款库
 */
export const serviceClauses: ClauseItem[] = [
  {
    id: 'service_payment_1',
    category: 'payment',
    title: '服务费支付方式',
    content: `第【】条 服务费及支付方式
1. 甲方应按以下方式向乙方支付服务费：
   a) 合同签订后【】个工作日内，甲方向乙方支付合同总金额的【】%作为预付款，计人民币【】元；
   b) 乙方提供阶段性服务成果并经甲方确认后【】个工作日内，甲方向乙方支付合同总金额的【】%，计人民币【】元；
   c) 服务全部完成并经甲方验收合格后【】个工作日内，甲方向乙方支付剩余服务费，计人民币【】元。
2. 甲方应通过银行转账方式支付上述款项至乙方指定账户。`
  },
  {
    id: 'service_delivery_1',
    category: 'delivery',
    title: '服务成果交付',
    content: `第【】条 服务成果交付
1. 乙方应于【具体日期】或【合同签订后的时间】内完成服务并交付最终成果。
2. 服务成果应以【书面报告/电子数据/现场演示】等形式交付。
3. 甲方应在收到服务成果后【】个工作日内进行验收，并出具书面验收意见。`
  },
  {
    id: 'service_intellectual_1',
    category: 'intellectual',
    title: '知识产权归属',
    content: `第【】条 知识产权
1. 因履行本合同所产生的知识产权归【甲方/乙方】所有。
2. 乙方保证其在提供服务过程中不侵犯任何第三方的知识产权。如因乙方原因导致第三方对甲方提出知识产权侵权索赔的，乙方应承担全部责任并赔偿甲方因此遭受的所有损失。
3. 未经【对方】书面同意，任何一方不得将本合同项下的知识产权用于合同约定服务以外的用途。`
  }
]

/**
 * 条款推荐关键词匹配配置
 */
export const clauseKeywordMatches: Record<string, string[]> = {
  'payment': ['付款', '支付', '价格', '费用', '金额', '预付款'],
  'delivery': ['交付', '交货', '运输', '物流', '配送'],
  'warranty': ['保证', '质保', '担保', '保修'],
  'liability': ['违约', '赔偿', '责任', '罚款', '违约金'],
  'intellectual': ['知识产权', '专利', '商标', '著作权', '版权'],
  'confidentiality': ['保密', '秘密', '隐私', '机密'],
  'force_majeure': ['不可抗力', '自然灾害', '战争', '疫情'],
  'dispute': ['争议', '纠纷', '诉讼', '仲裁', '管辖'],
  'termination': ['终止', '解除', '撤销', '解约']
}

/**
 * 获取指定类型的条款库
 * @param type 合同类型
 * @returns 该类型的条款列表
 */
export const getClausesByType = (type: string): ClauseItem[] => {
  const typeClauseMap: Record<string, ClauseItem[]> = {
    'sales': salesClauses,
    'service': serviceClauses,
    'common': commonClauses
  }
  
  return typeClauseMap[type as keyof typeof typeClauseMap] || []
}

/**
 * 获取指定类型所有可用的条款（包括通用条款）
 * @param type 合同类型
 * @returns 包括通用条款在内的所有该类型可用条款
 */
export const getAllClausesForType = (type: string): ClauseItem[] => {
  return [...commonClauses, ...getClausesByType(type)]
}

/**
 * 基于内容智能推荐条款
 * @param content 当前内容
 * @param contractType 合同类型
 * @param maxCount 最大推荐数量
 * @returns 推荐的条款列表
 */
export const getRecommendedClauses = (content: string, contractType: string, maxCount: number = 5): ClauseItem[] => {
  if (!content || content.length < 10) {
    return []
  }
  
  const allClauses = getAllClausesForType(contractType)
  const contentLower = content.toLowerCase()
  
  // 分析内容中的关键词
  const categoryScores: Record<string, number> = {}
  Object.entries(clauseKeywordMatches).forEach(([category, keywords]) => {
    categoryScores[category] = 0
    keywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        categoryScores[category] += 1
      }
    })
  })
  
  // 基于分析结果推荐条款
  const recommendations: ClauseItem[] = []
  Object.entries(categoryScores)
    .filter(([_, score]) => score > 0)
    .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA)
    .slice(0, 3)  // 最多推荐3个分类的条款
    .forEach(([category, _]) => {
      const categoryClauses = allClauses.filter(clause => clause.category === category)
      if (categoryClauses.length > 0) {
        // 每个分类最多推荐2个条款
        recommendations.push(...categoryClauses.slice(0, 2))
      }
    })
  
  return recommendations.slice(0, maxCount)
} 