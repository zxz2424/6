import { Viewer } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

export interface CesiumConfig {
  terrain: boolean
  animation: boolean
  timeline: boolean
  homeButton: boolean
  sceneModePicker: boolean
  baseLayerPicker: boolean
  fullscreenButton: boolean
  vrButton: boolean
  geocoder: boolean
}

export const defaultCesiumConfig: CesiumConfig = {
  terrain: true,
  animation: false,
  timeline: false,
  homeButton: true,
  sceneModePicker: true,
  baseLayerPicker: true,
  fullscreenButton: true,
  vrButton: false,
  geocoder: false
}

export const configureCesium = (container: string | Element, config: Partial<CesiumConfig> = {}) => {
  // 璁剧疆Cesium闈欐€佽祫婧愯矾寰?
  window.CESIUM_BASE_URL = '/libs/cesium/'
  
  const viewer = new Viewer(container, {
    ...defaultCesiumConfig,
    ...config
  })
  
  return viewer
}

export const destroyCesium = (viewer: Viewer) => {
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy()
  }
}
