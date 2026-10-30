# 青春ポップス統合LP｜運用メモ（2026-10-30）
 
## 公開
- 本番（GitHub Pages）: https://kens-pro.github.io/seisyun/
- 元のLPのバックアップ: `index-backup-2026-10.html`
- 制作・検証用の同内容版: `preview-2026.html`
- 会社公式サイトの既存LP `https://www.toriimusic.co.jp/lp/seishun_lp/` は**別サーバー**。GitHubを更新しても自動的には更新されない。

## 設計方針
- 目的：無料体験・見学のフォーム送信（入会は後日判断）
- 訴求：「あの頃の歌が、今の楽しみになる」「家族のために走ってきた人へ。今度は私の番」
- 3つの価値：歌う・動く・仲間と笑う。写真は「実際の教室ではない」と明記。
- ヤマハ公式（https://school.jp.yamaha.com/music/seishun/）のプログラム・曲・料金を参考に記載。
- 体験候補日：2026-11-11、2026-11-25（担当者が折り返し確認）。過去日はブラウザのJavaScriptで選択肢から自動削除する。
- 月会費4,070円、入会金2,200円（税込）。施設費の有無は確認すること。

## フォーム・計測
- 受付先: 現行のFormspree ID `xpqvlzzk` を維持（別アカウントや新規契約はしていない）。
- フィールド: 氏名・電話・任意メール・体験/見学・希望日・任意備考・同意。Bot対策用のhoneypotあり。
- FormspreeのHTTP成功応答時のみ `seisyun_form_success` をdataLayerへ送信。実際の通知先で受信できるかは**スタッフが実メールで要確認**。
- GTM `GTM-MSD7G7FP`、Clarity `xqcz15bcnj` は旧LPのIDを継承。データレイヤーイベント：`seisyun_form_open`、`seisyun_phone_click`、`seisyun_details_click`、`seisyun_video_play`、`seisyun_form_attempt`、`seisyun_form_success`、`seisyun_form_error`。
- GTMにGA4イベントタグ・トリガーが存在し実測されているかは**未検証**。GA4リアルタイムとDebugViewで確認する。
- テスト送信を行う場合は「テスト申込」と明示し、Formspree受信確認後に削除・対応する。

## 会社公式サイトへの移設時
1. GitHubから `index.html` と `images/` を取得。CSS/JSはHTML内蔵。会社ドメインの `/lp/seishun_lp/` ディレクトリに設置。
2. `<link rel="canonical">` を `https://www.toriimusic.co.jp/lp/seishun_lp/` に修正。
3. `og:image` を会社ドメイン上の画像URLへ変更。
4. 新LPへの接続・フォーム送信・GTM・Clarity・GA4の動作を確認。
5. GitHub URLからの流入は最終的に会社公式URLへのリンク/リダイレクトなどで集約（検索エンジンの重複を避ける）。

## 残る現地運用確認
- 11月11日・25日の体験受入可否および12月以降の日程
- 施設費の有無、講師・所在地・電話・電話受付
- フォームの実通知到着と返信運用
- GTM→GA4のイベント記録
- 実際のスマホからの送信・表示チェック
