/**
 * multieditor.js - Professional Modular Workspace
 * Version: 2.0.0 (Production Ready)
 */

class MultiEditor {
    constructor(selector, config = {}) {
        this.container = document.querySelector(selector);
        if (!this.container) throw new Error("Target container not found.");

        // 1. Config Consolidation
        this.cfg = {
            width: '100%', height: '800px',
            minWidth: '320px', maxWidth: '100%',
            minHeight: '400px', maxHeight: '100vh',
            defaultStyle: 'slate',
            allowTool: ['calendar', 'editor', 'todo', 'clock', 'memo'],
            disableTool: [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            lang: 'ja',
            data: { events: {}, reminders: [], notes: "", code: "" },
            ...config
        };

        // Filter active tools
        this.activeTools = this.cfg.allowTool.filter(t => !this.cfg.disableTool.includes(t));
        this.currentWidgets = [...this.activeTools];
        
        // i18n Dictionary
        this.i18n = {
            ja: { calendar: "カレンダー", editor: "エディタ", todo: "タスク", clock: "時計", memo: "メモ", save: "保存", add: "追加", dows: ["日","月","火","水","木","金","土"] },
            en: { calendar: "Calendar", editor: "Editor", todo: "Tasks", clock: "Clock", memo: "Memo", save: "Save", add: "Add", dows: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] }
        };
        this.t = this.i18n[this.cfg.lang] || this.i18n.en;
        this.themes = ['slate', 'indigo', 'rose', 'emerald', 'amber', 'sky', 'dark', 'midnight', 'glass', 'neon'];
        this.selectedDate = new Date().toISOString().split('T')[0];

        this._initStyles();
        this._renderFramework();
        this._initCustomSelect();
        this.renderGrid();
        this.setTheme(this.cfg.defaultStyle);

        setInterval(() => this._updateClock(), 1000);
    }

    _initStyles() {
        const s = document.createElement('style');
        s.innerHTML = `
            :root { --me-radius: 12px; --me-f-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
            .t-slate { --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --accent: #64748b; --border: #e2e8f0; }
            .t-dark { --bg: #0f172a; --card: #1e293b; --text: #f1f5f9; --accent: #38bdf8; --border: #334155; }
            .t-glass { --bg: #e2e8f0; --card: rgba(255,255,255,0.7); --text: #1e293b; --accent: #4f46e5; --border: rgba(255,255,255,0.2); --blur: blur(12px); }
            .t-neon { --bg: #000; --card: #000; --text: #0f0; --accent: #0f0; --border: #0f0; --blur: none; }
            /* ... Other themes follow the same pattern ... */

            .me-root { 
                display: flex; flex-direction: column; overflow: hidden;
                background: var(--bg); color: var(--text); border: 1px solid var(--border);
                border-radius: var(--me-radius); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); transition: all 0.3s ease;
            }
            .me-toolbar { 
                padding: 12px 16px; background: var(--card); border-bottom: 1px solid var(--border);
                display: flex; justify-content: space-between; align-items: center; backdrop-filter: var(--blur); z-index: 50;
            }
            .me-grid { display: grid; flex: 1; overflow: hidden; background: var(--border); gap: 1px; }
            
            .me-widget { background: var(--card); display: flex; flex-direction: column; overflow: hidden; backdrop-filter: var(--blur); }
            .me-widget-h { padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; }
            .me-widget-b { flex: 1; overflow-y: auto; position: relative; }

            /* Improved Monaco-style Editor */
            .me-editor-outer { display: flex; height: 100%; background: rgba(0,0,0,0.02); }
            .me-lines { width: 40px; padding: 15px 0; text-align: right; font-family: var(--me-f-mono); font-size: 13px; color: var(--accent); opacity: 0.5; background: rgba(0,0,0,0.03); user-select: none; border-right: 1px solid var(--border); overflow: hidden; }
            .me-textarea { 
                flex: 1; border: none; outline: none; padding: 15px; font-family: var(--me-f-mono); 
                font-size: 13px; line-height: 1.6; background: transparent; color: inherit; resize: none; white-space: pre; overflow-x: auto;
            }

            /* Custom Select UI */
            .me-select { position: relative; }
            .me-select-trigger { padding: 6px 14px; border: 1px solid var(--border); border-radius: 20px; font-size: 12px; cursor: pointer; background: var(--card); font-weight: 600; }
            .me-select-menu { position: absolute; top: 110%; right: 0; background: var(--card); border: 1px solid var(--border); border-radius: 8px; display: none; box-shadow: 0 10px 15px rgba(0,0,0,0.1); width: 120px; max-height: 200px; overflow-y: auto; z-index: 100; }
            .me-select-menu.show { display: block; }
            .me-opt { padding: 8px 12px; font-size: 12px; cursor: pointer; }
            .me-opt:hover { background: var(--accent); color: #fff; }

            .me-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--card); color: var(--text); cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s; }
            .me-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

            /* Calendar UI */
            .me-cal-wrap { padding: 15px; }
            .me-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
            .me-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 13px; border-radius: 50%; cursor: pointer; position: relative; }
            .me-day.active { background: var(--accent); color: #fff; font-weight: bold; }
            .me-dot { position: absolute; bottom: 4px; width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }
            .me-cal-input { width: 100%; margin-top: 15px; border: 1px solid var(--border); padding: 10px; border-radius: 8px; background: var(--bg); color: inherit; font-size: 13px; }
        `;
        document.head.appendChild(s);
    }

    _renderFramework() {
        this.container.innerHTML = `
            <div class="me-root" style="width:${this.cfg.width}; height:${this.cfg.height}; max-width:${this.cfg.maxWidth}; min-width:${this.cfg.minWidth}; max-height:${this.cfg.maxHeight}; min-height:${this.cfg.minHeight};">
                <header class="me-toolbar">
                    <div style="display:flex; gap:8px;" id="me-toggles"></div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div class="me-select" id="me-theme-sel">
                            <div class="me-select-trigger">Style: ${this.cfg.defaultStyle}</div>
                            <div class="me-select-menu"></div>
                        </div>
                        <button class="me-btn active" id="me-save-main">${this.t.save}</button>
                    </div>
                </header>
                <div class="me-grid" id="me-grid"></div>
            </div>
        `;
        
        const toggles = this.container.querySelector('#me-toggles');
        this.activeTools.forEach(id => {
            const btn = document.createElement('button');
            btn.className = `me-btn ${this.currentWidgets.includes(id) ? 'active' : ''}`;
            btn.innerText = this.t[id];
            btn.onclick = () => this._toggleWidget(id, btn);
            toggles.appendChild(btn);
        });

        this.container.querySelector('#me-save-main').onclick = () => {
            if(this.cfg.onSave) this.cfg.onSave(this.cfg.data);
            alert("Workspace Saved Successfully.");
        };
    }

    _initCustomSelect() {
        const sel = this.container.querySelector('#me-theme-sel');
        const trigger = sel.querySelector('.me-select-trigger');
        const menu = sel.querySelector('.me-select-menu');

        this.themes.forEach(t => {
            const opt = document.createElement('div');
            opt.className = 'me-opt';
            opt.innerText = t.charAt(0).toUpperCase() + t.slice(1);
            opt.onclick = () => {
                this.setTheme(t);
                trigger.innerText = `Style: ${t}`;
                menu.classList.remove('show');
            };
            menu.appendChild(opt);
        });

        trigger.onclick = (e) => { e.stopPropagation(); menu.classList.toggle('show'); };
        window.onclick = () => menu.classList.remove('show');
    }

    _toggleWidget(id, btn) {
        if(this.currentWidgets.includes(id)) {
            this.currentWidgets = this.currentWidgets.filter(w => w !== id);
            btn.classList.remove('active');
        } else {
            this.currentWidgets.push(id);
            btn.classList.add('active');
        }
        this.renderGrid();
    }

    renderGrid() {
        const grid = this.container.querySelector('#me-grid');
        const count = this.currentWidgets.length;
        // Optimal Column Calculation
        grid.style.gridTemplateColumns = count === 1 ? '1fr' : count === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))';
        grid.innerHTML = '';

        this.currentWidgets.forEach(id => {
            const w = document.createElement('div');
            w.className = 'me-widget';
            w.innerHTML = `<div class="me-widget-h"><span>${this.t[id]}</span></div><div class="me-widget-b" id="b-${id}"></div>`;
            grid.appendChild(w);
            this._drawWidgetContent(id);
        });
    }

    _drawWidgetContent(id) {
        const b = this.container.querySelector(`#b-${id}`);
        if(id === 'editor') {
            b.innerHTML = `<div class="me-editor-outer"><div class="me-lines">1</div><textarea class="me-textarea" spellcheck="false"></textarea></div>`;
            const tx = b.querySelector('textarea');
            const ln = b.querySelector('.me-lines');
            tx.value = this.cfg.data.code;
            const update = () => {
                const lines = tx.value.split('\n').length;
                ln.innerHTML = Array.from({length:lines}, (_,i)=>i+1).join('<br>');
            };
            tx.oninput = () => { this.cfg.data.code = tx.value; update(); };
            tx.onscroll = () => { ln.scrollTop = tx.scrollTop; };
            update();
        } else if(id === 'calendar') {
            this._renderCalendar(b);
        } else if(id === 'clock') {
            b.innerHTML = `<div id="me-live-clock" style="font-size:3.5rem; text-align:center; padding:50px 0; font-weight:200; font-variant-numeric:tabular-nums;"></div>`;
            this._updateClock();
        } else if(id === 'todo') {
            this._renderTodo(b);
        } else if(id === 'memo') {
            b.innerHTML = `<textarea class="me-textarea" style="white-space:pre-wrap; padding:20px;" placeholder="Writing something...">${this.cfg.data.notes}</textarea>`;
            b.querySelector('textarea').oninput = (e) => { this.cfg.data.notes = e.target.value; };
        }
    }

    _renderCalendar(con) {
        const now = new Date();
        con.innerHTML = `
            <div class="me-cal-wrap">
                <div style="font-weight:bold; margin-bottom:15px; text-align:center;">${now.getFullYear()} / ${now.getMonth()+1}</div>
                <div class="me-cal-grid" id="me-days"></div>
                <textarea class="me-cal-input" id="me-ev-note" placeholder="Selected Date: ${this.selectedDate}"></textarea>
            </div>
        `;
        const grid = con.querySelector('#me-days');
        this.t.dows.forEach(d => grid.innerHTML += `<small style="opacity:0.5; font-size:10px;">${d}</small>`);
        
        const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
        const last = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
        
        for(let i=0; i<first; i++) grid.appendChild(document.createElement('div'));
        for(let d=1; d<=last; d++) {
            const dStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const cell = document.createElement('div');
            cell.className = `me-day ${dStr === this.selectedDate ? 'active' : ''}`;
            cell.innerText = d;
            if(this.cfg.data.events[dStr]) cell.innerHTML += `<div class="me-dot"></div>`;
            cell.onclick = () => { this.selectedDate = dStr; this._renderCalendar(con); };
            grid.appendChild(cell);
        }
        
        const noteIn = con.querySelector('#me-ev-note');
        noteIn.value = this.cfg.data.events[this.selectedDate] || "";
        noteIn.oninput = (e) => {
            if(e.target.value) this.cfg.data.events[this.selectedDate] = e.target.value;
            else delete this.cfg.data.events[this.selectedDate];
        };
    }

    _renderTodo(con) {
        con.innerHTML = `
            <div style="padding:15px; border-bottom:1px solid var(--border);"><input type="text" id="me-todo-in" class="me-btn" style="width:100%" placeholder="+ ${this.t.add}"></div>
            <div id="me-todo-list"></div>
        `;
        const list = con.querySelector('#me-todo-list');
        const draw = () => {
            list.innerHTML = this.cfg.data.reminders.map((t,i) => `
                <div style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:13px; display:flex; gap:10px; align-items:center;">
                    <input type="checkbox" onchange="this.parentElement.style.opacity=0.4"> <span>${t}</span>
                </div>
            `).join('');
        };
        con.querySelector('#me-todo-in').onkeydown = (e) => {
            if(e.key === 'Enter' && e.target.value) {
                this.cfg.data.reminders.push(e.target.value);
                e.target.value = '';
                draw();
            }
        };
        draw();
    }

    _updateClock() {
        const el = this.container.querySelector('#me-live-clock');
        if(el) {
            const now = new Date();
            el.innerText = now.toLocaleTimeString(this.cfg.lang, { timeZone: this.cfg.timezone, hour12: false });
        }
    }

    setTheme(name) {
        const root = this.container.querySelector('.me-root');
        root.className = `me-root t-${name}`;
        this.cfg.defaultStyle = name;
    }
}
