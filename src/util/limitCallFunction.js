export function throttle(mainFunc, delay) {
  let delayTimeoutId = null
  return (...args) => {
    if (delayTimeoutId) {
      return
    }
    delayTimeoutId = setTimeout(() => {
      delayTimeoutId = null
    }, delay)
    mainFunc(...args)
  }
}

export function debounce(mainFunc, delay) {
  let delayTimeoutId = null
  return (...args) => {
    clearTimeout(delayTimeoutId)

    delayTimeoutId = setTimeout(() => {
      mainFunc(...args)
      delayTimeoutId = null
    }, delay)
  }
}
