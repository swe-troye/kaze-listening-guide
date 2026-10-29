# 風，在歌裡

藤井風的繁體中文演前導聆。18 首來自使用者提供的 Spotify 預習歌單，並非官方演出曲目。

## 開啟網站

公開分享網址：https://swe-troye.github.io/kaze-listening-guide/

GitHub Pages 儲存庫：https://github.com/swe-troye/kaze-listening-guide 。包含完整網站原始碼、設計文件、來源紀錄、交接與建置／測試腳本。

直接以 Edge 或其他現代瀏覽器開啟 `dist/standalone.html`。這個單檔包含全部內容、樣式與互動；更新後請重新整理，確認每首顯示「完整原文・中譯已讀」。收藏與已讀保存在目前瀏覽器，直接開檔的儲存支援依瀏覽器而異。

也可執行 `npm start`，瀏覽 http://localhost:4173 。`npm run preview` 預覽 dist。網站無第三方執行依賴，已部署至 GitHub Pages。

動漫導聆：https://swe-troye.github.io/kaze-listening-guide/anime.html 。首頁「進入動漫導聆」會另開分頁；18首橫式動漫章節使用原創向量角色插畫，可按左右鍵、點上下首、左右滑動，或搜尋章節。每首有三種內容與完整來源；手機直式也能閱讀，橫拿可展開構圖。支援減少動態效果、裝置内章節保存及 `#song-曲目ID` 分享。

離線使用時請把建置產生的 `standalone.html` 與 `anime-standalone.html` 放在同一目錄，兩頁皆內嵌自己的內容、樣式及圖片，互相連結。

## 邊讀邊聽

動漫頁沿用 Vaundy repo 的原生音訊方案，提供當前歌曲約 30 秒的公開試聽。按「開始試聽」或首次導言的「開始聽歌」後，翻頁或跳章節會接著播放；試聽播完自動前往下一首，最後一首播完停止。暫停後換歌保持暫停，切換導聆內容標籤不影響播放。開啟「在 Spotify 聽」會先暫停本站試聽，完整歌曲請到 Spotify 收聽。

18 個試聽連結直接從對應 Spotify 曲目公開 embed 資料核對，保留原歌單的曲目版本與順序；試聽音訊需要連網，不需 API Key 或登入本站。首次開頁不強制出聲；若瀏覽器阻擋或連線失敗，頁面會顯示重試提示，閱讀與 Spotify 連結仍可使用。離線 HTML 仍可讀導聆，音訊需要網路。

以同一個 HTMLAudioElement 保留首次播放授權，並以音訊時間真正前進確認播放。Edge 與桌面 WebKit 的 iPhone 模式已驗證換歌續播、暫停後換歌、原生 ended 事件自動切歌，以及播放被拒與載入中取消；尚未在實體 iPhone 測試。

## 內容與來源

2026-10-28 已逐首打開、讀完 18 首的原文與外部中文翻譯（含重複副歌與尾聲），重寫摘要、歌詞大意與聆聽重點。原文主要為 KKBOX，對照 marumaru；中譯使用 marumaru 或有署名的方格子文章。每首附來源連結、閱讀範圍、日期、譯者／轉載資訊與必要的譯法分歧。

本站只提供原創中文摘要，不轉貼完整歌詞或逐句翻譯。外部中譯不自動視為官方翻譯；意境與提問為編輯延伸。〈何なんw〉另閱讀 VoiceTube 收錄的本人解說英文字幕，作者說明與延伸聽法分開呈現。這不代表觀看或聽完全部官方影片。

完整核對記錄見 [SOURCES.md](SOURCES.md)。歌單為 2026-10-28 的 Spotify 桌面版快照，建立者 The Sound Of: Artists；順序與曲目可能更新。

2026-10-29 依使用者提供的易讀範例重寫18首導聆，首頁新增「Prema是什麼」介紹，動漫頁第一次進入顯示導言，也可從頁首Prema按鈕重讀。已閱讀Apple Music本人訪談與9首逐曲解說的中英文版，補入倦怠、全英文挑戰、合作背景與4首本人說明；專輯資料與高雄場次另核對官方頁面。舞台橋段未當作10/31演出保證。最新瀏覽器回歸為文字版13組、動漫版13組（含Spotify），包含導言與18首白話欄位。

## 操作

- 慢慢讀：歌名意思、核心意思、歌詞亮點與可展開的深入內容。
- 演前速讀：一句話與聆聽重點，保留閱讀位置。
- 兩種模式均能展開原文與中文翻譯來源。
- 中英日文歌名搜尋、主題篩選、只看收藏。
- 收藏、手動已讀、裝置內進度；儲存失敗仍可閱讀。
- 桌面目錄、手機歌曲目錄、深連結、鍵盤操作與減少動態效果。

## 建置與驗證

`npm test`：7 項資料／來源結構、搜尋、篩選與儲存測試。

`npm run build`：產生 dist 與兩份 standalone HTML；檢查語法、資產及 app 引用的靜態 DOM ID，避免再次交付缺少控制區 ID 的頁面。

2026-10-28 已使用真實 Edge 156.0.4314.42 的 headless 程序驗證 `file://` 單檔，12 組瀏覽器檢查全部通過且無頁面 JavaScript 錯誤。涵蓋滑鼠／鍵盤模式切換、保存恢復、閱讀位置、來源展開、搜尋、篩選、收藏、已讀、空結果重設、手機目錄，以及 localStorage 不可用。測試尺寸為桌面 1440px、平板 768px、手機 390px／320px，並檢查水平溢出與實際截圖。

瀏覽器回歸腳本為 `scripts/browser-check.cjs`。它是開發用檢查，需要已有的 Playwright Core 與 Edge，不是網站的執行依賴。可透過 `KAZE_PLAYWRIGHT_MODULE` 指定模組路徑、`KAZE_BROWSER_PATH` 指定瀏覽器、`KAZE_QA_DIR` 指定截圖目錄；`KAZE_SITE_URL` 可指定公開網站進行同樣檢查，再執行 `node scripts/browser-check.cjs`。本次使用系統已提供的 Playwright Core，沒有新增 npm 套件。

動漫頁瀏覽器檢查：`node scripts/anime-browser-check.cjs`，使用同樣環境變數。涵蓋18首內容與來源、標籤／翻頁鍵盤、章節搜尋與對話框焦點、分享和保存、儲存受限、滑動、快速連點、減少動態、7種橫直式尺寸、200%文字與全螢幕失敗處理。預設檢查離線雙頁，`KAZE_SITE_URL` 可改為本機HTTP或公開首頁。

原生音訊實播檢查：`node scripts/playback-check.cjs`（Edge）、`node scripts/playback-check.cjs --webkit`（WebKit）。使用系統已有 Playwright Core；WebKit 安裝位置可透過 `PLAYWRIGHT_BROWSERS_PATH` 指定。

## 已修正的 Edge 切換問題

閱讀控制區原本只有 class，缺少 app 需要的 `reading-controls` ID。初始化和切換時呼叫 `getBoundingClientRect()` 因找不到元素拋錯；切換程式又先恢復舊 radio 狀態，造成點擊後看似無反應。已補上 ID，並以真實瀏覽器重現前後差異及驗證修正。

2026-10-28 GitHub Pages 發布成功。所有 6 個公開資產 HTTP 200，SHA-256 與本機建置相符；公開網址的同一套 12 組 Edge 瀏覽器檢查全部通過。

## 後續修改與發布

本機專案已接上上述 GitHub 儲存庫，`main` 是 GitHub Pages 的發布分支，網站使用根目錄的 index.html 與資產。

修改來源後執行：

```sh
npm test
npm run build
git add .
git commit -m "Describe the update"
git push origin main
```

推送後 GitHub Pages 會自動重新發布。`dist/`、`release/`、`node_modules/` 與環境變數檔案已排除版本控制；dist 可由原始碼重建。新 session 先讀 HANDOFF.md 即可接續。

## 動漫人像的製作方式

`assets/kaze-guide.svg` 是直接編寫 SVG 向量路徑繪製的原創 2D 動漫角色，不是圖片生成 API 的輸出。新版參考《LOVE ALL SERVE ALL》封面氣質，以蓬鬆捲髮、圓潤臉型、閉眼小笑容、淡珊瑚眼妝與腮紅呈現更年輕可愛的神情；輪廓、五官、襯衫與項鍊由 `<path>`、`<circle>` 和平面色塊組成；背景與角色分層，背景由 `anime.html` 的 SVG 與 `anime.css` 配色呈現，翻頁由 `anime.js` 的 Web Animations API 驅動。SVG 自帶透明背景，可直接編輯、縮放，不需要 OPENAI_API_KEY，也沒有生圖 API 費用。

2026/10/29 已回查原始 session：`rollout-2026-10-28T11-14-29-01a18080-87e8-77e3-bb61-181004bf314b.jsonl`。紀錄在 2026-10-28 16:03 UTC 確認使用原創向量角色，16:08 UTC 透過 shell 將 SVG 原始碼寫入 `assets/kaze-guide.svg`；Git 提交 `db5a608` 收錄該插畫。這是可重現的製作方法，不需尋找隱藏的生圖工具。延伸網站可沿用向量方式，另畫新藝人人像，不把藤井風角色當作另一位藝人。


## YouTube 歌詞跟唱

[開啟歌詞跟唱](https://swe-troye.github.io/kaze-listening-guide/youtube.html)。首頁與動漫頁都有入口，動漫頁會帶入目前歌曲。參考同作者 Vaundy repo 的歌詞頁，支援完整 YouTube 影片、原文／原創繁中逐句高亮、點句跳播、漢字讀音與翻譯切換、字級、跟隨播放、速度、單句／A–B 循環、逐影片時間微調、本機 LRC 匯入與還原；播放完畢會接下一首，最後一首停止。第一次需要使用者按播放，瀏覽器阻擋時會提示點影片的播放鍵。

18 首原文取自使用者提供的 `fujii_kaze_18_lrc.zip`；繁中為本站原創翻譯，沒有複製 marumaru 的逐句中譯。17 首影片與參考時間軸來自各曲 marumaru 頁；〈Okay, Goodbye〉未找到該站對照頁，使用官方音源與原始 LRC。已依同一支影片的參考時間重新對齊，包含〈何なんw〉約 +5 秒、〈Feelin’ Go(o)d〉約 +15 秒、〈満ちてゆく〉約 +14 秒的差異。202 個起點為推算，67 個起點保留原時軸待核對；並未逐句實聽全部影片。方法與逐曲狀態見 [對照報告](outputs/kaze-youtube-alignment.md)。

`youtube-data.js` 保存影片與選用來源；`youtube-lrc.js` 保存雙語歌詞、ZIP 雜湊與對照狀態；`youtube-readings.js` 是保持原文的 ruby 片段；`youtube-core.js` 解析 LRC。所有靜態資產已提交，執行不需 API Key 或生圖 API。YouTube 頁需透過 HTTP(S) 開啟（`npm start` 或 Pages）；直接 `file://` 開啟的獨立導聆仍可閱讀，歌詞入口需相鄰靜態資產與本機伺服器。

`npm test` 包含核心與歌詞資料／時間軸測試。新增瀏覽器驗證：

```sh
KAZE_SITE_URL=http://127.0.0.1:4175/ node scripts/youtube-browser-check.cjs
KAZE_SITE_URL=http://127.0.0.1:4175/ node scripts/youtube-live-check.cjs
KAZE_BROWSER=webkit KAZE_SITE_URL=http://127.0.0.1:4175/ node scripts/youtube-live-check.cjs
```

前者使用受控 IFrame API 測試互動與版面；後者使用真實 YouTube，兩種結果分開記錄。可透過 `KAZE_PLAYWRIGHT_MODULE` 和 `KAZE_BROWSER_PATH` 指定本機 Playwright／Chromium；WebKit 需已安裝。資料生成腳本 `scripts/build-youtube-data.py` 的輸入為本機研究與使用者檔案，原始外部快照不會提交；日常部署只需 `npm run build`。

本次驗證：15 項核心／歌詞測試、24 項受控歌詞頁互動與版面、首頁／動漫頁各 13 項通過。本機來源的 YouTube 在 Edge／WebKit 顯示「無法播放這部影片」；公開 Pages 網域可播放。已修正前置廣告的 ID 與時間不能當歌曲時間，廣告期間顯示等待並隔離高亮／跳播。修正版在公開網域的 Edge 真實播放、內建雙語跳播、本機 LRC 跳播、下一首續播均通過；瀏覽器與影片限制仍由官方播放器處理。
