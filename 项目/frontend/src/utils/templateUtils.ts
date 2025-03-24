/**
 * 从模板内容中提取变量
 * @param content 模板内容
 * @returns 提取的变量数组
 */
export const parseTemplateVariables = (content: string): string[] => {
  if (!content) return []
  
  const regex = /\$\{([^}]+)\}/g
  const variables = new Set<string>()
  let match
  
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      variables.add(match[1])
    }
  }
  
  return Array.from(variables)
}

/**
 * 替换模板中的变量
 * @param content 模板内容
 * @param variableValues 变量值映射
 * @returns 替换后的内容
 */
export const replaceTemplateVariables = (content: string, variableValues: Record<string, string>): string => {
  if (!content) return content
  
  let result = content
  
  // 获取变量列表
  const variables = parseTemplateVariables(content)
  
  // 替换每个变量
  variables.forEach(variable => {
    const regex = new RegExp(`\\$\\{${variable}\\}`, 'g')
    result = result.replace(regex, variableValues[variable] || `\${${variable}}`)
  })
  
  return result
}

/**
 * 检查变量是否已全部填充
 * @param variables 变量列表
 * @param variableValues 变量值映射
 * @returns 是否全部填充
 */
export const areAllVariablesFilled = (variables: string[], variableValues: Record<string, string>): boolean => {
  return variables.every(variable => {
    return variableValues[variable] && variableValues[variable].trim() !== ''
  })
}

/**
 * 获取未填充的变量列表
 * @param variables 变量列表
 * @param variableValues 变量值映射
 * @returns 未填充的变量数组
 */
export const getUnfilledVariables = (variables: string[], variableValues: Record<string, string>): string[] => {
  return variables.filter(variable => {
    return !variableValues[variable] || variableValues[variable].trim() === ''
  })
} 