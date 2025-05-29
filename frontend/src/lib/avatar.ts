const lightModeStyles = [
  'adventurer',
  'avataaars',
  'big-ears',
  'big-smile',
  'croodles',
  'fun-emoji',
  'lorelei',
  'micah',
  'open-peeps',
  'personas',
  'pixel-art'
]

const darkModeStyles = [
  'adventurer-neutral',
  'big-ears-neutral',
  'bottts',
  'croodles-neutral',
  'icons',
  'identicon',
  'initials',
  'lorelei-neutral',
  'miniavs',
  'pixel-art-neutral',
  'shapes',
  'thumbs'
]

const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export const generateAvatar = (email: string, isDarkMode: boolean = true): string => {
  const hash = hashString(email)
  const styles = isDarkMode ? darkModeStyles : lightModeStyles
  const styleIndex = hash % styles.length
  const style = styles[styleIndex]
  
  const seed = email.split('@')[0]
  
  const baseParams = `seed=${encodeURIComponent(seed)}&size=128`
  
  if (isDarkMode) {
    return `https://api.dicebear.com/7.x/${style}/svg?${baseParams}&backgroundColor=1f2937,374151,4b5563&backgroundType=solid,gradientLinear`
  } else {
    return `https://api.dicebear.com/7.x/${style}/svg?${baseParams}&backgroundColor=f3f4f6,e5e7eb,d1d5db&backgroundType=solid,gradientLinear`
  }
}