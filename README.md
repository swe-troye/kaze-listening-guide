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

動漫頁下方內嵌當前歌曲的Spotify播放器，點播放器的▶開始聽。翻頁或跳章節時切換到對應歌曲，並移除上一首播放器停止其播放；切換導聆內容標籤不重載播放器。18個曲目ID已與來源歌單核對，未改用搜尋猜測版本。連續快速翻頁以150ms合併，只載入最後停下的歌曲。

播放由Spotify提供，需連網；完整播放或預覽依Spotify帳號、地區及瀏覽器支援而定。網站不自動播放、不要求網站帳號或Spotify API金鑰；播放器無法載入時仍可閱讀，也可用旁邊「在Spotify聽」開啟對應歌曲。離線HTML仍能讀導聆，播放器需要網路。

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

`npm test`：6 項資料／來源結構、搜尋、篩選與儲存測試。

`npm run build`：產生 dist 與兩份 standalone HTML；檢查語法、資產及 app 引用的靜態 DOM ID，避免再次交付缺少控制區 ID 的頁面。

2026-10-28 已使用真實 Edge 156.0.4314.42 的 headless 程序驗證 `file://` 單檔，12 組瀏覽器檢查全部通過且無頁面 JavaScript 錯誤。涵蓋滑鼠／鍵盤模式切換、保存恢復、閱讀位置、來源展開、搜尋、篩選、收藏、已讀、空結果重設、手機目錄，以及 localStorage 不可用。測試尺寸為桌面 1440px、平板 768px、手機 390px／320px，並檢查水平溢出與實際截圖。

瀏覽器回歸腳本為 `scripts/browser-check.cjs`。它是開發用檢查，需要已有的 Playwright Core 與 Edge，不是網站的執行依賴。可透過 `KAZE_PLAYWRIGHT_MODULE` 指定模組路徑、`KAZE_BROWSER_PATH` 指定瀏覽器、`KAZE_QA_DIR` 指定截圖目錄；`KAZE_SITE_URL` 可指定公開網站進行同樣檢查，再執行 `node scripts/browser-check.cjs`。本次使用系統已提供的 Playwright Core，沒有新增 npm 套件。

動漫頁瀏覽器檢查：`node scripts/anime-browser-check.cjs`，使用同樣環境變數。涵蓋18首內容與來源、標籤／翻頁鍵盤、章節搜尋與對話框焦點、分享和保存、儲存受限、滑動、快速連點、減少動態、7種橫直式尺寸、200%文字與全螢幕失敗處理。預設檢查離線雙頁，`KAZE_SITE_URL` 可改為本機HTTP或公開首頁。

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
