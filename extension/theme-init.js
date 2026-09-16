;(function () {
  var KEY = 'zunbreak-theme-preference'

  function resolve(preference) {
    if (preference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return preference === 'light' ? 'light' : 'dark'
  }

  var stored = localStorage.getItem(KEY)
  var preference =
    stored === 'light' || stored === 'system' ? stored : 'dark'

  document.documentElement.dataset.theme = resolve(preference)
})()
