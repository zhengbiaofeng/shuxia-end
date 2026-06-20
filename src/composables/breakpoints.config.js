/**
 * 断点配置 - 与 tokens.css 中的 --bp-* 保持一致
 *
 * tokens.css  /  breakpoints.css  /  breakpoints.config.js
 * 三者必须保持同源。任何修改都要同步更新。
 */

export const breakpoints = {
  sm:   640,
  md:  1024,
  lg:  1280,
  xl:  1440,
  '2xl': 1920,
}

export const breakpointNames = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
