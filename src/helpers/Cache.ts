import * as v from 'validate-typescript'

export function loadFromStorage<T>(key: string, schema: any, defaults: T): T {
  const loaded = window.localStorage[key]
  if (loaded == null) {
    return defaults
  } else {
    const parsed: T = JSON.parse(loaded)
    try {
      v.validate(schema, parsed)
      return parsed
    } catch (e) {
      console.warn('Cache validation for ' + key + ' failed!')
      window.localStorage[key] = null
      return defaults
    }
  }
}

export function saveToStorage(key: string, value: any) {
  console.log('Saving', key, 'as', value)
  window.localStorage[key] = JSON.stringify(value)
}
