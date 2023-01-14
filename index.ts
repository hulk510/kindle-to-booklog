import axios from 'axios';
import chromedriver from 'chromedriver';
import dotenv from 'dotenv';
import { By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

dotenv.config();

function convertToNameValueString(
  cookies: { name: string; value: string }[]
): string {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

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

async function getAmazonCookie(): Promise<string> {
  const driver = chrome.Driver.createSession(
    new chrome.Options(),
    new chrome.ServiceBuilder(chromedriver.path).build()
  );
  try {
    await driver.get('https://read.amazon.co.jp/kindle-library');
    await driver.wait(until.elementLocated(By.id('top-sign-in-btn')), 10000);
    const signinbtn = await driver.findElement(By.id('top-sign-in-btn'));
    signinbtn.click();
    await driver
      .wait(until.elementLocated(By.id('ap_email')), 5000)
      .sendKeys(process.env.MY_EMAIL ?? '');
    await driver
      .wait(until.elementLocated(By.id('ap_password')), 5000)
      .sendKeys(process.env.MY_PASSWORD ?? '');
    await driver
      .wait(until.elementLocated(By.id('signInSubmit')), 5000)
      .submit();
    await driver.wait(until.elementLocated(By.id('cover')), 5000);
    const cookies = await driver
      .manage()
      .getCookies()
      .then(function (cookie) {
        console.log('cookie details => ', cookie);
        return cookie;
      });

    return convertToNameValueString(cookies);
  } catch (e) {
    console.log(e);
    return '';
  } finally {
    driver && (await driver.quit());
  }
}

async function fetchBookAsins(cookie: string): Promise<string[]> {
  const QUERY_SIZE = 50,
    sortType = 'acquisition_asc',
    acquiredApiUrlTemplate =
      'https://read.amazon.co.jp/kindle-library/search?query=&libraryType=#LIBRARY_TYPE#&paginationToken=#PAGINATION_TOKEN#&sortType=' +
      encodeURIComponent(sortType) +
      '&querySize=' +
      encodeURIComponent('' + QUERY_SIZE);
  const library_type = 'BOOKS'; // 一応なくても動くみたい
  let pagination_token: string | undefined = '0';

  const asinList = [];
  while (pagination_token) {
    const api_url: string = acquiredApiUrlTemplate
      .replace('#LIBRARY_TYPE#', library_type)
      .replace('#PAGINATION_TOKEN#', pagination_token);
    const response = await axios
      .get<BooksResponse>(api_url, {
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
    pagination_token = response.paginationToken;
  }

  return asinList;
}

async function loginBooklog() {
  const url = 'https://booklog.jp/login';
  const cookies = await axios
    .post(
      url,
      {
        service: 'booklog',
        ref: '',
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
    // https://zenn.dev/amezousan/articles/2022-08-08-axios
    .catch((err) => {
      return err.response.headers['set-cookie'];
    });
  if (cookies && cookies.length > 0) {
    return cookies[1]; // TODO: 修正する
  }
  return '';
}

async function uploadBook(cookies: string, asinList: string[]) {
  const url = 'https://booklog.jp/input';
  await axios.post(
    url,
    {
      isbns: asinList.join('\n'),
      category_id: 0,
      status: 4,
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

(async () => {
  const cookie = await getAmazonCookie();
  const asinList = await fetchBookAsins(cookie);
  const cookies = await loginBooklog();

  // ブクログは100件ずつしか登録できないので100件ずつリクエストする
  for (let i = 0; i < asinList.length; i += 100) {
    const chunk = asinList.slice(i, i + 100);
    await uploadBook(cookies, chunk);
  }
})();
