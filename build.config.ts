import { defineBuildConfig } from 'unbuild'
import json from './package.json'

export default defineBuildConfig({
  externals: [
    ...Object.keys(json.dependencies || {}),
    ...Object.keys(json.devDependencies || {}),
  ],
})
