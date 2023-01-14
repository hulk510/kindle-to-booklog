import axios from 'axios';
import chromedriver from 'chromedriver';
import dotenv from 'dotenv';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

dotenv.config();

interface Book {
  asin: string;
  webReaderUrl: string;
  productUrl: string;
  title: string;
  percentageRead: 0;
  authors: string[];
  resourceType: string;
  originType: string;
  mangaOrComicAsin: boolean;
}

interface BooksResponse {
  itemsList: Book[];
  paginationToken?: string;
  libraryType: string;
  sortType: string;
}

// FIXME: わざわざseleniumにする必要ないのでaxiosでのリクエストに変えたい
async function getAmazonCookie(): Promise<string> {
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeService(new chrome.ServiceBuilder(chromedriver.path))
    .build();
  try {
    await driver.get('https://read.amazon.co.jp/kindle-library');
    const signinBtn = await driver.findElement(By.id('top-sign-in-btn'));
    await signinBtn.click();
    const email = await driver.findElement(By.id('ap_email'));
    await email.sendKeys(process.env.MY_EMAIL ?? '');
    const password = await driver.findElement(By.id('ap_password'));
    await password.sendKeys(process.env.MY_PASSWORD ?? '');
    const submit = await driver.findElement(By.id('signInSubmit'));
    await submit.submit();
    await driver.wait(until.elementLocated(By.id('cover')), 5000);
    const cookies = await driver.manage().getCookies();
    return cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
  } catch (e) {
    console.log(e);
    return '';
  } finally {
    driver && (await driver.quit());
  }
}

function createKindleBookSearchUrl(paginationToken: string): string {
  const QUERY_SIZE = 50;
  const params = new URLSearchParams();
  params.append('libraryType', 'BOOKS');
  params.append('paginationToken', paginationToken);
  params.append('sortType', 'acquisition_asc');
  params.append('querySize', QUERY_SIZE.toString());
  const apiUrl = new URL('https://read.amazon.co.jp/kindle-library/search');
  apiUrl.search = params.toString();

  return apiUrl.toString();
}

async function getKindleBookAsinList(cookie: string): Promise<string[]> {
  let paginationToken: string | undefined = '0';
  const asinList = [];

  // paginationTokenがresponseに含まれるまで回すことで全件取得するまで繰り返す
  while (paginationToken) {
    const apiUrl: string = createKindleBookSearchUrl(paginationToken);
    const response = await axios
      .get<BooksResponse>(apiUrl, {
        headers: {
          Cookie: cookie,
        },
      })
      .then((res) => {
        return res.data;
      });

    for (const item of response.itemsList) {
      asinList.push(item.asin);
    }
    paginationToken = response.paginationToken;
  }
  return asinList;
}

async function getBookLogCookie() {
  const url = 'https://booklog.jp/login';
  const cookies = await axios
    .post(
      url,
      {
        account: process.env.BOOKLOG_ID,
        password: process.env.BOOKLOG_PASSWORD,
      },
      {
        headers: {
          Referer: url,
          'content-type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 0,
      }
    )
    // 302リダイレクトはエラーになるのでcatchでクッキーを取得する
    // https://zenn.dev/amezousan/articles/2022-08-08-axios
    .catch((err) => {
      return err.response.headers['set-cookie'];
    });
  if (cookies && cookies.length > 0) {
    return cookies[1] as string; // TODO: 修正する
  }
  return '';
}

async function uploadBook(cookies: string, asinList: string[]) {
  const url = 'https://booklog.jp/input';
  await axios.post(
    url,
    {
      isbns: asinList.join('\n'),
      category_id: 0, // カテゴリ：なし
      status: 4, // 読書ステータス: 積読
    },
    {
      headers: {
        Referer: url,
        Cookie: cookies,
        'content-type': 'application/x-www-form-urlencoded',
      },
    }
  );
}

async function main() {
  console.log('start');
  const AmazonCookie = await getAmazonCookie();
  const asinList = await getKindleBookAsinList(AmazonCookie);
  const BookLogCookie = await getBookLogCookie();

  // ブクログは100件ずつしか登録できないので100件ずつリクエストする
  for (let i = 0; i < asinList.length; i += 100) {
    const chunk = asinList.slice(i, i + 100);
    await uploadBook(BookLogCookie, chunk);
  }
  console.log('done');
}

main();
