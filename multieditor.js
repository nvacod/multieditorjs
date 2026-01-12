/**
 * multieditor.js - Ultimate Professional Modular Workspace
 * Version: 6.0.0 (Production Ready - Premium Edition)
 * 
 * Features:
 * - 10+ Widgets: Calendar, Editor, Todo, Clock, Memo, Timer, Stopwatch, Calculator, Pomodoro, Markdown
 * - 15+ Themes with smooth transitions
 * - Drag & Drop widget reordering
 * - LocalStorage persistence
 * - Export/Import (JSON)
 * - Keyboard shortcuts
 * - Plugin system
 * - Event notification system
 * - Multi-language support (日本語/English/中文)
 * - Responsive design
 * - Fullscreen mode
 * - XSS protection
 */

class MultiEditor {
    static VERSION = '6.0.0';
    static instances = new Map();
    
    // Configuration constants
    static TOAST_DURATION = 3000;      // Toast display duration in ms
    static TOAST_FADE_DURATION = 300;  // Toast fade animation duration in ms
    static SOUND_DURATION = 0.5;       // Notification sound duration in seconds
    
    constructor(selector, config = {}) {
        this.id = 'me_' + Math.random().toString(36).substr(2, 9);
        this.container = document.querySelector(selector);
        if (!this.container) throw new Error("Target container not found.");
        
        // Store instance referencea
        MultiEditor.instances.set(this.id, this);
        this.container.dataset.meId = this.id;

        // Default data structure
        const defaultData = {
            events: {},
            reminders: [],
            notes: "",
            code: "",
            timerSeconds: 0,
            stopwatchTime: 0,
            pomodoroWork: 25,
            pomodoroBreak: 5,
            markdown: ""
        };

        // 1. Config Consolidation
        this.cfg = {
            width: '100%',
            height: '800px',
            minWidth: '320px',
            maxWidth: '100%',
            minHeight: '400px',
            maxHeight: '100vh',
            defaultStyle: 'slate',
            allowTool: ['calendar', 'editor', 'todo', 'clock', 'memo', 'timer', 'stopwatch', 'calculator', 'pomodoro', 'markdown'],
            disableTool: [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            lang: 'ja',
            autoSave: true,
            autoSaveInterval: 30000,
            storageKey: 'multieditor_data',
            enableShortcuts: true,
            enableDragDrop: true,
            enableFullscreen: true,
            enableNotifications: true,
            // Display mode: 'grid' (default) or 'window' (free-floating windows)
            displayMode: 'grid',
            // Font size settings
            fontSize: 14,
            fontSizeMin: 10,
            fontSizeMax: 24,
            // Credit display
            showCredit: true,
            creditName: 'NvaCod',
            creditUrl: '',
            data: { ...defaultData },
            plugins: [],
            onSave: null,
            onChange: null,
            onThemeChange: null,
            ...config
        };

        // Filter active tools from config (not from storage)
        this.activeTools = this.cfg.allowTool.filter(t => !this.cfg.disableTool.includes(t));
        
        // Merge saved data if exists
        if (this.cfg.autoSave) {
            const saved = this._loadFromStorage();
            if (saved) {
                this.cfg.data = { ...defaultData, ...saved.data };
                if (saved.theme) this.cfg.defaultStyle = saved.theme;
                if (saved.lang) this.cfg.lang = saved.lang;
                if (saved.fontSize) this.cfg.fontSize = saved.fontSize;
                if (saved.displayMode) this.cfg.displayMode = saved.displayMode;
                if (saved.widgetPositions) this._widgetPositions = saved.widgetPositions;
                // Only restore visible widgets that are still in activeTools
                if (saved.widgets) {
                    this.currentWidgets = saved.widgets.filter(w => this.activeTools.includes(w));
                } else {
                    this.currentWidgets = [...this.activeTools];
                }
            } else {
                this.currentWidgets = [...this.activeTools];
            }
        } else {
            this.currentWidgets = [...this.activeTools];
        }
        
        // i18n Dictionary - Extended
        this.i18n = {
            ja: {
                calendar: "カレンダー", editor: "エディタ", todo: "タスク", clock: "時計", memo: "メモ",
                timer: "タイマー", stopwatch: "ストップウォッチ", calculator: "電卓", pomodoro: "ポモドーロ", markdown: "マークダウン",
                save: "保存", add: "追加", delete: "削除", reset: "リセット", start: "開始", stop: "停止", pause: "一時停止",
                export: "エクスポート", import: "インポート", fullscreen: "全画面", settings: "設定",
                work: "作業", break: "休憩", completed: "完了", minutes: "分", seconds: "秒",
                prev: "前", next: "次", today: "今日", saved: "保存しました", confirm: "確認",
                fontSize: "フォントサイズ", displayMode: "表示モード", gridMode: "グリッド", windowMode: "ウィンドウ",
                close: "閉じる", minimize: "最小化", maximize: "最大化",
                dows: ["日","月","火","水","木","金","土"],
                months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]
            },
            en: {
                calendar: "Calendar", editor: "Editor", todo: "Tasks", clock: "Clock", memo: "Memo",
                timer: "Timer", stopwatch: "Stopwatch", calculator: "Calculator", pomodoro: "Pomodoro", markdown: "Markdown",
                save: "Save", add: "Add", delete: "Delete", reset: "Reset", start: "Start", stop: "Stop", pause: "Pause",
                export: "Export", import: "Import", fullscreen: "Fullscreen", settings: "Settings",
                work: "Work", break: "Break", completed: "Completed", minutes: "min", seconds: "sec",
                prev: "Prev", next: "Next", today: "Today", saved: "Saved!", confirm: "Confirm",
                fontSize: "Font Size", displayMode: "Display Mode", gridMode: "Grid", windowMode: "Window",
                close: "Close", minimize: "Minimize", maximize: "Maximize",
                dows: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
                months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
            },
            zh: {
                calendar: "日历", editor: "编辑器", todo: "任务", clock: "时钟", memo: "备忘录",
                timer: "计时器", stopwatch: "秒表", calculator: "计算器", pomodoro: "番茄钟", markdown: "Markdown",
                save: "保存", add: "添加", delete: "删除", reset: "重置", start: "开始", stop: "停止", pause: "暂停",
                export: "导出", import: "导入", fullscreen: "全屏", settings: "设置",
                work: "工作", break: "休息", completed: "完成", minutes: "分", seconds: "秒",
                prev: "上一", next: "下一", today: "今天", saved: "已保存", confirm: "确认",
                fontSize: "字体大小", displayMode: "显示模式", gridMode: "网格", windowMode: "窗口",
                close: "关闭", minimize: "最小化", maximize: "最大化",
                dows: ["日","一","二","三","四","五","六"],
                months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]
            }
        };
        this.t = this.i18n[this.cfg.lang] || this.i18n.en;
        
        // Extended themes
        this.themes = [
            'slate', 'indigo', 'rose', 'emerald', 'amber', 'sky', 
            'dark', 'midnight', 'glass', 'neon', 'sunset', 'ocean',
            'forest', 'lavender', 'copper'
        ];
        
        // Available languages (can be extended via plugin)
        this._languages = [
            { code: 'ja', name: '日本語' },
            { code: 'en', name: 'English' },
            { code: 'zh', name: '中文' }
        ];
        
        // Custom toolbar buttons (can be added via plugin)
        this._customToolbarButtons = [];
        
        // Toolbar layout configuration
        this.cfg.toolbarLayout = {
            showWidgetButtons: true,
            showLanguageSelector: true,
            showThemeSelector: true,
            showFullscreenButton: this.cfg.enableFullscreen,
            showExportButton: true,
            showImportButton: true,
            showSaveButton: true,
            compactMode: false,     // If true, hide text labels on buttons
            ...config.toolbarLayout
        };
        
        // Calendar state
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.calendarViewDate = new Date();
        
        // Timer states
        this.timerInterval = null;
        this.stopwatchInterval = null;
        this.stopwatchRunning = false;
        this.stopwatchTime = this.cfg.data.stopwatchTime || 0;
        
        // Pomodoro state
        this.pomodoroInterval = null;
        this.pomodoroRunning = false;
        this.pomodoroMode = 'work';
        this.pomodoroTime = this.cfg.data.pomodoroWork * 60;
        
        // Calculator state
        this.calcDisplay = '0';
        this.calcPrevious = null;
        this.calcOperator = null;
        this.calcWaitingForOperand = false;
        
        // Event emitter
        this.events = {};
        
        // Drag state
        this.draggedWidget = null;

        this._initStyles();
        this._renderFramework();
        this._initCustomSelect();
        this._initKeyboardShortcuts();
        this._initDragDrop();
        this._initAutoSave();
        this._initPlugins();
        this.renderGrid();
        this.setTheme(this.cfg.defaultStyle);

        // Start clock update
        this._clockInterval = setInterval(() => this._updateClock(), 1000);
        
        // Emit ready event
        this.emit('ready', { instance: this });
    }

    _initStyles() {
        // Only add styles once (shared across instances)
        const existingStyle = document.getElementById('me-styles');
        if (existingStyle) {
            // Styles already exist, increment reference count
            MultiEditor._styleRefCount = (MultiEditor._styleRefCount || 1) + 1;
            return;
        }
        
        MultiEditor._styleRefCount = 1;
        const s = document.createElement('style');
        s.id = 'me-styles';
        s.innerHTML = `
            /* ========================================
               CSS Variables & Theme System
            ======================================== */
            :root { 
                --me-radius: 12px; 
                --me-radius-sm: 8px;
                --me-radius-lg: 16px;
                --me-f-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace;
                --me-f-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                --me-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                --me-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                --me-shadow-lg: 0 25px 50px -12px rgba(0,0,0,0.25);
            }
            
            /* Theme Definitions - Complete Set */
            .t-slate { --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --text-muted: #64748b; --accent: #64748b; --accent-hover: #475569; --border: #e2e8f0; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-indigo { --bg: #eef2ff; --card: #ffffff; --text: #312e81; --text-muted: #6366f1; --accent: #4f46e5; --accent-hover: #4338ca; --border: #c7d2fe; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-rose { --bg: #fff1f2; --card: #ffffff; --text: #881337; --text-muted: #f43f5e; --accent: #e11d48; --accent-hover: #be123c; --border: #fecdd3; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-emerald { --bg: #ecfdf5; --card: #ffffff; --text: #064e3b; --text-muted: #10b981; --accent: #059669; --accent-hover: #047857; --border: #a7f3d0; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-amber { --bg: #fffbeb; --card: #ffffff; --text: #78350f; --text-muted: #f59e0b; --accent: #d97706; --accent-hover: #b45309; --border: #fde68a; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-sky { --bg: #f0f9ff; --card: #ffffff; --text: #0c4a6e; --text-muted: #0ea5e9; --accent: #0284c7; --accent-hover: #0369a1; --border: #bae6fd; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-dark { --bg: #0f172a; --card: #1e293b; --text: #f1f5f9; --text-muted: #94a3b8; --accent: #38bdf8; --accent-hover: #0ea5e9; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-midnight { --bg: #020617; --card: #0f172a; --text: #e2e8f0; --text-muted: #64748b; --accent: #8b5cf6; --accent-hover: #7c3aed; --border: #1e293b; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-glass { --bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --card: rgba(255,255,255,0.15); --text: #ffffff; --text-muted: rgba(255,255,255,0.7); --accent: rgba(255,255,255,0.3); --accent-hover: rgba(255,255,255,0.4); --accent-solid: #667eea; --border: rgba(255,255,255,0.2); --blur: blur(20px); --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-neon { --bg: #0a0a0a; --card: #111111; --text: #39ff14; --text-muted: #00ff00; --accent: #39ff14; --accent-hover: #00ff00; --border: #39ff14; --success: #39ff14; --warning: #ffff00; --danger: #ff0000; }
            .t-sunset { --bg: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); --card: rgba(255,255,255,0.2); --text: #ffffff; --text-muted: rgba(255,255,255,0.8); --accent: rgba(255,255,255,0.3); --accent-hover: rgba(255,255,255,0.4); --accent-solid: #f5576c; --border: rgba(255,255,255,0.3); --blur: blur(20px); --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-ocean { --bg: linear-gradient(135deg, #667eea 0%, #00d4ff 100%); --card: rgba(255,255,255,0.15); --text: #ffffff; --text-muted: rgba(255,255,255,0.7); --accent: rgba(0,212,255,0.4); --accent-hover: rgba(0,212,255,0.5); --accent-solid: #00d4ff; --border: rgba(255,255,255,0.2); --blur: blur(20px); --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-forest { --bg: #1a2f1a; --card: #2d4a2d; --text: #d4edda; --text-muted: #98c99e; --accent: #5cb85c; --accent-hover: #4cae4c; --border: #3d5c3d; --success: #5cb85c; --warning: #f0ad4e; --danger: #d9534f; }
            .t-lavender { --bg: #f5f3ff; --card: #ffffff; --text: #4c1d95; --text-muted: #7c3aed; --accent: #8b5cf6; --accent-hover: #7c3aed; --border: #ddd6fe; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }
            .t-copper { --bg: #fef3e2; --card: #ffffff; --text: #7c2d12; --text-muted: #c2410c; --accent: #ea580c; --accent-hover: #c2410c; --border: #fed7aa; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; }

            /* ========================================
               Core Layout
            ======================================== */
            .me-root { 
                display: flex; 
                flex-direction: column; 
                overflow: hidden;
                background: var(--bg); 
                color: var(--text); 
                border: 1px solid var(--border);
                border-radius: var(--me-radius-lg); 
                box-shadow: var(--me-shadow);
                transition: var(--me-transition);
                font-family: var(--me-f-sans);
                position: relative;
            }
            .me-root.fullscreen {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                border-radius: 0 !important;
                z-index: 9999 !important;
            }
            
            /* ========================================
               Toolbar
            ======================================== */
            .me-toolbar { 
                padding: 12px 16px; 
                background: var(--card); 
                border-bottom: 1px solid var(--border);
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                backdrop-filter: var(--blur, none);
                z-index: 50;
                flex-wrap: nowrap;
                gap: 10px;
                min-height: 56px;
            }
            .me-toolbar-left {
                display: flex;
                gap: 6px;
                flex-wrap: nowrap;
                align-items: center;
                overflow-x: auto;
                overflow-y: hidden;
                scrollbar-width: thin;
                scrollbar-color: var(--border) transparent;
                flex: 1;
                min-width: 0;
                padding: 4px 0;
            }
            .me-toolbar-left::-webkit-scrollbar {
                height: 4px;
            }
            .me-toolbar-left::-webkit-scrollbar-track {
                background: transparent;
            }
            .me-toolbar-left::-webkit-scrollbar-thumb {
                background: var(--border);
                border-radius: 2px;
            }
            .me-toolbar-right {
                display: flex;
                gap: 8px;
                align-items: center;
                flex-wrap: nowrap;
                flex-shrink: 0;
            }
            
            /* Responsive toolbar - compact mode */
            @media (max-width: 768px) {
                .me-toolbar {
                    padding: 8px 12px;
                    flex-wrap: wrap;
                }
                .me-toolbar-left {
                    order: 2;
                    width: 100%;
                    flex: none;
                    justify-content: flex-start;
                }
                .me-toolbar-right {
                    order: 1;
                    width: 100%;
                    justify-content: flex-end;
                }
                .me-btn span {
                    display: none;
                }
                .me-btn {
                    padding: 6px 10px;
                }
                .me-select-trigger {
                    padding: 6px 10px;
                    font-size: 11px;
                }
            }
            
            @media (max-width: 480px) {
                .me-toolbar {
                    padding: 6px 8px;
                }
                .me-btn {
                    padding: 4px 8px;
                    font-size: 10px;
                }
                .me-btn.icon-only {
                    width: 28px;
                    height: 28px;
                }
                .me-widget-h {
                    padding: 8px 10px;
                    font-size: 10px;
                }
                /* Single column on very small screens */
                .me-grid {
                    grid-template-columns: 1fr !important;
                }
            }
            
            /* ========================================
               Grid & Widgets
            ======================================== */
            .me-grid { 
                display: grid; 
                flex: 1; 
                overflow: auto; 
                background: var(--border); 
                gap: 1px;
                min-height: 0;
            }
            
            .me-widget { 
                background: var(--card); 
                display: flex; 
                flex-direction: column; 
                overflow: hidden; 
                backdrop-filter: var(--blur, none);
                transition: var(--me-transition);
                min-height: 200px;
            }
            .me-widget.dragging {
                opacity: 0.5;
                transform: scale(0.98);
            }
            .me-widget.drag-over {
                box-shadow: inset 0 0 0 2px var(--accent);
            }
            .me-widget-h { 
                padding: 10px 14px; 
                font-size: 11px; 
                font-weight: 800; 
                text-transform: uppercase; 
                letter-spacing: 0.5px;
                color: var(--accent); 
                border-bottom: 1px solid var(--border); 
                display: flex; 
                justify-content: space-between;
                align-items: center;
                cursor: grab;
                user-select: none;
                background: rgba(0,0,0,0.02);
            }
            .me-widget-h:active { cursor: grabbing; }
            .me-widget-h-actions {
                display: flex;
                gap: 4px;
            }
            .me-widget-h-btn {
                width: 24px;
                height: 24px;
                border: none;
                background: transparent;
                color: var(--text-muted);
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: var(--me-transition);
            }
            .me-widget-h-btn:hover {
                background: var(--accent);
                color: #fff;
            }
            .me-widget-b { 
                flex: 1; 
                overflow-y: auto; 
                position: relative;
                min-height: 0;
            }

            /* ========================================
               Editor (Monaco-style)
            ======================================== */
            .me-editor-outer { 
                display: flex; 
                height: 100%; 
                background: rgba(0,0,0,0.02);
            }
            .me-lines { 
                width: 45px; 
                padding: 15px 8px 15px 0; 
                text-align: right; 
                font-family: var(--me-f-mono); 
                font-size: 13px; 
                line-height: 1.6;
                color: var(--text-muted); 
                opacity: 0.6; 
                background: rgba(0,0,0,0.03); 
                user-select: none; 
                border-right: 1px solid var(--border); 
                overflow: hidden;
            }
            .me-textarea { 
                flex: 1; 
                border: none; 
                outline: none; 
                padding: 15px; 
                font-family: var(--me-f-mono); 
                font-size: 13px; 
                line-height: 1.6; 
                background: transparent; 
                color: inherit; 
                resize: none; 
                white-space: pre; 
                overflow-x: auto;
                tab-size: 4;
            }
            .me-textarea::placeholder {
                color: var(--text-muted);
                opacity: 0.5;
            }

            /* ========================================
               Custom Select UI
            ======================================== */
            .me-select { position: relative; }
            .me-select-trigger { 
                padding: 6px 14px; 
                border: 1px solid var(--border); 
                border-radius: 20px; 
                font-size: 12px; 
                cursor: pointer; 
                background: var(--card); 
                color: var(--text);
                font-weight: 600;
                transition: var(--me-transition);
                white-space: nowrap;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .me-select-trigger:hover {
                border-color: var(--accent);
            }
            .me-select-menu { 
                position: absolute; 
                top: 110%; 
                background: var(--card); 
                border: 1px solid var(--border); 
                border-radius: var(--me-radius-sm); 
                display: none; 
                box-shadow: var(--me-shadow-lg);
                width: 140px; 
                max-height: 200px; 
                overflow-y: auto; 
                z-index: 1000;
            }
            /* Position dropdown to stay within viewport */
            .me-select-menu.align-left { left: 0; right: auto; }
            .me-select-menu.align-right { right: 0; left: auto; }
            .me-select-menu.align-top { top: auto; bottom: 110%; }
            .me-select-menu.show { display: block; animation: me-fadeIn 0.2s ease; }
            .me-opt { 
                padding: 10px 14px; 
                font-size: 12px; 
                cursor: pointer;
                transition: var(--me-transition);
            }
            .me-opt:hover { background: var(--accent); color: #fff; }
            .me-opt.active { background: var(--accent); color: #fff; font-weight: 600; }

            /* ========================================
               Buttons
            ======================================== */
            .me-btn { 
                padding: 6px 14px; 
                border-radius: 20px; 
                border: 1px solid var(--border); 
                background: var(--card); 
                color: var(--text); 
                cursor: pointer; 
                font-size: 12px; 
                font-weight: 600; 
                transition: var(--me-transition);
                white-space: nowrap;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .me-btn:hover { 
                border-color: var(--accent);
                transform: translateY(-1px);
            }
            .me-btn.active { 
                background: var(--accent); 
                color: #fff; 
                border-color: var(--accent);
            }
            /* Glass/gradient themes - use solid color for better contrast */
            .t-glass .me-btn.active,
            .t-sunset .me-btn.active,
            .t-ocean .me-btn.active {
                background: var(--accent-solid, var(--accent));
                border-color: var(--accent-solid, var(--accent));
                color: #fff;
            }
            .t-glass .me-btn:hover,
            .t-sunset .me-btn:hover,
            .t-ocean .me-btn:hover {
                background: rgba(255,255,255,0.2);
                border-color: rgba(255,255,255,0.4);
            }
            .me-btn.primary {
                background: var(--accent);
                color: #fff;
                border-color: var(--accent);
            }
            .me-btn.primary:hover {
                background: var(--accent-hover);
            }
            .me-btn.danger {
                background: var(--danger);
                color: #fff;
                border-color: var(--danger);
            }
            .me-btn.success {
                background: var(--success);
                color: #fff;
                border-color: var(--success);
            }
            .me-btn.sm {
                padding: 4px 10px;
                font-size: 11px;
            }
            .me-btn.icon-only {
                padding: 6px;
                width: 32px;
                height: 32px;
                justify-content: center;
            }

            /* ========================================
               Calendar UI
            ======================================== */
            .me-cal-wrap { padding: 15px; }
            .me-cal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .me-cal-title {
                font-weight: bold;
                font-size: 14px;
            }
            .me-cal-nav {
                display: flex;
                gap: 4px;
            }
            .me-cal-nav-btn {
                width: 28px;
                height: 28px;
                border: 1px solid var(--border);
                background: var(--card);
                color: var(--text);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                transition: var(--me-transition);
            }
            .me-cal-nav-btn:hover {
                background: var(--accent);
                color: #fff;
                border-color: var(--accent);
            }
            .me-cal-grid { 
                display: grid; 
                grid-template-columns: repeat(7, 1fr); 
                gap: 4px; 
                text-align: center;
            }
            .me-cal-dow {
                font-size: 10px;
                font-weight: 600;
                color: var(--text-muted);
                padding: 8px 0;
                text-transform: uppercase;
            }
            .me-day { 
                aspect-ratio: 1; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 13px; 
                border-radius: 50%; 
                cursor: pointer; 
                position: relative;
                transition: var(--me-transition);
            }
            .me-day:hover {
                background: rgba(0,0,0,0.05);
            }
            .me-day.today {
                font-weight: bold;
                color: var(--accent);
            }
            .me-day.active { 
                background: var(--accent); 
                color: #fff; 
                font-weight: bold;
            }
            .me-day.other-month {
                opacity: 0.3;
            }
            .me-dot { 
                position: absolute; 
                bottom: 2px; 
                width: 4px; 
                height: 4px; 
                border-radius: 50%; 
                background: var(--accent);
            }
            .me-day.active .me-dot {
                background: #fff;
            }
            .me-cal-input { 
                width: 100%; 
                margin-top: 15px; 
                border: 1px solid var(--border); 
                padding: 12px; 
                border-radius: var(--me-radius-sm); 
                background: var(--bg); 
                color: inherit; 
                font-size: 13px;
                font-family: inherit;
                resize: vertical;
                min-height: 60px;
            }
            .me-cal-input:focus {
                outline: none;
                border-color: var(--accent);
            }

            /* ========================================
               Clock Widget
            ======================================== */
            .me-clock-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 20px;
            }
            .me-live-clock { 
                font-size: clamp(2rem, 8vw, 4rem);
                text-align: center;
                font-weight: 200;
                font-variant-numeric: tabular-nums;
                letter-spacing: 2px;
            }
            .me-clock-date {
                font-size: 14px;
                color: var(--text-muted);
                margin-top: 10px;
            }
            .me-clock-timezone {
                font-size: 11px;
                color: var(--text-muted);
                margin-top: 5px;
                opacity: 0.7;
            }

            /* ========================================
               Todo Widget
            ======================================== */
            .me-todo-input-wrap {
                padding: 12px 15px;
                border-bottom: 1px solid var(--border);
                display: flex;
                gap: 8px;
            }
            .me-todo-input {
                flex: 1;
                border: 1px solid var(--border);
                padding: 10px 14px;
                border-radius: 20px;
                background: var(--bg);
                color: inherit;
                font-size: 13px;
                font-family: inherit;
            }
            .me-todo-input:focus {
                outline: none;
                border-color: var(--accent);
            }
            .me-todo-list {
                overflow-y: auto;
            }
            .me-todo-item {
                padding: 12px 16px;
                border-bottom: 1px solid var(--border);
                font-size: 13px;
                display: flex;
                gap: 12px;
                align-items: center;
                transition: var(--me-transition);
            }
            .me-todo-item:hover {
                background: rgba(0,0,0,0.02);
            }
            .me-todo-item.completed {
                opacity: 0.5;
            }
            .me-todo-item.completed .me-todo-text {
                text-decoration: line-through;
            }
            .me-todo-checkbox {
                width: 18px;
                height: 18px;
                cursor: pointer;
                accent-color: var(--accent);
            }
            .me-todo-text {
                flex: 1;
                word-break: break-word;
            }
            .me-todo-delete {
                width: 24px;
                height: 24px;
                border: none;
                background: transparent;
                color: var(--danger);
                cursor: pointer;
                border-radius: 4px;
                opacity: 0;
                transition: var(--me-transition);
                font-size: 16px;
            }
            .me-todo-item:hover .me-todo-delete {
                opacity: 1;
            }
            .me-todo-delete:hover {
                background: var(--danger);
                color: #fff;
            }
            .me-todo-empty {
                padding: 40px 20px;
                text-align: center;
                color: var(--text-muted);
                font-size: 13px;
            }

            /* ========================================
               Timer Widget
            ======================================== */
            .me-timer-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 20px;
                gap: 20px;
            }
            .me-timer-display {
                font-size: clamp(2rem, 8vw, 3.5rem);
                font-weight: 200;
                font-variant-numeric: tabular-nums;
                letter-spacing: 2px;
            }
            .me-timer-inputs {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .me-timer-input {
                width: 60px;
                padding: 8px;
                text-align: center;
                border: 1px solid var(--border);
                border-radius: var(--me-radius-sm);
                background: var(--bg);
                color: inherit;
                font-size: 16px;
                font-family: var(--me-f-mono);
            }
            .me-timer-input:focus {
                outline: none;
                border-color: var(--accent);
            }
            .me-timer-label {
                font-size: 12px;
                color: var(--text-muted);
            }
            .me-timer-controls {
                display: flex;
                gap: 10px;
            }

            /* ========================================
               Stopwatch Widget
            ======================================== */
            .me-stopwatch-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 20px;
                gap: 20px;
            }
            .me-stopwatch-display {
                font-size: clamp(2rem, 8vw, 3.5rem);
                font-weight: 200;
                font-variant-numeric: tabular-nums;
                letter-spacing: 2px;
            }
            .me-stopwatch-ms {
                font-size: 0.5em;
                opacity: 0.7;
            }
            .me-stopwatch-controls {
                display: flex;
                gap: 10px;
            }

            /* ========================================
               Calculator Widget
            ======================================== */
            .me-calc-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                padding: 10px;
            }
            .me-calc-display {
                background: rgba(0,0,0,0.05);
                padding: 20px 15px;
                text-align: right;
                font-size: clamp(1.5rem, 5vw, 2.5rem);
                font-family: var(--me-f-mono);
                font-weight: 300;
                border-radius: var(--me-radius-sm);
                margin-bottom: 10px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .me-calc-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 6px;
                flex: 1;
            }
            .me-calc-btn {
                border: none;
                background: rgba(0,0,0,0.05);
                color: inherit;
                font-size: 18px;
                font-family: var(--me-f-sans);
                border-radius: var(--me-radius-sm);
                cursor: pointer;
                transition: var(--me-transition);
                min-height: 45px;
            }
            .me-calc-btn:hover {
                background: rgba(0,0,0,0.1);
            }
            .me-calc-btn:active {
                transform: scale(0.95);
            }
            .me-calc-btn.operator {
                background: var(--accent);
                color: #fff;
            }
            .me-calc-btn.operator:hover {
                background: var(--accent-hover);
            }
            .me-calc-btn.equals {
                background: var(--success);
                color: #fff;
            }
            .me-calc-btn.clear {
                background: var(--danger);
                color: #fff;
            }
            .me-calc-btn.span-2 {
                grid-column: span 2;
            }

            /* ========================================
               Pomodoro Widget
            ======================================== */
            .me-pomo-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 20px;
                gap: 15px;
            }
            .me-pomo-mode {
                display: flex;
                gap: 10px;
            }
            .me-pomo-display {
                font-size: clamp(2.5rem, 10vw, 4rem);
                font-weight: 200;
                font-variant-numeric: tabular-nums;
            }
            .me-pomo-progress {
                width: 80%;
                max-width: 200px;
                height: 6px;
                background: rgba(0,0,0,0.1);
                border-radius: 3px;
                overflow: hidden;
            }
            .me-pomo-progress-bar {
                height: 100%;
                background: var(--accent);
                transition: width 1s linear;
            }
            .me-pomo-controls {
                display: flex;
                gap: 10px;
            }
            .me-pomo-settings {
                display: flex;
                gap: 15px;
                font-size: 12px;
                color: var(--text-muted);
            }
            .me-pomo-setting {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .me-pomo-setting input {
                width: 40px;
                padding: 4px;
                text-align: center;
                border: 1px solid var(--border);
                border-radius: 4px;
                background: var(--bg);
                color: inherit;
                font-size: 12px;
            }

            /* ========================================
               Markdown Widget
            ======================================== */
            .me-md-container {
                display: flex;
                height: 100%;
            }
            .me-md-editor {
                flex: 1;
                display: flex;
                flex-direction: column;
                border-right: 1px solid var(--border);
            }
            .me-md-preview {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            }
            .me-md-toolbar {
                padding: 8px;
                border-bottom: 1px solid var(--border);
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }
            .me-md-btn {
                width: 28px;
                height: 28px;
                border: 1px solid var(--border);
                background: var(--card);
                color: var(--text);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                transition: var(--me-transition);
            }
            .me-md-btn:hover {
                background: var(--accent);
                color: #fff;
                border-color: var(--accent);
            }
            .me-md-textarea {
                flex: 1;
                border: none;
                outline: none;
                padding: 15px;
                font-family: var(--me-f-mono);
                font-size: 13px;
                line-height: 1.6;
                background: transparent;
                color: inherit;
                resize: none;
            }
            .me-md-preview h1 { font-size: 1.8em; margin: 0.5em 0; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
            .me-md-preview h2 { font-size: 1.5em; margin: 0.5em 0; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
            .me-md-preview h3 { font-size: 1.25em; margin: 0.5em 0; }
            .me-md-preview p { margin: 0.5em 0; line-height: 1.6; }
            .me-md-preview code { background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-family: var(--me-f-mono); font-size: 0.9em; }
            .me-md-preview pre { background: rgba(0,0,0,0.05); padding: 15px; border-radius: var(--me-radius-sm); overflow-x: auto; }
            .me-md-preview pre code { background: none; padding: 0; }
            .me-md-preview blockquote { border-left: 4px solid var(--accent); padding-left: 15px; margin: 0.5em 0; color: var(--text-muted); }
            .me-md-preview ul, .me-md-preview ol { margin: 0.5em 0; padding-left: 1.5em; }
            .me-md-preview li { margin: 0.25em 0; }
            .me-md-preview a { color: var(--accent); }
            .me-md-preview hr { border: none; border-top: 1px solid var(--border); margin: 1em 0; }
            .me-md-preview table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
            .me-md-preview th, .me-md-preview td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
            .me-md-preview th { background: rgba(0,0,0,0.05); }

            /* ========================================
               Toast Notifications
            ======================================== */
            .me-toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .me-toast {
                padding: 12px 20px;
                background: var(--card);
                color: var(--text);
                border: 1px solid var(--border);
                border-radius: var(--me-radius-sm);
                box-shadow: var(--me-shadow-lg);
                font-size: 13px;
                animation: me-slideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .me-toast.success { border-left: 4px solid var(--success); }
            .me-toast.warning { border-left: 4px solid var(--warning); }
            .me-toast.error { border-left: 4px solid var(--danger); }
            .me-toast.info { border-left: 4px solid var(--accent); }

            /* ========================================
               Animations
            ======================================== */
            @keyframes me-fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes me-slideIn {
                from { opacity: 0; transform: translateX(100px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes me-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* ========================================
               Responsive Design
            ======================================== */
            @media (max-width: 768px) {
                .me-toolbar {
                    padding: 10px 12px;
                }
                .me-toolbar-left {
                    order: 2;
                    width: 100%;
                    justify-content: center;
                }
                .me-toolbar-right {
                    order: 1;
                    width: 100%;
                    justify-content: space-between;
                }
                .me-btn {
                    padding: 5px 10px;
                    font-size: 11px;
                }
                .me-grid {
                    grid-template-columns: 1fr !important;
                }
                .me-md-container {
                    flex-direction: column;
                }
                .me-md-editor {
                    border-right: none;
                    border-bottom: 1px solid var(--border);
                    max-height: 50%;
                }
            }

            /* ========================================
               Scrollbar Styling
            ======================================== */
            .me-root ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            .me-root ::-webkit-scrollbar-track {
                background: transparent;
            }
            .me-root ::-webkit-scrollbar-thumb {
                background: var(--border);
                border-radius: 4px;
            }
            .me-root ::-webkit-scrollbar-thumb:hover {
                background: var(--text-muted);
            }

            /* ========================================
               Print Styles
            ======================================== */
            @media print {
                .me-toolbar, .me-widget-h-actions { display: none !important; }
                .me-root { box-shadow: none; border: none; }
            }

            /* ========================================
               Window Mode (Floating Windows)
            ======================================== */
            .me-root.window-mode .me-grid {
                display: block;
                position: relative;
                background: var(--bg);
                padding: 10px;
            }
            .me-root.window-mode .me-widget {
                position: absolute;
                min-width: 280px;
                min-height: 200px;
                box-shadow: var(--me-shadow-lg);
                border: 1px solid var(--border);
                border-radius: var(--me-radius);
                resize: both;
                overflow: auto;
                z-index: 10;
                /* Improve resize smoothness */
                will-change: transform;
            }
            .me-root.window-mode .me-widget.active {
                z-index: 100;
                box-shadow: 0 25px 60px -12px rgba(0,0,0,0.35);
            }
            /* Disable transition during drag for smoothness */
            .me-root.window-mode .me-widget.dragging {
                transition: none !important;
            }
            .me-root.window-mode .me-widget-h {
                cursor: move;
            }
            .me-root.window-mode .me-widget.minimized {
                min-height: auto;
                height: auto !important;
                resize: none;
            }
            .me-root.window-mode .me-widget.minimized .me-widget-b {
                display: none;
            }
            .me-root.window-mode .me-widget.maximized {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                border-radius: 0;
                z-index: 1000;
                resize: none;
            }
            
            /* Window mode header actions */
            .me-widget-h-btn.minimize-btn,
            .me-widget-h-btn.maximize-btn {
                display: none;
            }
            .me-root.window-mode .me-widget-h-btn.minimize-btn,
            .me-root.window-mode .me-widget-h-btn.maximize-btn {
                display: flex;
            }
            
            /* Resize handle */
            .me-root.window-mode .me-widget::after {
                content: '';
                position: absolute;
                bottom: 0;
                right: 0;
                width: 16px;
                height: 16px;
                cursor: nwse-resize;
                background: linear-gradient(135deg, transparent 50%, var(--border) 50%);
                border-radius: 0 0 var(--me-radius) 0;
            }

            /* ========================================
               Settings Panel
            ======================================== */
            .me-settings-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: me-fadeIn 0.2s ease;
            }
            .me-settings-panel {
                background: var(--card);
                border: 1px solid var(--border);
                border-radius: var(--me-radius-lg);
                box-shadow: var(--me-shadow-lg);
                width: 90%;
                max-width: 400px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .me-settings-header {
                padding: 16px 20px;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 700;
                font-size: 16px;
            }
            .me-settings-close {
                width: 28px;
                height: 28px;
                border: none;
                background: transparent;
                color: var(--text-muted);
                cursor: pointer;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--me-transition);
            }
            .me-settings-close:hover {
                background: var(--danger);
                color: #fff;
            }
            .me-settings-body {
                padding: 20px;
            }
            .me-settings-group {
                margin-bottom: 20px;
            }
            .me-settings-label {
                font-size: 12px;
                font-weight: 600;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                display: block;
            }
            .me-settings-row {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .me-settings-slider {
                flex: 1;
                height: 6px;
                -webkit-appearance: none;
                background: var(--border);
                border-radius: 3px;
                outline: none;
            }
            .me-settings-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent);
                cursor: pointer;
                transition: var(--me-transition);
            }
            .me-settings-slider::-webkit-slider-thumb:hover {
                transform: scale(1.2);
            }
            .me-settings-value {
                min-width: 40px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
            }
            .me-settings-toggle {
                display: flex;
                gap: 8px;
            }
            .me-settings-toggle-btn {
                flex: 1;
                padding: 10px;
                border: 1px solid var(--border);
                background: var(--bg);
                color: var(--text);
                border-radius: var(--me-radius-sm);
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: var(--me-transition);
            }
            .me-settings-toggle-btn.active {
                background: var(--accent);
                color: #fff;
                border-color: var(--accent);
            }

            /* ========================================
               Credit Footer
            ======================================== */
            .me-credit {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 8px 16px;
                background: linear-gradient(to top, rgba(0,0,0,0.1), transparent);
                text-align: center;
                font-size: 11px;
                color: var(--text-muted);
                pointer-events: none;
                z-index: 5;
            }
            .me-credit a {
                color: var(--accent);
                text-decoration: none;
                pointer-events: auto;
                font-weight: 600;
            }
            .me-credit a:hover {
                text-decoration: underline;
            }
            .me-credit-icon {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                vertical-align: middle;
            }
        `;
        document.head.appendChild(s);
    }

    _renderFramework() {
        const layout = this.cfg.toolbarLayout;
        const compactClass = layout.compactMode ? 'compact' : '';
        
        // Build toolbar right section
        let toolbarRight = '';
        
        // Custom buttons (left position)
        this._customToolbarButtons
            .filter(b => b.position === 'left')
            .forEach(b => {
                toolbarRight += `<button class="me-btn icon-only ${b.className}" id="me-custom-${b.id}" title="${b.title}">${this._svgIcon(b.icon, 14) || b.icon}</button>`;
            });
        
        if (layout.showLanguageSelector) {
            toolbarRight += `
                <div class="me-select" id="me-lang-sel">
                    <div class="me-select-trigger">${this._svgIcon('globe', 14)} ${this.cfg.lang.toUpperCase()}</div>
                    <div class="me-select-menu"></div>
                </div>`;
        }
        
        if (layout.showThemeSelector) {
            toolbarRight += `
                <div class="me-select" id="me-theme-sel">
                    <div class="me-select-trigger">${this._svgIcon('palette', 14)} ${this._capitalize(this.cfg.defaultStyle)}</div>
                    <div class="me-select-menu"></div>
                </div>`;
        }
        
        if (layout.showFullscreenButton) {
            toolbarRight += `<button class="me-btn icon-only" id="me-fullscreen" title="Fullscreen">${this._svgIcon('maximize', 16)}</button>`;
        }
        
        if (layout.showExportButton) {
            toolbarRight += `<button class="me-btn icon-only" id="me-export" title="${this.t.export}">${this._svgIcon('download', 16)}</button>`;
        }
        
        if (layout.showImportButton) {
            toolbarRight += `<button class="me-btn icon-only" id="me-import" title="${this.t.import}">${this._svgIcon('upload', 16)}</button>`;
            toolbarRight += `<input type="file" id="me-import-file" accept=".json" style="display:none;">`;
        }
        
        // Custom buttons (right position)
        this._customToolbarButtons
            .filter(b => b.position === 'right')
            .forEach(b => {
                toolbarRight += `<button class="me-btn icon-only ${b.className}" id="me-custom-${b.id}" title="${b.title}">${this._svgIcon(b.icon, 14) || b.icon}</button>`;
            });
        
        // Settings button
        toolbarRight += `<button class="me-btn icon-only" id="me-settings-btn" title="${this.t.settings}">${this._svgIcon('settings', 16)}</button>`;
        
        if (layout.showSaveButton) {
            toolbarRight += `<button class="me-btn primary" id="me-save-main">${this._svgIcon('save', 14)} ${this.t.save}</button>`;
        }
        
        // Credit display
        const creditHtml = this.cfg.showCredit ? `
            <div class="me-credit">
                <span class="me-credit-icon">
                    ${this._svgIcon('code', 12)}
                    Powered by ${this.cfg.creditUrl ? `<a href="${this._escapeHtml(this.cfg.creditUrl)}" target="_blank">NvaCod</a>` : `<span style="font-weight:600;">NvaCod</span>`}
                </span>
            </div>
        ` : '';
        
        // Window mode class
        const windowModeClass = this.cfg.displayMode === 'window' ? 'window-mode' : '';
        
        this.container.innerHTML = `
            <div class="me-root ${compactClass} ${windowModeClass}" style="width:${this.cfg.width}; height:${this.cfg.height}; max-width:${this.cfg.maxWidth}; min-width:${this.cfg.minWidth}; max-height:${this.cfg.maxHeight}; min-height:${this.cfg.minHeight}; font-size:${this.cfg.fontSize}px;">
                <header class="me-toolbar">
                    <div class="me-toolbar-left" id="me-toggles"></div>
                    <div class="me-toolbar-right">${toolbarRight}</div>
                </header>
                <div class="me-grid" id="me-grid"></div>
                ${creditHtml}
            </div>
        `;
        
        // Add widget toggle buttons
        if (layout.showWidgetButtons) {
            const toggles = this.container.querySelector('#me-toggles');
            this.activeTools.forEach(id => {
                const btn = document.createElement('button');
                btn.className = `me-btn ${this.currentWidgets.includes(id) ? 'active' : ''}`;
                btn.dataset.widget = id;
                btn.innerHTML = `${this._svgIcon(id, 14)} <span>${this._escapeHtml(this.t[id] || id)}</span>`;
                btn.onclick = () => this._toggleWidget(id, btn);
                toggles.appendChild(btn);
            });
        }

        // Save button handler
        const saveBtn = this.container.querySelector('#me-save-main');
        if (saveBtn) saveBtn.onclick = () => this.save();
        
        // Export button handler
        const exportBtn = this.container.querySelector('#me-export');
        if (exportBtn) exportBtn.onclick = () => this.exportData();
        
        // Import button & file input handlers
        const importBtn = this.container.querySelector('#me-import');
        const importFile = this.container.querySelector('#me-import-file');
        if (importBtn && importFile) {
            importBtn.onclick = () => importFile.click();
            importFile.onchange = (e) => this.importData(e.target.files[0]);
        }
        
        // Fullscreen button handler
        const fullscreenBtn = this.container.querySelector('#me-fullscreen');
        if (fullscreenBtn) fullscreenBtn.onclick = () => this.toggleFullscreen();
        
        // Settings button handler
        const settingsBtn = this.container.querySelector('#me-settings-btn');
        if (settingsBtn) settingsBtn.onclick = () => this.openSettings();
        
        // Custom button handlers
        this._customToolbarButtons.forEach(b => {
            const btn = this.container.querySelector(`#me-custom-${b.id}`);
            if (btn && b.onClick) {
                btn.onclick = () => b.onClick.call(this, btn);
            }
        });
        
        // Apply initial font size
        this._applyFontSize(this.cfg.fontSize);
    }

    _initCustomSelect() {
        // Theme selector
        const themeSel = this.container.querySelector('#me-theme-sel');
        if (!themeSel) return; // Skip if theme selector is not rendered
        
        const themeTrigger = themeSel.querySelector('.me-select-trigger');
        const themeMenu = themeSel.querySelector('.me-select-menu');

        this.themes.forEach(t => {
            const opt = document.createElement('div');
            opt.className = `me-opt ${t === this.cfg.defaultStyle ? 'active' : ''}`;
            opt.innerText = this._capitalize(t);
            opt.onclick = () => {
                this.setTheme(t);
                themeTrigger.innerHTML = `${this._svgIcon('palette', 14)} ${this._capitalize(t)}`;
                themeMenu.querySelectorAll('.me-opt').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                themeMenu.classList.remove('show');
            };
            themeMenu.appendChild(opt);
        });

        themeTrigger.onclick = (e) => { 
            e.stopPropagation(); 
            this._closeAllMenus();
            this._positionDropdown(themeMenu, themeTrigger);
            themeMenu.classList.toggle('show'); 
        };
        
        // Language selector
        const langSel = this.container.querySelector('#me-lang-sel');
        if (langSel) {
            const langTrigger = langSel.querySelector('.me-select-trigger');
            const langMenu = langSel.querySelector('.me-select-menu');
            
            // Use registered languages
            this._languages.forEach(lang => {
                const opt = document.createElement('div');
                opt.className = `me-opt ${lang.code === this.cfg.lang ? 'active' : ''}`;
                opt.innerText = lang.name;
                opt.onclick = () => {
                    this.setLanguage(lang.code);
                    langTrigger.innerHTML = `${this._svgIcon('globe', 14)} ${lang.code.toUpperCase()}`;
                    langMenu.querySelectorAll('.me-opt').forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    langMenu.classList.remove('show');
                };
                langMenu.appendChild(opt);
            });
            
            langTrigger.onclick = (e) => {
                e.stopPropagation();
                this._closeAllMenus();
                this._positionDropdown(langMenu, langTrigger);
                langMenu.classList.toggle('show');
            };
        }

        // Close menus on outside click
        document.addEventListener('click', () => this._closeAllMenus());
    }
    
    _closeAllMenus() {
        this.container.querySelectorAll('.me-select-menu.show').forEach(m => m.classList.remove('show'));
    }
    
    /**
     * Position dropdown menu to stay within viewport
     */
    _positionDropdown(menu, trigger) {
        // Reset position classes
        menu.classList.remove('align-left', 'align-right', 'align-top');
        
        const triggerRect = trigger.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 140; // menu width from CSS
        const menuHeight = Math.min(200, menu.scrollHeight || 200); // max-height from CSS
        
        // Check horizontal position
        if (triggerRect.right - menuWidth < 0) {
            // Too close to left edge, align to left
            menu.classList.add('align-left');
        } else if (triggerRect.left + menuWidth > viewportWidth) {
            // Too close to right edge, align to right
            menu.classList.add('align-right');
        } else {
            // Default: align to right of trigger
            menu.classList.add('align-right');
        }
        
        // Check vertical position
        if (triggerRect.bottom + menuHeight > viewportHeight && triggerRect.top - menuHeight > 0) {
            // Not enough space below, but space above - open upward
            menu.classList.add('align-top');
        }
    }
    
    _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // SVG Icons - inline for better performance and customization
    _svgIcon(name, size = 16) {
        const icons = {
            // Toolbar icons
            globe: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
            palette: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
            maximize: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
            download: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
            upload: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
            save: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
            close: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
            
            // Widget icons
            calendar: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
            editor: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
            todo: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
            clock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
            memo: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
            timer: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/><path d="M6.38 18.7L4 21"/><path d="M17.64 18.67L20 21"/></svg>`,
            stopwatch: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4"/><path d="M10 2h4"/><path d="M12 2v2"/></svg>`,
            calculator: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>`,
            pomodoro: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><path d="M16 3l1 2"/><path d="M8 3l-1 2"/></svg>`,
            markdown: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13l-2 2 2 2"/><path d="M14 17l2-2-2-2"/></svg>`,
            
            // Navigation icons
            chevronLeft: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
            chevronRight: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
            chevronsLeft: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>`,
            chevronsRight: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>`,
            
            // Action icons
            play: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
            pause: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
            reset: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
            trash: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
            plus: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
            check: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
            backspace: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>`,
            
            // Markdown toolbar icons
            bold: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
            italic: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
            heading: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><path d="M6 4v16"/><path d="M18 4v16"/></svg>`,
            link: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
            code: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
            list: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
            quote: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>`,
            
            // Settings & window control icons
            settings: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
            minimize: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
            windowMaximize: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
            windowRestore: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="14" height="14" rx="2" ry="2"/><path d="M9 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/></svg>`
        };
        
        // Check custom icons first
        if (this._customIcons && this._customIcons[name]) {
            const customSvg = this._customIcons[name];
            // If it's already a complete SVG, return as-is
            if (customSvg.includes('<svg')) {
                return customSvg.replace(/width="[^"]*"/, `width="${size}"`).replace(/height="[^"]*"/, `height="${size}"`);
            }
            // Otherwise wrap in SVG tags
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${customSvg}</svg>`;
        }
        
        return icons[name] || '';
    }
    
    _initKeyboardShortcuts() {
        if (!this.cfg.enableShortcuts) return;
        
        document.addEventListener('keydown', (e) => {
            // Only handle if focus is within this container or body
            if (!this.container.contains(document.activeElement) && document.activeElement !== document.body) return;
            
            // Ctrl/Cmd + S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }
            // Ctrl/Cmd + E = Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportData();
            }
            // Escape = Exit fullscreen
            if (e.key === 'Escape') {
                const root = this.container.querySelector('.me-root');
                if (root.classList.contains('fullscreen')) {
                    this.toggleFullscreen();
                }
            }
        });
    }
    
    _initDragDrop() {
        if (!this.cfg.enableDragDrop) return;
        // Drag and drop is initialized per widget in renderGrid
    }
    
    _initAutoSave() {
        if (!this.cfg.autoSave) return;
        
        this._autoSaveInterval = setInterval(() => {
            this._saveToStorage();
        }, this.cfg.autoSaveInterval);
    }
    
    _initPlugins() {
        this.cfg.plugins.forEach(plugin => {
            if (typeof plugin.init === 'function') {
                plugin.init(this);
            }
        });
    }
    
    _loadFromStorage() {
        try {
            const data = localStorage.getItem(this.cfg.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('MultiEditor: Failed to load from storage', e);
            return null;
        }
    }
    
    _saveToStorage() {
        try {
            const saveData = {
                data: this.cfg.data,
                theme: this.cfg.defaultStyle,
                widgets: this.currentWidgets,
                lang: this.cfg.lang,
                fontSize: this.cfg.fontSize,
                displayMode: this.cfg.displayMode,
                widgetPositions: this._widgetPositions || {},
                timestamp: Date.now()
            };
            localStorage.setItem(this.cfg.storageKey, JSON.stringify(saveData));
            this.emit('autoSave', saveData);
        } catch (e) {
            console.warn('MultiEditor: Failed to save to storage', e);
        }
    }

    _toggleWidget(id, btn) {
        if(this.currentWidgets.includes(id)) {
            if (this.currentWidgets.length <= 1) {
                this.toast(this.cfg.lang === 'ja' ? '最低1つのウィジェットが必要です' : 'At least one widget required', 'warning');
                return;
            }
            this.currentWidgets = this.currentWidgets.filter(w => w !== id);
            btn.classList.remove('active');
        } else {
            this.currentWidgets.push(id);
            btn.classList.add('active');
        }
        this.renderGrid();
        this.emit('widgetToggle', { id, visible: this.currentWidgets.includes(id) });
    }

    renderGrid() {
        const grid = this.container.querySelector('#me-grid');
        const count = this.currentWidgets.length;
        
        // Optimal Column Calculation
        if (count === 1) {
            grid.style.gridTemplateColumns = '1fr';
        } else if (count === 2) {
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (count <= 4) {
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        }
        
        grid.innerHTML = '';

        this.currentWidgets.forEach((id, index) => {
            const w = document.createElement('div');
            w.className = 'me-widget';
            w.dataset.widgetId = id;
            w.dataset.id = id;
            w.dataset.index = index;
            
            // Drag and drop attributes
            if (this.cfg.enableDragDrop) {
                w.draggable = true;
                w.ondragstart = (e) => this._onDragStart(e, index);
                w.ondragover = (e) => this._onDragOver(e);
                w.ondragenter = (e) => this._onDragEnter(e, w);
                w.ondragleave = (e) => this._onDragLeave(e, w);
                w.ondrop = (e) => this._onDrop(e, index);
                w.ondragend = (e) => this._onDragEnd(e);
            }
            
            w.innerHTML = `
                <div class="me-widget-h">
                    <span>${this._svgIcon(id, 14)} ${this._escapeHtml(this.t[id] || id)}</span>
                    <div class="me-widget-h-actions">
                        <button class="me-widget-h-btn minimize-btn" data-action="minimize" title="${this.t.minimize}">${this._svgIcon('minimize', 14)}</button>
                        <button class="me-widget-h-btn maximize-btn" data-action="maximize" title="${this.t.maximize}">${this._svgIcon('windowMaximize', 14)}</button>
                        <button class="me-widget-h-btn" data-action="close" title="${this.t.close}">${this._svgIcon('close', 14)}</button>
                    </div>
                </div>
                <div class="me-widget-b" id="b-${id}"></div>
            `;
            
            // Close button handler
            w.querySelector('[data-action="close"]').onclick = (e) => {
                e.stopPropagation();
                const btn = this.container.querySelector(`[data-widget="${id}"]`);
                if (btn) this._toggleWidget(id, btn);
            };
            
            // Minimize button handler (window mode)
            w.querySelector('[data-action="minimize"]').onclick = (e) => {
                e.stopPropagation();
                this.minimizeWidget(id);
            };
            
            // Maximize button handler (window mode)
            w.querySelector('[data-action="maximize"]').onclick = (e) => {
                e.stopPropagation();
                this.maximizeWidget(id);
            };
            
            grid.appendChild(w);
            this._drawWidgetContent(id);
        });
        
        // Initialize window mode if active
        if (this.cfg.displayMode === 'window') {
            this._initWindowMode();
        }
    }
    
    // Drag and Drop handlers
    _onDragStart(e, index) {
        this.draggedWidget = index;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    }
    
    _onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    _onDragEnter(e, widget) {
        e.preventDefault();
        widget.classList.add('drag-over');
    }
    
    _onDragLeave(e, widget) {
        widget.classList.remove('drag-over');
    }
    
    _onDrop(e, targetIndex) {
        e.preventDefault();
        const sourceIndex = this.draggedWidget;
        
        if (sourceIndex !== null && sourceIndex !== targetIndex) {
            // Swap widgets
            const widgets = [...this.currentWidgets];
            const [removed] = widgets.splice(sourceIndex, 1);
            widgets.splice(targetIndex, 0, removed);
            this.currentWidgets = widgets;
            this.renderGrid();
            this.emit('widgetReorder', { widgets: this.currentWidgets });
        }
        
        this.container.querySelectorAll('.me-widget').forEach(w => {
            w.classList.remove('drag-over', 'dragging');
        });
    }
    
    _onDragEnd(e) {
        this.draggedWidget = null;
        this.container.querySelectorAll('.me-widget').forEach(w => {
            w.classList.remove('drag-over', 'dragging');
        });
    }

    _drawWidgetContent(id) {
        const b = this.container.querySelector(`#b-${id}`);
        if (!b) return;
        
        switch(id) {
            case 'editor':
                this._renderEditor(b);
                break;
            case 'calendar':
                this._renderCalendar(b);
                break;
            case 'clock':
                this._renderClock(b);
                break;
            case 'todo':
                this._renderTodo(b);
                break;
            case 'memo':
                this._renderMemo(b);
                break;
            case 'timer':
                this._renderTimer(b);
                break;
            case 'stopwatch':
                this._renderStopwatch(b);
                break;
            case 'calculator':
                this._renderCalculator(b);
                break;
            case 'pomodoro':
                this._renderPomodoro(b);
                break;
            case 'markdown':
                this._renderMarkdown(b);
                break;
            default:
                b.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">Widget: ${this._escapeHtml(id)}</div>`;
        }
    }
    
    // ========================================
    // Editor Widget
    // ========================================
    _renderEditor(b) {
        b.innerHTML = `
            <div class="me-editor-outer">
                <div class="me-lines">1</div>
                <textarea class="me-textarea" spellcheck="false" placeholder="// Write your code here..."></textarea>
            </div>
        `;
        const tx = b.querySelector('textarea');
        const ln = b.querySelector('.me-lines');
        tx.value = this.cfg.data.code || '';
        
        const updateLines = () => {
            const lines = tx.value.split('\n').length;
            ln.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('<br>');
        };
        
        tx.oninput = () => { 
            this.cfg.data.code = tx.value; 
            updateLines();
            this.emit('change', { type: 'code', value: tx.value });
        };
        tx.onscroll = () => { ln.scrollTop = tx.scrollTop; };
        
        // Tab support
        tx.onkeydown = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = tx.selectionStart;
                const end = tx.selectionEnd;
                tx.value = tx.value.substring(0, start) + '    ' + tx.value.substring(end);
                tx.selectionStart = tx.selectionEnd = start + 4;
                tx.oninput();
            }
        };
        
        updateLines();
    }
    
    // ========================================
    // Clock Widget
    // ========================================
    _renderClock(b) {
        b.innerHTML = `
            <div class="me-clock-container">
                <div class="me-live-clock" id="me-live-clock"></div>
                <div class="me-clock-date" id="me-clock-date"></div>
                <div class="me-clock-timezone">${this._escapeHtml(this.cfg.timezone)}</div>
            </div>
        `;
        this._updateClock();
    }
    
    // ========================================
    // Memo Widget
    // ========================================
    _renderMemo(b) {
        b.innerHTML = `
            <textarea class="me-textarea" style="white-space:pre-wrap; padding:20px; height:100%;" placeholder="${this.cfg.lang === 'ja' ? '何か書いてください...' : 'Write something...'}">${this._escapeHtml(this.cfg.data.notes || '')}</textarea>
        `;
        b.querySelector('textarea').oninput = (e) => { 
            this.cfg.data.notes = e.target.value;
            this.emit('change', { type: 'notes', value: e.target.value });
        };
    }

    // ========================================
    // Calendar Widget (with navigation)
    // ========================================
    _renderCalendar(con) {
        const viewDate = this.calendarViewDate;
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const today = new Date().toISOString().split('T')[0];
        
        con.innerHTML = `
            <div class="me-cal-wrap">
                <div class="me-cal-header">
                    <div class="me-cal-nav">
                        <button class="me-cal-nav-btn" data-action="prev-year" title="Previous Year">${this._svgIcon('chevronsLeft', 14)}</button>
                        <button class="me-cal-nav-btn" data-action="prev-month" title="Previous Month">${this._svgIcon('chevronLeft', 14)}</button>
                    </div>
                    <div class="me-cal-title">${year} ${this.t.months[month]}</div>
                    <div class="me-cal-nav">
                        <button class="me-cal-nav-btn" data-action="next-month" title="Next Month">${this._svgIcon('chevronRight', 14)}</button>
                        <button class="me-cal-nav-btn" data-action="next-year" title="Next Year">${this._svgIcon('chevronsRight', 14)}</button>
                    </div>
                </div>
                <div class="me-cal-grid" id="me-days"></div>
                <textarea class="me-cal-input" id="me-ev-note" placeholder="${this._escapeHtml(this.selectedDate)}"></textarea>
            </div>
        `;
        
        // Navigation handlers
        con.querySelector('[data-action="prev-year"]').onclick = () => {
            this.calendarViewDate = new Date(year - 1, month, 1);
            this._renderCalendar(con);
        };
        con.querySelector('[data-action="prev-month"]').onclick = () => {
            this.calendarViewDate = new Date(year, month - 1, 1);
            this._renderCalendar(con);
        };
        con.querySelector('[data-action="next-month"]').onclick = () => {
            this.calendarViewDate = new Date(year, month + 1, 1);
            this._renderCalendar(con);
        };
        con.querySelector('[data-action="next-year"]').onclick = () => {
            this.calendarViewDate = new Date(year + 1, month, 1);
            this._renderCalendar(con);
        };
        
        const grid = con.querySelector('#me-days');
        
        // Day of week headers
        this.t.dows.forEach(d => {
            const dow = document.createElement('div');
            dow.className = 'me-cal-dow';
            dow.textContent = d;
            grid.appendChild(dow);
        });
        
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevMonthLastDate = new Date(year, month, 0).getDate();
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'me-day other-month';
            cell.textContent = prevMonthLastDate - i;
            grid.appendChild(cell);
        }
        
        // Current month days
        for (let d = 1; d <= lastDate; d++) {
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const cell = document.createElement('div');
            cell.className = 'me-day';
            if (dStr === today) cell.classList.add('today');
            if (dStr === this.selectedDate) cell.classList.add('active');
            cell.textContent = d;
            
            if (this.cfg.data.events[dStr]) {
                const dot = document.createElement('div');
                dot.className = 'me-dot';
                cell.appendChild(dot);
            }
            
            cell.onclick = () => { 
                this.selectedDate = dStr; 
                this._renderCalendar(con);
                this.emit('dateSelect', { date: dStr });
            };
            grid.appendChild(cell);
        }
        
        // Next month days
        const totalCells = firstDay + lastDate;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remainingCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'me-day other-month';
            cell.textContent = i;
            grid.appendChild(cell);
        }
        
        // Event note input
        const noteIn = con.querySelector('#me-ev-note');
        noteIn.value = this.cfg.data.events[this.selectedDate] || '';
        noteIn.oninput = (e) => {
            if (e.target.value) {
                this.cfg.data.events[this.selectedDate] = e.target.value;
            } else {
                delete this.cfg.data.events[this.selectedDate];
            }
            this.emit('change', { type: 'events', date: this.selectedDate, value: e.target.value });
        };
    }
    
    // ========================================
    // Todo Widget (with delete functionality)
    // ========================================
    _renderTodo(con) {
        // Ensure reminders is an array of objects
        if (!Array.isArray(this.cfg.data.reminders)) {
            this.cfg.data.reminders = [];
        }
        // Convert old string format to object format
        this.cfg.data.reminders = this.cfg.data.reminders.map(item => {
            if (typeof item === 'string') {
                return { text: item, completed: false, id: Date.now() + Math.random() };
            }
            return item;
        });
        
        con.innerHTML = `
            <div class="me-todo-input-wrap">
                <input type="text" class="me-todo-input" id="me-todo-in" placeholder="+ ${this.t.add}">
                <button class="me-btn primary sm" id="me-todo-add-btn">${this.t.add}</button>
            </div>
            <div class="me-todo-list" id="me-todo-list"></div>
        `;
        
        const list = con.querySelector('#me-todo-list');
        const input = con.querySelector('#me-todo-in');
        const addBtn = con.querySelector('#me-todo-add-btn');
        
        const draw = () => {
            if (this.cfg.data.reminders.length === 0) {
                list.innerHTML = `<div class="me-todo-empty">${this.cfg.lang === 'ja' ? 'タスクがありません' : 'No tasks yet'}</div>`;
                return;
            }
            
            list.innerHTML = this.cfg.data.reminders.map((item, i) => `
                <div class="me-todo-item ${item.completed ? 'completed' : ''}" data-index="${i}">
                    <input type="checkbox" class="me-todo-checkbox" ${item.completed ? 'checked' : ''} data-action="toggle">
                    <span class="me-todo-text">${this._escapeHtml(item.text)}</span>
                    <button class="me-todo-delete" data-action="delete" title="${this.t.delete}">${this._svgIcon('trash', 14)}</button>
                </div>
            `).join('');
            
            // Checkbox handlers
            list.querySelectorAll('[data-action="toggle"]').forEach(cb => {
                cb.onchange = (e) => {
                    const index = parseInt(e.target.closest('.me-todo-item').dataset.index);
                    this.cfg.data.reminders[index].completed = e.target.checked;
                    draw();
                    this.emit('change', { type: 'reminders', action: 'toggle', index });
                };
            });
            
            // Delete handlers
            list.querySelectorAll('[data-action="delete"]').forEach(btn => {
                btn.onclick = (e) => {
                    const index = parseInt(e.target.closest('.me-todo-item').dataset.index);
                    this.cfg.data.reminders.splice(index, 1);
                    draw();
                    this.emit('change', { type: 'reminders', action: 'delete', index });
                };
            });
        };
        
        const addTask = () => {
            const text = input.value.trim();
            if (text) {
                this.cfg.data.reminders.push({
                    text,
                    completed: false,
                    id: Date.now()
                });
                input.value = '';
                draw();
                this.emit('change', { type: 'reminders', action: 'add', text });
            }
        };
        
        input.onkeydown = (e) => {
            if (e.key === 'Enter') addTask();
        };
        addBtn.onclick = addTask;
        
        draw();
    }

    _updateClock() {
        const el = this.container.querySelector('#me-live-clock');
        const dateEl = this.container.querySelector('#me-clock-date');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString(this.cfg.lang, { 
                timeZone: this.cfg.timezone, 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString(this.cfg.lang, {
                    timeZone: this.cfg.timezone,
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }
    }
    
    // ========================================
    // Timer Widget
    // ========================================
    _renderTimer(con) {
        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };
        
        con.innerHTML = `
            <div class="me-timer-container">
                <div class="me-timer-display" id="me-timer-display">${formatTime(this.cfg.data.timerSeconds || 0)}</div>
                <div class="me-timer-inputs">
                    <input type="number" class="me-timer-input" id="me-timer-h" min="0" max="99" value="0" placeholder="H">
                    <span class="me-timer-label">:</span>
                    <input type="number" class="me-timer-input" id="me-timer-m" min="0" max="59" value="0" placeholder="M">
                    <span class="me-timer-label">:</span>
                    <input type="number" class="me-timer-input" id="me-timer-s" min="0" max="59" value="0" placeholder="S">
                </div>
                <div class="me-timer-controls">
                    <button class="me-btn success" id="me-timer-start">${this.t.start}</button>
                    <button class="me-btn" id="me-timer-pause">${this.t.pause}</button>
                    <button class="me-btn danger" id="me-timer-reset">${this.t.reset}</button>
                </div>
            </div>
        `;
        
        const display = con.querySelector('#me-timer-display');
        const hInput = con.querySelector('#me-timer-h');
        const mInput = con.querySelector('#me-timer-m');
        const sInput = con.querySelector('#me-timer-s');
        let timerSeconds = this.cfg.data.timerSeconds || 0;
        
        const updateDisplay = () => {
            display.textContent = formatTime(timerSeconds);
            this.cfg.data.timerSeconds = timerSeconds;
        };
        
        con.querySelector('#me-timer-start').onclick = () => {
            if (this.timerInterval) return;
            
            // Get time from inputs if timer is at 0
            if (timerSeconds === 0) {
                timerSeconds = (parseInt(hInput.value) || 0) * 3600 + 
                               (parseInt(mInput.value) || 0) * 60 + 
                               (parseInt(sInput.value) || 0);
            }
            
            if (timerSeconds <= 0) return;
            
            this.timerInterval = setInterval(() => {
                timerSeconds--;
                updateDisplay();
                if (timerSeconds <= 0) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                    this.toast(this.cfg.lang === 'ja' ? 'タイマー終了！' : 'Timer finished!', 'success');
                    this._playSound();
                }
            }, 1000);
        };
        
        con.querySelector('#me-timer-pause').onclick = () => {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        };
        
        con.querySelector('#me-timer-reset').onclick = () => {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            timerSeconds = 0;
            updateDisplay();
            hInput.value = mInput.value = sInput.value = 0;
        };
    }
    
    // ========================================
    // Stopwatch Widget
    // ========================================
    _renderStopwatch(con) {
        const formatTime = (ms) => {
            const totalSeconds = Math.floor(ms / 1000);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            const milliseconds = Math.floor((ms % 1000) / 10);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}<span class="me-stopwatch-ms">.${String(milliseconds).padStart(2, '0')}</span>`;
        };
        
        con.innerHTML = `
            <div class="me-stopwatch-container">
                <div class="me-stopwatch-display" id="me-stopwatch-display">${formatTime(this.stopwatchTime)}</div>
                <div class="me-stopwatch-controls">
                    <button class="me-btn success" id="me-sw-start">${this.stopwatchRunning ? this.t.pause : this.t.start}</button>
                    <button class="me-btn danger" id="me-sw-reset">${this.t.reset}</button>
                </div>
            </div>
        `;
        
        const display = con.querySelector('#me-stopwatch-display');
        const startBtn = con.querySelector('#me-sw-start');
        
        const updateDisplay = () => {
            display.innerHTML = formatTime(this.stopwatchTime);
        };
        
        startBtn.onclick = () => {
            if (this.stopwatchRunning) {
                // Pause
                clearInterval(this.stopwatchInterval);
                this.stopwatchInterval = null;
                this.stopwatchRunning = false;
                startBtn.textContent = this.t.start;
                startBtn.classList.remove('danger');
                startBtn.classList.add('success');
            } else {
                // Start
                const startTime = Date.now() - this.stopwatchTime;
                this.stopwatchInterval = setInterval(() => {
                    this.stopwatchTime = Date.now() - startTime;
                    this.cfg.data.stopwatchTime = this.stopwatchTime;
                    updateDisplay();
                }, 10);
                this.stopwatchRunning = true;
                startBtn.textContent = this.t.pause;
                startBtn.classList.remove('success');
                startBtn.classList.add('danger');
            }
        };
        
        con.querySelector('#me-sw-reset').onclick = () => {
            if (this.stopwatchInterval) {
                clearInterval(this.stopwatchInterval);
                this.stopwatchInterval = null;
            }
            this.stopwatchRunning = false;
            this.stopwatchTime = 0;
            this.cfg.data.stopwatchTime = 0;
            startBtn.textContent = this.t.start;
            startBtn.classList.remove('danger');
            startBtn.classList.add('success');
            updateDisplay();
        };
        
        updateDisplay();
    }
    
    // ========================================
    // Calculator Widget
    // ========================================
    _renderCalculator(con) {
        con.innerHTML = `
            <div class="me-calc-container">
                <div class="me-calc-display" id="me-calc-display">${this._escapeHtml(this.calcDisplay)}</div>
                <div class="me-calc-grid">
                    <button class="me-calc-btn clear" data-action="clear">C</button>
                    <button class="me-calc-btn" data-action="backspace">${this._svgIcon('backspace', 18)}</button>
                    <button class="me-calc-btn operator" data-action="operator" data-op="%">%</button>
                    <button class="me-calc-btn operator" data-action="operator" data-op="/">÷</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="7">7</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="8">8</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="9">9</button>
                    <button class="me-calc-btn operator" data-action="operator" data-op="*">×</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="4">4</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="5">5</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="6">6</button>
                    <button class="me-calc-btn operator" data-action="operator" data-op="-">−</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="1">1</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="2">2</button>
                    <button class="me-calc-btn" data-action="digit" data-digit="3">3</button>
                    <button class="me-calc-btn operator" data-action="operator" data-op="+">+</button>
                    <button class="me-calc-btn span-2" data-action="digit" data-digit="0">0</button>
                    <button class="me-calc-btn" data-action="decimal">.</button>
                    <button class="me-calc-btn equals" data-action="equals">=</button>
                </div>
            </div>
        `;
        
        const display = con.querySelector('#me-calc-display');
        
        const updateDisplay = () => {
            display.textContent = this.calcDisplay;
        };
        
        const calculate = () => {
            if (this.calcPrevious === null || this.calcOperator === null) return;
            
            const prev = parseFloat(this.calcPrevious);
            const current = parseFloat(this.calcDisplay);
            let result;
            
            switch (this.calcOperator) {
                case '+': result = prev + current; break;
                case '-': result = prev - current; break;
                case '*': result = prev * current; break;
                case '/': result = current !== 0 ? prev / current : 'Error'; break;
                case '%': result = prev % current; break;
                default: return;
            }
            
            this.calcDisplay = result === 'Error' ? 'Error' : String(parseFloat(result.toFixed(10)));
            this.calcPrevious = null;
            this.calcOperator = null;
            this.calcWaitingForOperand = true;
            updateDisplay();
        };
        
        // Event handlers
        con.querySelectorAll('[data-action="digit"]').forEach(btn => {
            btn.onclick = () => {
                const digit = btn.dataset.digit;
                if (this.calcWaitingForOperand) {
                    this.calcDisplay = digit;
                    this.calcWaitingForOperand = false;
                } else {
                    this.calcDisplay = this.calcDisplay === '0' ? digit : this.calcDisplay + digit;
                }
                updateDisplay();
            };
        });
        
        con.querySelectorAll('[data-action="operator"]').forEach(btn => {
            btn.onclick = () => {
                if (this.calcPrevious !== null && !this.calcWaitingForOperand) {
                    calculate();
                }
                this.calcPrevious = this.calcDisplay;
                this.calcOperator = btn.dataset.op;
                this.calcWaitingForOperand = true;
            };
        });
        
        con.querySelector('[data-action="equals"]').onclick = calculate;
        
        con.querySelector('[data-action="clear"]').onclick = () => {
            this.calcDisplay = '0';
            this.calcPrevious = null;
            this.calcOperator = null;
            this.calcWaitingForOperand = false;
            updateDisplay();
        };
        
        con.querySelector('[data-action="backspace"]').onclick = () => {
            if (this.calcDisplay.length > 1) {
                this.calcDisplay = this.calcDisplay.slice(0, -1);
            } else {
                this.calcDisplay = '0';
            }
            updateDisplay();
        };
        
        con.querySelector('[data-action="decimal"]').onclick = () => {
            if (this.calcWaitingForOperand) {
                this.calcDisplay = '0.';
                this.calcWaitingForOperand = false;
            } else if (!this.calcDisplay.includes('.')) {
                this.calcDisplay += '.';
            }
            updateDisplay();
        };
    }
    
    // ========================================
    // Pomodoro Widget
    // ========================================
    _renderPomodoro(con) {
        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };
        
        const totalTime = this.pomodoroMode === 'work' 
            ? this.cfg.data.pomodoroWork * 60 
            : this.cfg.data.pomodoroBreak * 60;
        const progress = ((totalTime - this.pomodoroTime) / totalTime) * 100;
        
        con.innerHTML = `
            <div class="me-pomo-container">
                <div class="me-pomo-mode">
                    <button class="me-btn ${this.pomodoroMode === 'work' ? 'active' : ''}" data-mode="work">${this.t.work}</button>
                    <button class="me-btn ${this.pomodoroMode === 'break' ? 'active' : ''}" data-mode="break">${this.t.break}</button>
                </div>
                <div class="me-pomo-display" id="me-pomo-display">${formatTime(this.pomodoroTime)}</div>
                <div class="me-pomo-progress">
                    <div class="me-pomo-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="me-pomo-controls">
                    <button class="me-btn ${this.pomodoroRunning ? 'danger' : 'success'}" id="me-pomo-toggle">
                        ${this.pomodoroRunning ? this.t.pause : this.t.start}
                    </button>
                    <button class="me-btn" id="me-pomo-reset">${this.t.reset}</button>
                </div>
                <div class="me-pomo-settings">
                    <div class="me-pomo-setting">
                        <span>${this.t.work}:</span>
                        <input type="number" id="me-pomo-work" min="1" max="60" value="${this.cfg.data.pomodoroWork}">
                        <span>${this.t.minutes}</span>
                    </div>
                    <div class="me-pomo-setting">
                        <span>${this.t.break}:</span>
                        <input type="number" id="me-pomo-break" min="1" max="30" value="${this.cfg.data.pomodoroBreak}">
                        <span>${this.t.minutes}</span>
                    </div>
                </div>
            </div>
        `;
        
        const display = con.querySelector('#me-pomo-display');
        const progressBar = con.querySelector('.me-pomo-progress-bar');
        const toggleBtn = con.querySelector('#me-pomo-toggle');
        
        const updateDisplay = () => {
            display.textContent = formatTime(this.pomodoroTime);
            const total = this.pomodoroMode === 'work' 
                ? this.cfg.data.pomodoroWork * 60 
                : this.cfg.data.pomodoroBreak * 60;
            progressBar.style.width = `${((total - this.pomodoroTime) / total) * 100}%`;
        };
        
        // Mode buttons
        con.querySelectorAll('[data-mode]').forEach(btn => {
            btn.onclick = () => {
                if (this.pomodoroRunning) return;
                this.pomodoroMode = btn.dataset.mode;
                this.pomodoroTime = this.pomodoroMode === 'work' 
                    ? this.cfg.data.pomodoroWork * 60 
                    : this.cfg.data.pomodoroBreak * 60;
                this._renderPomodoro(con);
            };
        });
        
        // Toggle button
        toggleBtn.onclick = () => {
            if (this.pomodoroRunning) {
                // Pause
                clearInterval(this.pomodoroInterval);
                this.pomodoroInterval = null;
                this.pomodoroRunning = false;
            } else {
                // Start
                this.pomodoroInterval = setInterval(() => {
                    this.pomodoroTime--;
                    updateDisplay();
                    
                    if (this.pomodoroTime <= 0) {
                        clearInterval(this.pomodoroInterval);
                        this.pomodoroInterval = null;
                        this.pomodoroRunning = false;
                        
                        // Switch mode
                        this.pomodoroMode = this.pomodoroMode === 'work' ? 'break' : 'work';
                        this.pomodoroTime = this.pomodoroMode === 'work' 
                            ? this.cfg.data.pomodoroWork * 60 
                            : this.cfg.data.pomodoroBreak * 60;
                        
                        this.toast(
                            this.pomodoroMode === 'work' 
                                ? (this.cfg.lang === 'ja' ? '休憩終了！作業を始めましょう' : 'Break over! Time to work')
                                : (this.cfg.lang === 'ja' ? '作業終了！休憩しましょう' : 'Work done! Take a break'),
                            'success'
                        );
                        this._playSound();
                        this._renderPomodoro(con);
                    }
                }, 1000);
                this.pomodoroRunning = true;
            }
            this._renderPomodoro(con);
        };
        
        // Reset button
        con.querySelector('#me-pomo-reset').onclick = () => {
            if (this.pomodoroInterval) {
                clearInterval(this.pomodoroInterval);
                this.pomodoroInterval = null;
            }
            this.pomodoroRunning = false;
            this.pomodoroTime = this.pomodoroMode === 'work' 
                ? this.cfg.data.pomodoroWork * 60 
                : this.cfg.data.pomodoroBreak * 60;
            this._renderPomodoro(con);
        };
        
        // Settings inputs
        con.querySelector('#me-pomo-work').onchange = (e) => {
            this.cfg.data.pomodoroWork = Math.max(1, Math.min(60, parseInt(e.target.value) || 25));
            if (this.pomodoroMode === 'work' && !this.pomodoroRunning) {
                this.pomodoroTime = this.cfg.data.pomodoroWork * 60;
                updateDisplay();
            }
        };
        
        con.querySelector('#me-pomo-break').onchange = (e) => {
            this.cfg.data.pomodoroBreak = Math.max(1, Math.min(30, parseInt(e.target.value) || 5));
            if (this.pomodoroMode === 'break' && !this.pomodoroRunning) {
                this.pomodoroTime = this.cfg.data.pomodoroBreak * 60;
                updateDisplay();
            }
        };
    }
    
    // ========================================
    // Markdown Widget
    // ========================================
    _renderMarkdown(con) {
        con.innerHTML = `
            <div class="me-md-container">
                <div class="me-md-editor">
                    <div class="me-md-toolbar">
                        <button class="me-md-btn" data-md="bold" title="Bold">${this._svgIcon('bold', 14)}</button>
                        <button class="me-md-btn" data-md="italic" title="Italic">${this._svgIcon('italic', 14)}</button>
                        <button class="me-md-btn" data-md="h1" title="Heading 1">${this._svgIcon('heading', 14)}</button>
                        <button class="me-md-btn" data-md="h2" title="Heading 2">H2</button>
                        <button class="me-md-btn" data-md="h3" title="Heading 3">H3</button>
                        <button class="me-md-btn" data-md="link" title="Link">${this._svgIcon('link', 14)}</button>
                        <button class="me-md-btn" data-md="code" title="Code">${this._svgIcon('code', 14)}</button>
                        <button class="me-md-btn" data-md="ul" title="List">${this._svgIcon('list', 14)}</button>
                        <button class="me-md-btn" data-md="quote" title="Quote">${this._svgIcon('quote', 14)}</button>
                    </div>
                    <textarea class="me-md-textarea" id="me-md-input" placeholder="${this.cfg.lang === 'ja' ? 'マークダウンを入力...' : 'Write markdown...'}">${this._escapeHtml(this.cfg.data.markdown || '')}</textarea>
                </div>
                <div class="me-md-preview" id="me-md-preview"></div>
            </div>
        `;
        
        const input = con.querySelector('#me-md-input');
        const preview = con.querySelector('#me-md-preview');
        
        const renderPreview = () => {
            preview.innerHTML = this._parseMarkdown(input.value);
        };
        
        input.oninput = () => {
            this.cfg.data.markdown = input.value;
            renderPreview();
            this.emit('change', { type: 'markdown', value: input.value });
        };
        
        // Toolbar buttons
        con.querySelectorAll('[data-md]').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.md;
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const selected = input.value.substring(start, end);
                let replacement = '';
                let cursorOffset = 0;
                
                switch (action) {
                    case 'bold':
                        replacement = `**${selected || 'bold text'}**`;
                        cursorOffset = selected ? 0 : -2;
                        break;
                    case 'italic':
                        replacement = `*${selected || 'italic text'}*`;
                        cursorOffset = selected ? 0 : -1;
                        break;
                    case 'h1':
                        replacement = `# ${selected || 'Heading 1'}`;
                        break;
                    case 'h2':
                        replacement = `## ${selected || 'Heading 2'}`;
                        break;
                    case 'h3':
                        replacement = `### ${selected || 'Heading 3'}`;
                        break;
                    case 'link':
                        replacement = `[${selected || 'link text'}](url)`;
                        break;
                    case 'code':
                        replacement = selected.includes('\n') 
                            ? `\`\`\`\n${selected || 'code'}\n\`\`\`` 
                            : `\`${selected || 'code'}\``;
                        break;
                    case 'ul':
                        replacement = `- ${selected || 'list item'}`;
                        break;
                    case 'quote':
                        replacement = `> ${selected || 'quote'}`;
                        break;
                }
                
                input.value = input.value.substring(0, start) + replacement + input.value.substring(end);
                input.focus();
                input.selectionStart = input.selectionEnd = start + replacement.length + cursorOffset;
                input.oninput();
            };
        });
        
        renderPreview();
    }
    
    _parseMarkdown(md) {
        if (!md) return '';
        
        let html = this._escapeHtml(md);
        
        // Code blocks (before other transformations)
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Bold and Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // Blockquotes
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');
        
        // Unordered lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Ordered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
        // Paragraphs (lines that aren't already wrapped)
        html = html.replace(/^(?!<[h|p|u|o|l|b|c|h]|<\/|$)(.+)$/gm, '<p>$1</p>');
        
        // Clean up
        html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');
        html = html.replace(/<\/ul>\n<ul>/g, '\n');
        
        return html;
    }
    
    // ========================================
    // Utility Methods
    // ========================================
    _playSound() {
        if (!this.cfg.enableNotifications) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const duration = MultiEditor.SOUND_DURATION;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            oscillator.stop(audioContext.currentTime + duration);
            
            // Clean up audio resources after sound finishes
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
                audioContext.close();
            };
        } catch (e) {
            // Audio not supported
        }
    }

    setTheme(name) {
        const root = this.container.querySelector('.me-root');
        if (!root) return;
        
        // Remove old theme classes
        this.themes.forEach(t => root.classList.remove(`t-${t}`));
        
        // Add new theme class
        root.classList.add(`t-${name}`);
        this.cfg.defaultStyle = name;
        
        this.emit('themeChange', { theme: name });
        if (this.cfg.onThemeChange) this.cfg.onThemeChange(name);
    }
    
    setLanguage(lang) {
        if (!this.i18n[lang]) return;
        
        this.cfg.lang = lang;
        this.t = this.i18n[lang];
        
        // Re-render everything with new language
        this._renderFramework();
        this._initCustomSelect();
        this.renderGrid();
        this.setTheme(this.cfg.defaultStyle);
        
        this.emit('languageChange', { lang });
    }
    
    // ========================================
    // Public API Methods
    // ========================================
    
    /**
     * Save all data
     */
    save() {
        this._saveToStorage();
        if (this.cfg.onSave) this.cfg.onSave(this.cfg.data);
        this.toast(this.t.saved, 'success');
        this.emit('save', { data: this.cfg.data });
    }
    
    /**
     * Export data as JSON file
     */
    exportData() {
        const data = {
            version: MultiEditor.VERSION,
            exportedAt: new Date().toISOString(),
            theme: this.cfg.defaultStyle,
            lang: this.cfg.lang,
            widgets: this.currentWidgets,
            data: this.cfg.data
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `multieditor-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.toast(this.cfg.lang === 'ja' ? 'エクスポート完了' : 'Export completed', 'success');
        this.emit('export', data);
    }
    
    /**
     * Import data from JSON file
     */
    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.data) this.cfg.data = { ...this.cfg.data, ...data.data };
                if (data.theme) this.setTheme(data.theme);
                if (data.lang) this.setLanguage(data.lang);
                if (data.widgets) {
                    this.currentWidgets = data.widgets.filter(w => this.activeTools.includes(w));
                }
                
                this.renderGrid();
                this._saveToStorage();
                
                this.toast(this.cfg.lang === 'ja' ? 'インポート完了' : 'Import completed', 'success');
                this.emit('import', data);
            } catch (err) {
                this.toast(this.cfg.lang === 'ja' ? 'インポートエラー' : 'Import error', 'error');
                console.error('MultiEditor import error:', err);
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const root = this.container.querySelector('.me-root');
        root.classList.toggle('fullscreen');
        this.emit('fullscreenToggle', { fullscreen: root.classList.contains('fullscreen') });
    }
    
    /**
     * Open settings panel
     */
    openSettings() {
        // Get current theme class from root
        const root = this.container.querySelector('.me-root');
        const themeClass = Array.from(root.classList).find(c => c.startsWith('t-')) || 't-slate';
        
        // Create overlay inside container so it inherits theme
        const overlay = document.createElement('div');
        overlay.className = `me-settings-overlay ${themeClass}`;
        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeSettings();
        };
        
        overlay.innerHTML = `
            <div class="me-settings-panel">
                <div class="me-settings-header">
                    <span>${this._svgIcon('settings', 18)} ${this.t.settings}</span>
                    <button class="me-settings-close" id="me-settings-close">${this._svgIcon('close', 16)}</button>
                </div>
                <div class="me-settings-body">
                    <div class="me-settings-group">
                        <label class="me-settings-label">${this.t.fontSize}</label>
                        <div class="me-settings-row">
                            <span>A</span>
                            <input type="range" class="me-settings-slider" id="me-font-slider" 
                                   min="${this.cfg.fontSizeMin}" max="${this.cfg.fontSizeMax}" value="${this.cfg.fontSize}">
                            <span style="font-size:1.4em;">A</span>
                            <span class="me-settings-value" id="me-font-value">${this.cfg.fontSize}px</span>
                        </div>
                    </div>
                    <div class="me-settings-group">
                        <label class="me-settings-label">${this.t.displayMode}</label>
                        <div class="me-settings-toggle">
                            <button class="me-settings-toggle-btn ${this.cfg.displayMode === 'grid' ? 'active' : ''}" data-mode="grid">
                                ${this._svgIcon('calendar', 14)} ${this.t.gridMode}
                            </button>
                            <button class="me-settings-toggle-btn ${this.cfg.displayMode === 'window' ? 'active' : ''}" data-mode="window">
                                ${this._svgIcon('windowMaximize', 14)} ${this.t.windowMode}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this._settingsOverlay = overlay;
        
        // Close button
        overlay.querySelector('#me-settings-close').onclick = () => this.closeSettings();
        
        // Font size slider
        const fontSlider = overlay.querySelector('#me-font-slider');
        const fontValue = overlay.querySelector('#me-font-value');
        fontSlider.oninput = () => {
            const size = parseInt(fontSlider.value);
            fontValue.textContent = size + 'px';
            this.setFontSize(size);
        };
        
        // Display mode toggle
        overlay.querySelectorAll('.me-settings-toggle-btn').forEach(btn => {
            btn.onclick = () => {
                const mode = btn.dataset.mode;
                overlay.querySelectorAll('.me-settings-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setDisplayMode(mode);
            };
        });
        
        this.emit('settingsOpen');
    }
    
    /**
     * Close settings panel
     */
    closeSettings() {
        if (this._settingsOverlay) {
            this._settingsOverlay.remove();
            this._settingsOverlay = null;
            this.emit('settingsClose');
        }
    }
    
    /**
     * Set font size
     */
    setFontSize(size) {
        size = Math.max(this.cfg.fontSizeMin, Math.min(this.cfg.fontSizeMax, size));
        this.cfg.fontSize = size;
        this._applyFontSize(size);
        this._saveToStorage();
        this.emit('fontSizeChange', { fontSize: size });
    }
    
    /**
     * Apply font size to root
     */
    _applyFontSize(size) {
        const root = this.container.querySelector('.me-root');
        if (root) {
            root.style.fontSize = size + 'px';
        }
    }
    
    /**
     * Set display mode
     */
    setDisplayMode(mode) {
        if (mode !== 'grid' && mode !== 'window') return;
        
        this.cfg.displayMode = mode;
        const root = this.container.querySelector('.me-root');
        
        if (mode === 'window') {
            root.classList.add('window-mode');
            this._initWindowMode();
        } else {
            root.classList.remove('window-mode');
            // Reset any window positioning
            this.container.querySelectorAll('.me-widget').forEach(w => {
                w.style.position = '';
                w.style.left = '';
                w.style.top = '';
                w.style.width = '';
                w.style.height = '';
                w.classList.remove('minimized', 'maximized', 'active');
            });
        }
        
        this._saveToStorage();
        this.emit('displayModeChange', { mode });
    }
    
    /**
     * Initialize window mode for widgets
     */
    _initWindowMode() {
        const grid = this.container.querySelector('#me-grid');
        const widgets = grid.querySelectorAll('.me-widget');
        const gridRect = grid.getBoundingClientRect();
        
        let offsetX = 20;
        let offsetY = 20;
        
        widgets.forEach((widget, index) => {
            // Restore saved position or set cascade
            const savedPos = this._widgetPositions?.[widget.dataset.id];
            
            if (savedPos) {
                widget.style.left = savedPos.left;
                widget.style.top = savedPos.top;
                widget.style.width = savedPos.width;
                widget.style.height = savedPos.height;
            } else {
                widget.style.left = offsetX + 'px';
                widget.style.top = offsetY + 'px';
                widget.style.width = '350px';
                widget.style.height = '300px';
                
                offsetX += 30;
                offsetY += 30;
                
                // Reset if too far right/down
                if (offsetX > gridRect.width - 200) offsetX = 20;
                if (offsetY > gridRect.height - 150) offsetY = 20;
            }
            
            // Make draggable
            this._makeWidgetDraggable(widget);
            
            // Bring to front on click
            widget.onclick = (e) => {
                if (!e.target.closest('.me-widget-h-btn')) {
                    widgets.forEach(w => w.classList.remove('active'));
                    widget.classList.add('active');
                }
            };
        });
    }
    
    /**
     * Make widget draggable in window mode
     */
    _makeWidgetDraggable(widget) {
        const header = widget.querySelector('.me-widget-h');
        if (!header) return;
        
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        let rafId = null;
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            // Cancel any pending animation frame
            if (rafId) cancelAnimationFrame(rafId);
            
            // Use requestAnimationFrame for smooth movement
            rafId = requestAnimationFrame(() => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                widget.style.left = (initialLeft + dx) + 'px';
                widget.style.top = (initialTop + dy) + 'px';
            });
        };
        
        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            
            // Cancel any pending animation frame
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            
            // Remove drag styling
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            widget.style.transition = '';
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this._saveWidgetPosition(widget);
        };
        
        header.addEventListener('mousedown', (e) => {
            // Ignore if clicking on buttons
            if (e.target.closest('.me-widget-h-btn')) return;
            
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = widget.offsetLeft;
            initialTop = widget.offsetTop;
            
            // Bring to front
            widget.classList.add('active');
            
            // Prevent text selection during drag
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';
            widget.style.transition = 'none';
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
    
    /**
     * Save widget position
     */
    _saveWidgetPosition(widget) {
        if (!this._widgetPositions) this._widgetPositions = {};
        
        this._widgetPositions[widget.dataset.id] = {
            left: widget.style.left,
            top: widget.style.top,
            width: widget.style.width,
            height: widget.style.height
        };
        
        this._saveToStorage();
    }
    
    /**
     * Minimize widget (window mode only)
     */
    minimizeWidget(widgetId) {
        const widget = this.container.querySelector(`.me-widget[data-id="${widgetId}"]`);
        if (widget) {
            widget.classList.toggle('minimized');
            widget.classList.remove('maximized');
        }
    }
    
    /**
     * Maximize widget (window mode only)
     */
    maximizeWidget(widgetId) {
        const widget = this.container.querySelector(`.me-widget[data-id="${widgetId}"]`);
        if (widget) {
            widget.classList.toggle('maximized');
            widget.classList.remove('minimized');
        }
    }
    
    /**
     * Show toast notification
     */
    toast(message, type = 'info') {
        // Get or create toast container
        let container = document.querySelector('.me-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'me-toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `me-toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), MultiEditor.TOAST_FADE_DURATION);
        }, MultiEditor.TOAST_DURATION);
    }
    
    /**
     * Get current data
     */
    getData() {
        return { ...this.cfg.data };
    }
    
    /**
     * Set data
     */
    setData(data) {
        this.cfg.data = { ...this.cfg.data, ...data };
        this.renderGrid();
        this._saveToStorage();
    }
    
    /**
     * Show specific widgets
     */
    showWidgets(widgetIds) {
        this.currentWidgets = widgetIds.filter(id => this.activeTools.includes(id));
        this.renderGrid();
        
        // Update toggle buttons
        this.container.querySelectorAll('[data-widget]').forEach(btn => {
            if (this.currentWidgets.includes(btn.dataset.widget)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
        return () => this.off(event, callback);
    }
    
    /**
     * Remove event listener
     */
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    /**
     * Emit event
     */
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`MultiEditor event error [${event}]:`, e);
            }
        });
        
        // Also call onChange if it's a change event
        if (event === 'change' && this.cfg.onChange) {
            this.cfg.onChange(data);
        }
    }
    
    /**
     * Register a plugin
     */
    registerPlugin(plugin) {
        if (typeof plugin.init === 'function') {
            plugin.init(this);
        }
        this.cfg.plugins.push(plugin);
    }
    
    /**
     * Add custom widget
     */
    addWidget(id, name, renderFn) {
        // Add to i18n
        Object.keys(this.i18n).forEach(lang => {
            this.i18n[lang][id] = name;
        });
        
        // Add to active tools
        if (!this.activeTools.includes(id)) {
            this.activeTools.push(id);
        }
        
        // Store render function
        this[`_render_${id}`] = renderFn;
        
        // Override _drawWidgetContent to handle custom widget
        const originalDraw = this._drawWidgetContent.bind(this);
        this._drawWidgetContent = (widgetId) => {
            if (widgetId === id) {
                const b = this.container.querySelector(`#b-${widgetId}`);
                if (b) renderFn.call(this, b);
            } else {
                originalDraw(widgetId);
            }
        };
        
        // Re-render framework to show new toggle button
        this._renderFramework();
        this._initCustomSelect();
    }
    
    /**
     * Add a new theme
     * @param {string} name - Theme name
     * @param {object} colors - Theme CSS variables
     */
    addTheme(name, colors) {
        if (!this.themes.includes(name)) {
            this.themes.push(name);
        }
        
        // Add CSS for new theme
        const themeCSS = `.me-root[data-theme="${name}"] {
            --bg: ${colors.bg || '#ffffff'};
            --card: ${colors.card || '#ffffff'};
            --text: ${colors.text || '#1f2937'};
            --text-muted: ${colors.textMuted || '#6b7280'};
            --border: ${colors.border || '#e5e7eb'};
            --accent: ${colors.accent || '#667eea'};
            --accent-hover: ${colors.accentHover || '#5a67d8'};
            --danger: ${colors.danger || '#ef4444'};
            --success: ${colors.success || '#10b981'};
            --warning: ${colors.warning || '#f59e0b'};
            ${colors.blur ? `--blur: ${colors.blur};` : ''}
            ${colors.customCSS || ''}
        }`;
        
        // Add to existing style or create new
        let styleEl = document.getElementById('me-custom-themes');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'me-custom-themes';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent += themeCSS;
        
        this.emit('themeAdded', { name, colors });
    }
    
    /**
     * Add a new language
     * @param {string} code - Language code (e.g., 'ko', 'es')
     * @param {string} name - Display name (e.g., '한국어', 'Español')
     * @param {object} translations - Translation dictionary
     */
    addLanguage(code, name, translations) {
        // Add to i18n
        this.i18n[code] = { ...this.i18n.en, ...translations };
        
        // Add to languages list
        if (!this._languages.find(l => l.code === code)) {
            this._languages.push({ code, name });
        }
        
        this.emit('languageAdded', { code, name });
    }
    
    /**
     * Add a custom toolbar button
     * @param {object} options - Button options
     * @param {string} options.id - Unique button ID
     * @param {string} options.icon - SVG icon name or custom HTML
     * @param {string} options.title - Button tooltip
     * @param {string} options.position - 'left' or 'right' (default: 'right')
     * @param {function} options.onClick - Click handler
     * @param {string} options.className - Additional CSS classes
     */
    addToolbarButton(options) {
        const { id, icon, title, position = 'right', onClick, className = '' } = options;
        
        this._customToolbarButtons.push({ id, icon, title, position, onClick, className });
        
        // Re-render to show new button
        this._renderFramework();
        this._initCustomSelect();
        
        this.emit('toolbarButtonAdded', { id });
    }
    
    /**
     * Remove a toolbar button
     * @param {string} id - Button ID to remove
     */
    removeToolbarButton(id) {
        this._customToolbarButtons = this._customToolbarButtons.filter(b => b.id !== id);
        this._renderFramework();
        this._initCustomSelect();
    }
    
    /**
     * Update toolbar layout
     * @param {object} layout - Layout options to update
     */
    setToolbarLayout(layout) {
        this.cfg.toolbarLayout = { ...this.cfg.toolbarLayout, ...layout };
        this._renderFramework();
        this._initCustomSelect();
    }
    
    /**
     * Add a custom SVG icon
     * @param {string} name - Icon name
     * @param {string} svg - SVG content (without outer svg tags is fine, will be wrapped)
     */
    addIcon(name, svg) {
        // Store in a custom icons map
        if (!this._customIcons) this._customIcons = {};
        this._customIcons[name] = svg;
    }
    
    /**
     * Get all registered languages
     */
    getLanguages() {
        return [...this._languages];
    }
    
    /**
     * Get all registered themes
     */
    getThemes() {
        return [...this.themes];
    }
    
    /**
     * Destroy instance
     */
    destroy() {
        // Clear intervals
        if (this._clockInterval) clearInterval(this._clockInterval);
        if (this._autoSaveInterval) clearInterval(this._autoSaveInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.stopwatchInterval) clearInterval(this.stopwatchInterval);
        if (this.pomodoroInterval) clearInterval(this.pomodoroInterval);
        
        // Clear container
        this.container.innerHTML = '';
        
        // Remove from instances
        MultiEditor.instances.delete(this.id);
        
        // Clean up styles if this was the last instance
        MultiEditor._styleRefCount = (MultiEditor._styleRefCount || 1) - 1;
        if (MultiEditor._styleRefCount <= 0) {
            const styleEl = document.getElementById('me-styles');
            if (styleEl) styleEl.remove();
        }
        
        this.emit('destroy', { id: this.id });
    }
    
    /**
     * Get instance by selector or id
     */
    static getInstance(selectorOrId) {
        if (MultiEditor.instances.has(selectorOrId)) {
            return MultiEditor.instances.get(selectorOrId);
        }
        
        const el = document.querySelector(selectorOrId);
        if (el && el.dataset.meId) {
            return MultiEditor.instances.get(el.dataset.meId);
        }
        
        return null;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiEditor;
}
if (typeof window !== 'undefined') {
    window.MultiEditor = MultiEditor;
}
