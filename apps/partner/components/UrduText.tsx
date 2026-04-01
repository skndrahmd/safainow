import { Text, TextProps } from 'react-native'

/**
 * Text component that applies Noto Nastaliq Urdu font with a lineHeight
 * of 2× the fontSize to prevent the tall Nastaliq glyphs from being clipped.
 * Falls back to fontSize 16 if not specified.
 */
export default function UrduText({ style, ...props }: TextProps) {
  const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style ?? {}
  const fontSize = (flatStyle as { fontSize?: number }).fontSize ?? 16
  return (
    <Text
      style={[{ fontFamily: 'NotoNastaliqUrdu', lineHeight: fontSize * 2 }, style]}
      {...props}
    />
  )
}
