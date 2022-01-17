# TwitterAnalysis

## 概要

TwitterAPI を叩いて、GSS に保存する GAS
[こちら](https://tech-cci.io/archives/4228)をめちゃくちゃ参考にした。

## 使い方

### 1. GSS 作成

シートは 2 つ作成しておいて。

#### Sheet: アクションデータ

```csv
id,type,tweet.id,user.id,user.name,user.username,user.created_at,user.protected,user.location,user.url,user.description,user.verified,user.followers_count,user.tweet_count,user.listed_count,user.following_count
# ...rows
```

#### Sheet: Watch リスト

```
tweet_id, title
# rows
```

### 2. TwitterAPI 設定

これみて: https://tech-cci.io/archives/4228

- API キーとか作成して
- auth 設定で以下の設定して
  - usercallback: https://script.google.com/macros/d/<GAS のスクリプト ID>/usercallbac
  - website url: 適当

### 3. GAS

1. スクリプトは`index.js`をコピペして。
2. これみて: https://tech-cci.io/archives/4228

- ライブラリーダウンロード
  - OAuth1: 1CXDCY5sqT9ph64fFwSzVtXnbjpSfWdRymafDrtIZ7Z_hwysTY7IIhi7s
  - TwitterWebService: 1rgo8rXsxi1DxI_5Xgo_t3irTw1Y5cxl2mGSkbozKsSXf2E_KBBPC3xTF
- getOAuthURL 実行して Google, Twitter 認証とか通して。
