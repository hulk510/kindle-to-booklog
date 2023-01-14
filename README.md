# kindle-to-booklog
kindleで購入した商品のasinコードを取得してブクログに登録する

# 環境構築
- ChromeDriver seleniumの実行に必要なのでChromeをインストールする必要あり
- Node v16.6.0 && npm v8.4.0

# How to Run
.env.exampleを.envに書き換えてログイン情報を入力

```
$ git clone git@github.com:hulk510/kindle-to-booklog.git
$ cd ./kindle-to-booklog
$ npm i
$ npm run build
$ node dist/index.js
```

# TODO
- 購入メールから関数の実行および登録の自動化
