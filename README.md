# 📝 MultiEditor.js

**MultiEditor.js** は、カレンダー、コードエディタ、ToDoリスト、ポモドーロタイマーなど、生産性を高めるためのツールを1つの画面に凝縮した、**究極のモジュール型ワークスペース・ライブラリ**です。

グリッドレイアウトだけでなく、デスクトップのような**ウィンドウモード**にも対応しており、自分好みの作業環境を瞬時に構築できます。

---

## ✨ 主な機能

MultiEditor.jsは、標準で**10種類以上のウィジェット**を搭載しています。

| ウィジェット | アイコン | 説明 |
| --- | --- | --- |
| **Code Editor** | 📝 | 行番号表示、タブ入力対応のシンプルで軽量なエディタ |
| **Markdown** | 📄 | リアルタイムプレビュー機能を備えたMarkdownエディタ |
| **Calendar** | 📅 | イベントメモ機能付きのインタラクティブなカレンダー |
| **Todo List** | ✅ | タスクの追加、完了、削除ができるタスク管理ツール |
| **Pomodoro** | 🍅 | 集中と休憩のサイクルを管理するポモドーロタイマー |
| **World Clock** | 🕐 | タイムゾーン対応のデジタル時計 |
| **Calculator** | 🔢 | 計算履歴の残る多機能電卓 |
| **Timer / Stopwatch** | ⏱️ | カウントダウン通知とミリ秒精度の計測機能 |

---

## 🚀 クイックスタート

### 1. インストール

HTMLファイルにスクリプトを読み込みます。

```html
<script src="https://cdn.jsdelivr.net/gh/nvacod/multieditorjs/multieditor.js"></script>

```

### 2. コンテナの準備

エディタを表示するための要素を配置します。

```html
<div id="editor-container" style="height: 600px;"></div>

```

### 3. 初期化

JavaScriptでインスタンスを作成します。

```javascript
const editor = new MultiEditor('#editor-container', {
    lang: 'ja',
    defaultStyle: 'slate',
    autoSave: true
});

```

---

## 🎨 豊富なテーマとカスタマイズ

**15種類以上の美しいテーマ**をプリセット。`glass`（グラスモーフィズム）や`neon`（ダークモード）など、気分に合わせて変更可能です。

### ウィンドウモード

`displayMode: 'window'` を設定することで、各ウィジェットをデスクトップアプリのように自由に移動・リサイズ・最小化できます。

```javascript
editor.setDisplayMode('window');

```

---

## ⚙️ 設定オプション (Configuration)

詳細なカスタマイズが可能です。

```javascript
const editor = new MultiEditor('#editor', {
    // 外観
    width: '100%',
    height: '800px',
    defaultStyle: 'indigo', // slate, glass, neon, sunset etc...
    
    // 言語設定
    lang: 'ja', // 'ja', 'en', 'zh'
    
    // 機能制限
    allowTool: ['calendar', 'editor', 'todo'], // 使用するウィジェットを限定
    
    // 自動保存
    autoSave: true,
    autoSaveInterval: 30000, // 30秒ごとに保存
    storageKey: 'my_workspace_data',
    
    // コールバック
    onSave: (data) => console.log('保存されました', data),
});

```

---

## 🔌 プラグインシステム

独自のウィジェットやテーマを追加して、機能を拡張できます。

```javascript
editor.registerPlugin({
    init(editor) {
        // カスタムウィジェットの追加
        editor.addWidget('weather', '天気', function(container) {
            container.innerHTML = '<div>☀️ 晴れ</div>';
        });
    }
});

```

---

## ⌨️ キーボードショートカット

| ショートカット | アクション |
| --- | --- |
| `Ctrl / Cmd + S` | データの保存 |
| `Ctrl / Cmd + E` | JSON形式でデータをエクスポート |
| `Escape` | 全画面表示の解除 |
| `Tab` | 4マスのスペース挿入 (エディタ内) |

---

## 📄 ライセンス

MIT License

* `LICENSE`ファイル（MIT等）のテンプレート作成
