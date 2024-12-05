export const html = `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nitro Kutuaaa</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter var', 'system-ui', '-apple-system', 'sans-serif'],
            },
            animation: {
              'fade-in': 'fadeIn 0.5s ease-out',
              'slide-up': 'slideUp 0.3s ease-out',
            },
          },
        },
      }
    </script>
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
    <style>
      @supports (font-variation-settings: normal) {
        html { font-family: 'Inter var', system-ui, -apple-system, sans-serif; }
      }
      .glassmorphism {
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes slideUp {
        0% { transform: translateY(10px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      .dark .dark\:bg-gray-750 { background-color: rgb(31, 41, 55); }
      
      /* Sparkline styles */
      .sparkline {
        fill: none;
        stroke: #4f46e5;
        stroke-width: 2;
      }
      .dark .sparkline {
        stroke: #818cf8;
      }
      
      /* Dark mode transition */
      .theme-transition {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
      }
      
      /* Theme toggle button styles */
      .theme-toggle {
        @apply p-2 rounded-lg transition-colors duration-200;
      }
      
      .theme-toggle:hover {
        @apply bg-gray-100 dark:bg-gray-700;
      }
      
      /* Enhanced dark mode colors */
      .dark body { background-color: #111827; }
      .dark .dark\:bg-gray-850 { background-color: #1a2234; }
      .dark .dark\:border-gray-750 { border-color: #2d3748; }
    </style>
</head>
<body class="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 theme-transition">
    <div id="app" class="min-h-screen flex flex-col">
      <nav class="fixed top-0 left-0 right-0 bg-white/70 dark:bg-gray-800/70 glassmorphism border-b border-gray-200 dark:border-gray-700 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="h-16 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h1 class="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Nitro Kutu</h1>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ lastUpdate }}</span>
              <button 
                class="px-4 py-1.5 text-sm rounded-full transition-all duration-200 font-medium"
                :class="autoRefresh ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800/20 dark:text-red-400' : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800/20 dark:text-green-400'"
                @click="toggleRefresh">
                {{ autoRefresh ? 'Pause' : 'Resume' }}
              </button>
              <!-- Add theme toggle button -->
              <button 
                @click="toggleDarkMode"
                class="theme-toggle"
                :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              >
                <!-- Sun icon -->
                <svg v-if="isDark" class="w-5 h-5 text-gray-300 hover:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <!-- Moon icon -->
                <svg v-else class="w-5 h-5 text-gray-600 hover:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div 
            v-for="item in stats" 
            :key="item.label"
            class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
            <div class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ item.label }}</div>
            <div class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{{ item.value }}</div>
          </div>
        </div>

        <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden animate-slide-up">
          <div class="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Recent Requests</h3>
            <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">Total: {{ logs.length }}</span>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            <div 
              v-for="log in logs" 
              :key="log.timestamp + log.url"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 min-w-0">
                  <span 
                    class="px-2.5 py-1 rounded-full text-xs font-medium tracking-wide"
                    :class="getStatusClass(log.status)">
                    {{ log.status }}
                  </span>
                  <span class="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">{{ log.method }}</span>
                  <span class="truncate font-mono text-sm text-gray-500 dark:text-gray-400 max-w-md">{{ log.url }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span 
                    v-if="log.category"
                    class="px-2 py-0.5 text-xs rounded-md"
                    :class="getCategoryClass(log.category)">
                    {{ log.category }}
                  </span>
                  <span class="text-sm font-medium" :class="getResponseTimeClass(log.responseTime)">
                    {{ log.responseTime }}ms
                  </span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ log.size }}</span>
                </div>
              </div>
              <div v-if="log.status >= 400 || log.requestsPerMinute > 10" 
                   class="mt-2 pl-8 text-sm">
                <div v-if="log.status >= 400" class="text-red-600 dark:text-red-400">
                  Error details: [Memory: {{ log.memory }}] [UA: {{ log.userAgent || '-' }}]
                </div>
                <div v-if="log.requestsPerMinute > 10" class="text-yellow-600 dark:text-yellow-400">
                  High traffic: {{ log.requestsPerMinute }} requests/minute
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <script>
      const { createApp, ref, onMounted, onUnmounted } = Vue
      const app = createApp({
        setup() {
          const logs = ref([])
          const stats = ref([])
          const autoRefresh = ref(true)
          const lastUpdate = ref('')
          let timer = null

          function getStatusClass(status) {
            if (status < 300) return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
            if (status < 400) return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
            if (status < 500) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
            return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
          }

          function getResponseTimeClass(time) {
            const ms = parseInt(time)
            if (ms < 100) return 'text-green-600 dark:text-green-400'
            if (ms < 300) return 'text-yellow-600 dark:text-yellow-400'
            return 'text-red-600 dark:text-red-400'
          }

          function getCategoryClass(category) {
            const classes = {
              api: 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400',
              page: 'bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-400',
              asset: 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400',
              auth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400',
              static: 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400',
              other: 'bg-pink-100 text-pink-800 dark:bg-pink-800/20 dark:text-pink-400'
            }
            return classes[category] || classes.other
          }

          function toggleRefresh() {
            autoRefresh.value = !autoRefresh.value
            if (autoRefresh.value) startTimer()
            else if (timer) clearInterval(timer)
          }

          async function fetchData() {
            try {
              const res = await fetch('/api/_analytics/logs')
              const { data } = await res.json()
              logs.value = data.recentLogs || []
              stats.value = [
                { label: 'Total Requests', value: data.summary.totalRequests },
                { label: 'Avg Response Time', value: \`\${Math.round(data.summary.averageResponseTime)}ms\` },
                { label: 'Error Rate', value: \`\${(data.summary.errorRate * 100).toFixed(1)}%\` },
                { label: 'Requests/min', value: data.summary.requestsPerMinute }
              ]
              lastUpdate.value = new Date().toLocaleTimeString()
            } catch (err) {
              console.error('Failed to fetch analytics data:', err)
            }
          }

          function startTimer() {
            timer = setInterval(() => {
              if (autoRefresh.value) fetchData()
            }, 1000)
          }

          const darkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
      
          function toggleDarkMode() {
            darkMode.value = !darkMode.value
            document.documentElement.classList.toggle('dark', darkMode.value)
          }

          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            darkMode.value = e.matches
            document.documentElement.classList.toggle('dark', e.matches)
          })

          document.documentElement.classList.toggle('dark', darkMode.value)

          const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
          
          function toggleDarkMode() {
            isDark.value = !isDark.value
            document.documentElement.classList.toggle('dark', isDark.value)
            // Save preference
            localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
          }

          // Initialize theme from saved preference or system
          onMounted(() => {
            const savedTheme = localStorage.getItem('theme')
            if (savedTheme) {
              isDark.value = savedTheme === 'dark'
              document.documentElement.classList.toggle('dark', isDark.value)
            }

            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
              if (!localStorage.getItem('theme')) {
                isDark.value = e.matches
                document.documentElement.classList.toggle('dark', e.matches)
              }
            })

            // ...existing onMounted code...
          })

          onMounted(() => {
            fetchData()
            startTimer()
          })

          onUnmounted(() => {
            if (timer) clearInterval(timer)
          })

          return {
            logs,
            stats,
            autoRefresh,
            lastUpdate,
            getStatusClass,
            getResponseTimeClass,
            toggleRefresh,
            darkMode,
            toggleDarkMode,
            getCategoryClass,
            isDark,
            toggleDarkMode,
          }
        }
      })

      app.mount('#app')
    </script>
</body>
</html>
`
