/**
 * OmniStore Theme Switcher — Client-side theme management
 * Loads Omarchy themes, applies CSS variables, syncs with system theme
 */
class OmniStoreThemeSwitcher {
  constructor(options = {}) {
    this.apiBase = options.apiBase || "/api";
    this.onChange = options.onChange || (() => {});
    this.currentTheme = null;
    this.syncWithSystem = false;
    this.panel = null;
    this.triggerBtn = null;
    this.themes = [];
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  }

  async init() {
    await this.loadThemes();
    this.currentTheme = this.getStoredTheme() || this.detectSystemTheme();
    this.applyTheme(this.currentTheme);
    this.buildPanel();
    this.bindEvents();
    this.startSystemSync();
  }

  async loadThemes() {
    try {
      const res = await fetch(`${this.apiBase}/themes`);
      this.themes = await res.json();
    } catch {
      // Fallback: hardcoded list from registry
      this.themes = [
        { name: "catppuccin", mode: "dark", accent: "#89b4fa", background: "#1e1e2e" },
        { name: "tokyo-night", mode: "dark", accent: "#7aa2f7", background: "#1a1b26" },
        { name: "gruvbox", mode: "dark", accent: "#7daea3", background: "#282828" },
        { name: "nord", mode: "dark", accent: "#81a1c1", background: "#2e3440" },
        { name: "rose-pine", mode: "light", accent: "#56949f", background: "#faf4ed" },
        { name: "ethereal", mode: "dark", accent: "#7d82d9", background: "#060B1E" },
        { name: "quattro", mode: "dark", accent: "#7aa2f7", background: "#1a1b26" },
      ];
    }
  }

  detectSystemTheme() {
    // Check if Omarchy theme is detectable via CSS custom property
    const root = getComputedStyle(document.documentElement);
    const omarchyAccent = root.getPropertyValue("--omarchy-accent").trim();
    if (omarchyAccent) {
      const match = this.themes.find(t => t.accent === omarchyAccent);
      if (match) return match.name;
    }
    // Fallback to OS preference
    return this.mediaQuery.matches ? "catppuccin" : "rose-pine";
  }

  getStoredTheme() {
    try {
      return localStorage.getItem("omnistore-theme");
    } catch {
      return null;
    }
  }

  setStoredTheme(name) {
    try {
      localStorage.setItem("omnistore-theme", name);
    } catch {}
  }

  applyTheme(themeName) {
    const theme = this.themes.find(t => t.name === themeName);
    if (!theme) return false;

    this.currentTheme = themeName;
    this.setStoredTheme(themeName);

    // Fetch CSS variables from server (or compute client-side)
    this.fetchThemeCSS(themeName).then(css => {
      this.injectCSS(css);
      this.updatePanelUI();
      this.onChange(themeName, theme);
    });

    return true;
  }

  async fetchThemeCSS(themeName) {
    try {
      const res = await fetch(`${this.apiBase}/themes/${themeName}/css`);
      return await res.text();
    } catch {
      // Client-side fallback: generate minimal CSS vars
      const theme = this.themes.find(t => t.name === themeName);
      return this.generateCSSVars(theme);
    }
  }

  generateCSSVars(theme) {
    if (!theme) return "";
    const isDark = theme.mode === "dark";
    // Minimal mapping - server should provide full mapping
    const vars = {
      "--omnistore-bg-base": isDark ? "#0A0B0D" : "#FAF4ED",
      "--omnistore-bg-surface": isDark ? "#101215" : "#F2E9E1",
      "--omnistore-bg-raised": isDark ? "#15181C" : "#E1DBD5",
      "--omnistore-hairline": isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
      "--omnistore-hairline-strong": isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.14)",
      "--omnistore-ink-1": isDark ? "#F2F4F7" : "#575279",
      "--omnistore-ink-2": isDark ? "#9AA3AE" : "#9893A5",
      "--omnistore-ink-3": isDark ? "#5C6570" : "#CECACD",
      "--omnistore-accent": theme.accent,
      "--omnistore-state-listening": theme.cyan || "#22D3EE",
      "--omnistore-state-thinking": theme.yellow || "#F59E0B",
      "--omnistore-state-ready": theme.green || "#10B981",
      "--omnistore-state-fault": theme.red || "#DC143C",
      "--omnistore-mode": theme.mode,
    };
    return Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join("\n");
  }

  injectCSS(cssText) {
    let styleEl = document.getElementById("omnistore-theme-vars");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "omnistore-theme-vars";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `:root { ${cssText} }`;
  }

  buildPanel() {
    this.panel = document.createElement("div");
    this.panel.className = "omnistore-theme-switcher";
    this.panel.innerHTML = this.panelHTML();
    document.body.appendChild(this.panel);

    // Find or create trigger button
    this.triggerBtn = document.querySelector("[data-omnistore-theme-trigger]");
    if (!this.triggerBtn) {
      this.triggerBtn = document.createElement("button");
      this.triggerBtn.setAttribute("data-omnistore-theme-trigger", "");
      this.triggerBtn.className = "omnistore-theme-trigger";
      this.triggerBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <span class="omnistore-theme-trigger__label">Theme</span>
      `;
      // Insert into telemetry bar or header
      const bar = document.querySelector(".omnistore-telemetry-bar, header, nav");
      if (bar) bar.appendChild(this.triggerBtn);
      else document.body.appendChild(this.triggerBtn);
    }
  }

  panelHTML() {
    const current = this.themes.find(t => t.name === this.currentTheme) || this.themes[0];
    return `
      <div class="omnistore-theme-switcher__header">
        <span class="omnistore-theme-switcher__title">Theme</span>
        <button class="omnistore-theme-switcher__close" data-close>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="omnistore-theme-switcher__current">
        <div class="omnistore-theme-switcher__current-swatch" style="background:${current.accent}"></div>
        <span class="omnistore-theme-switcher__current-name">${current.name}</span>
        <span class="omnistore-theme-switcher__mode" style="text-transform:uppercase;font-size:9px;color:var(--omnistore-ink-3)">${current.mode}</span>
      </div>
      <div class="omnistore-theme-switcher__list" data-list>
        ${this.themes.map(t => `
          <button class="omnistore-theme-option ${t.name === this.currentTheme ? 'active' : ''}" data-theme="${t.name}">
            <div class="omnistore-theme-option__swatch" style="background:${t.accent}"></div>
            <div class="omnistore-theme-option__info">
              <div class="omnistore-theme-option__name">${t.name}</div>
              <div class="omnistore-theme-option__meta">
                <span class="omnistore-theme-option__mode">${t.mode}</span>
                <span>●</span>
                <span style="color:${t.accent}">accent</span>
              </div>
            </div>
          </button>
        `).join("")}
      </div>
      <div class="omnistore-theme-switcher__sync">
        <span class="omnistore-theme-switcher__sync-label">Sync with Omarchy</span>
        <button class="omnistore-theme-switcher__sync-toggle ${this.syncWithSystem ? 'active' : ''}" data-sync-toggle></button>
      </div>
    `;
  }

  bindEvents() {
    // Trigger button
    this.triggerBtn.addEventListener("click", () => this.togglePanel());

    // Panel events
    this.panel.querySelector("[data-close]").addEventListener("click", () => this.closePanel());
    this.panel.querySelector("[data-list]").addEventListener("click", e => {
      const btn = e.target.closest("[data-theme]");
      if (btn) this.applyTheme(btn.dataset.theme);
    });
    this.panel.querySelector("[data-sync-toggle]").addEventListener("click", e => {
      this.syncWithSystem = !this.syncWithSystem;
      e.currentTarget.classList.toggle("active", this.syncWithSystem);
      if (this.syncWithSystem) this.syncToSystemTheme();
    });

    // Click outside to close
    document.addEventListener("click", e => {
      if (!this.panel.contains(e.target) && !this.triggerBtn.contains(e.target)) {
        this.closePanel();
      }
    });

    // ESC to close
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") this.closePanel();
    });
  }

  togglePanel() {
    this.panel.classList.toggle("open");
  }

  closePanel() {
    this.panel.classList.remove("open");
  }

  updatePanelUI() {
    const current = this.themes.find(t => t.name === this.currentTheme);
    if (!current) return;

    this.panel.querySelector(".omnistore-theme-switcher__current-swatch").style.background = current.accent;
    this.panel.querySelector(".omnistore-theme-switcher__current-name").textContent = current.name;
    this.panel.querySelector(".omnistore-theme-switcher__mode").textContent = current.mode;

    this.panel.querySelectorAll(".omnistore-theme-option").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.theme === this.currentTheme);
    });
  }

  startSystemSync() {
    this.mediaQuery.addEventListener("change", () => {
      if (this.syncWithSystem) this.syncToSystemTheme();
    });
  }

  async syncToSystemTheme() {
    try {
      const res = await fetch(`${this.apiBase}/themes/current`);
      const data = await res.json();
      if (data.theme && data.theme !== this.currentTheme) {
        this.applyTheme(data.theme);
      }
    } catch {
      // Fallback to OS preference
      const fallback = this.mediaQuery.matches ? "catppuccin" : "rose-pine";
      if (fallback !== this.currentTheme) this.applyTheme(fallback);
    }
  }
}

// Auto-init if not in a module context
if (typeof window !== "undefined" && !window.OmniStoreThemeSwitcher) {
  window.OmniStoreThemeSwitcher = OmniStoreThemeSwitcher;
  document.addEventListener("DOMContentLoaded", () => {
    window.omnistoreThemeSwitcher = new OmniStoreThemeSwitcher();
    window.omnistoreThemeSwitcher.init();
  });
}

export { OmniStoreThemeSwitcher };