/**
 * Mock 医学术语数据 —— 选项关联字段下拉源
 * - 症状：症状基础数据公开版，已启用
 * - 疾病：疾病基础数据公开版，已启用 + 目过滤 0 级
 *
 * 字段：
 *   name    中文名（写入 linkData.name）
 *   pinyin  拼音（用于搜索匹配）
 */

export const symptoms = [
  { name: '头痛', pinyin: 'toutong' },
  { name: '头晕', pinyin: 'touyun' },
  { name: '发热', pinyin: 'fare' },
  { name: '咳嗽', pinyin: 'kesou' },
  { name: '咳痰', pinyin: 'ketan' },
  { name: '胸痛', pinyin: 'xiongtong' },
  { name: '胸闷', pinyin: 'xiongmen' },
  { name: '心悸', pinyin: 'xinji' },
  { name: '气短', pinyin: 'qiduan' },
  { name: '呼吸困难', pinyin: 'huxikunnan' },
  { name: '腹痛', pinyin: 'futong' },
  { name: '腹泻', pinyin: 'fuxie' },
  { name: '便秘', pinyin: 'bianmi' },
  { name: '恶心', pinyin: 'exin' },
  { name: '呕吐', pinyin: 'outu' },
  { name: '乏力', pinyin: 'fali' },
  { name: '水肿', pinyin: 'shuizhong' },
  { name: '心慌', pinyin: 'xinhuang' },
  { name: '出汗', pinyin: 'chuhan' },
  { name: '失眠', pinyin: 'shimian' }
]

export const diseases = [
  { name: '高血压', pinyin: 'gaoxueya' },
  { name: '冠心病', pinyin: 'guanxinbing' },
  { name: '心肌梗死', pinyin: 'xinjigengsi' },
  { name: '心绞痛', pinyin: 'xinjiaotong' },
  { name: '心力衰竭', pinyin: 'xinlishuaijie' },
  { name: '心律失常', pinyin: 'xinlusaichang' },
  { name: '房颤', pinyin: 'fangchan' },
  { name: '糖尿病', pinyin: 'tangniaobing' },
  { name: '高脂血症', pinyin: 'gaozhixuezheng' },
  { name: '脑卒中', pinyin: 'naozuzhong' },
  { name: '动脉粥样硬化', pinyin: 'dongmaizhouyangyinghua' },
  { name: '肺炎', pinyin: 'feiyan' },
  { name: '支气管炎', pinyin: 'zhiqiguanyan' },
  { name: '哮喘', pinyin: 'xiaochuan' },
  { name: '慢性阻塞性肺疾病', pinyin: 'manxingzusaixingfeijibing' },
  { name: '胃炎', pinyin: 'weiyan' },
  { name: '胃溃疡', pinyin: 'weikuiyang' },
  { name: '胆囊炎', pinyin: 'dannangyan' },
  { name: '肝炎', pinyin: 'ganyan' },
  { name: '肾炎', pinyin: 'shenyan' }
]

/**
 * 通用搜索匹配：中文名 OR 拼音（含全拼，不区分大小写）
 * @param {string} keyword
 * @param {Array<{name:string,pinyin:string}>} source
 */
export function filterByKeyword(keyword, source) {
  if (!keyword) return source
  const kw = keyword.trim().toLowerCase()
  return source.filter((it) => {
    return (
      it.name.toLowerCase().includes(kw) ||
      it.pinyin.toLowerCase().includes(kw)
    )
  })
}