# 風，在歌裡 — 視覺系統

明亮、輕快的音樂探索工具，純白閱讀頁面與藍綠互動重點。產品閱讀介面，使用系統中文字體，內容優先。

## Color

背景 oklch(1 0 0)、正文 oklch(.23 .012 200)、品牌 oklch(.45 .074 200)、次要文字 oklch(.46 .018 200)、分隔 oklch(.89 .012 200)、表面 oklch(.97 .012 200)、選取 oklch(.94 .025 200)、收藏 oklch(.92 .10 85)。待核對資訊用 oklch(.35 .065 75) 文字與 oklch(.97 .035 85) 背景。

## Typography

單一系統字體，優先 PingFang TC / Microsoft JhengHei。caption .875rem、body 1rem、lead 1.125rem、subheading 1.5rem、heading 2rem、display 3rem。平板 h1 2.5rem、手機 h1 2rem、窄手機 h1 1.75rem；手機歌曲一句話 1.25rem。字級都使用 rem，正文行高 1.9，UI 1.65，h1 1.25–1.35。大標題字距 -.025em，歌曲標題 -.02em。intro-symbol 是装飾字，桌面 6rem、窄桌面 4rem。正文最大寬度 40em；完整歌曲內容由閱讀欄寬限制。

## Spacing & layout

4pt 基礎尺度：.25、.5、.75、1、1.5、2、3、4rem。實際間距用 :root 语意 token。分隔線與進度條屬細節尺寸；最小觸控區 44px，輸入高48px。整頁最大1280px，桌面240px目錄＋自適應內容，1100px以下目錄200px；850px以下單欄，目錄改原生 dialog。手機水平留白1rem。

## Components & behavior

閱讀模式使用原生 radio 選項與 :has(:checked) 樣式，基本切換不依賴 JavaScript；JavaScript 只處理模式保存與閱讀位置。歌曲是依序伸展的 article，details 展開深入內容；演前速讀隱藏完整文章。搜尋與主題／收藏筛選交集；空結果可重設。收藏與已讀分離，localStorage 儲存失败时仍可閱讀。本文不使用照片、外部字體或外部 JavaScript。

## Motion & accessibility

狀態颜色過渡160ms。錨點平滑捲動尊重 reduced-motion。每個互動元素有3px焦點外框；dialog 提供原生焦點管理和 Escape 退出。UI 控件可用鍵盤，文字允許瀏覽器放大。版面與字體需透過独立設計評估及機械掃描，瀏覽器工具可用時再進行實際視覺驗證。
