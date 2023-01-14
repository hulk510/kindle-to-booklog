import axios from 'axios';
import chromedriver from 'chromedriver';
import dotenv from 'dotenv';
import { By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

dotenv.config();

const driver = chrome.Driver.createSession(
  new chrome.Options(),
  new chrome.ServiceBuilder(chromedriver.path).build()
);

interface ItemList {
  itemList: Item[];
  paginationToken: string;
  libraryType: string;
  sortType: string;
}
interface Item {
  asin: string;
  webReaderUrl: string;
  productUrl: string;
  title: string;
  percentageRead: string;
  authors: string[];
  resourceType: string;
  originType: string;
  mangaOrComicAsin: boolean;
}

async function search(query: string): Promise<void> {
  const AUTHORS_INTO_ONE_COLUMN = true,
    //   MAX_QUERY_COUNT = 0,
    QUERY_SIZE = 50,
    // itemsListKeys = [
    //   'asin',
    //   'title',
    //   'detailPageUrl',
    //   'webReaderUrl',
    //   'productUrl',
    //   'seriesAsin',
    //   'seriesNumber',
    //   'seriesUrl',
    //   'percentageRead',
    //   'authors',
    // ],
    // authors_key_name = 'authors',
    // date_key_set = new Set(['acquisitionDate', 'lastAnnotationDate']),
    // url_key_set = new Set(['detailPageUrl', 'webReaderUrl', 'productUrl']),
    // series_key_set = new Set(['seriesAsin', 'seriesNumber', 'seriesUrl']),
    sortType = 'acquisition_asc',
    // indexUrl =
    //   'https://read.amazon.co.jp/kindle-library/manga?ref_=kwl_m_red&sortType=' +
    //   encodeURIComponent(sortType),
    acquiredApiUrlTemplate =
      'https://read.amazon.co.jp/kindle-library/search?query=&libraryType=#LIBRARY_TYPE#&paginationToken=#PAGINATION_TOKEN#&sortType=' +
      encodeURIComponent(sortType) +
      '&querySize=' +
      encodeURIComponent('' + QUERY_SIZE);
  //   detailPageUrlTemplate =
  //     'https://www.amazon.co.jp/gp/product/#ASIN#?pd_rd_i=#ASIN#&storeType=ebooks',
  //   seriesUrlTemplate = 'https://www.amazon.co.jp/dp/#ASIN#',
  //   csvFilenameTemplate = 'kindle-manga-acquisition-list_#TIMESTAMP#.csv';

  // function normalizeUrl(sourceUrl: string) {
  //   return /^https?:\/\//.test(sourceUrl)
  //     ? sourceUrl
  //     : new URL(sourceUrl, location.href).href;
  // }

  // function getDateString(timestampMs: number) {
  //   return timestampMs
  //     ? new Date(timestampMs)
  //         .toISOString()
  //         .replace(/-/g, '/')
  //         .replace(/[TZ]/g, ' ')
  //         .trim()
  //     : '-';
  // }

  // function createCsvLine(values: string[]) {
  //   return values
  //     .map((value) =>
  //       /^\d+$/.test(value) ? value : '"' + value.replace(/"/g, '""') + '"'
  //     )
  //     .join(',');
  // }

  // function downloadCsv(csvFilename: string, csvLines: string[]) {
  //   let csvText = csvLines.join('\r\n'),
  //     bom = new Uint8Array([0xef, 0xbb, 0xbf]),
  //     blob = new Blob([bom, csvText], { type: 'text/csv' }),
  //     blobUrl = URL.createObjectURL(blob),
  //     downloadLink = document.createElement('a');

  //   downloadLink.href = blobUrl;
  //   downloadLink.download = csvFilename;
  //   document.documentElement.appendChild(downloadLink);
  //   downloadLink.click();
  //   downloadLink.remove();
  // }

  // ここら辺の動作はwebdriverにやらせる
  // let indexHtml = await fetch(indexUrl + '&_=' + Date.now()).then((response) =>
  //   response.text()
  // );
  // TODO: （同一URLの）一覧ページにてそのまま取得するとエラー発生 (Error logged with the Track&Report JS errors API ... [CSM] Ajax request to same page...)
  //   library_list = index_document.querySelectorAll('.lib-list > li'), // これをdriverで取得
  //   library_type_set = new Set(''),
  // let items_list = [],
  //   query_count = 0;

  // for (let li_element of library_list) {
  //   let h2_element = li_element.querySelector('h2'); // これも取得
  //   if (h2_element) {
  //     let library_type = h2_element.getAttribute('data-library-type'); // これも取得
  //     if (library_type) {
  //       library_type_set.add(library_type);
  //     }
  //   }
  // }
  // これをページのレスポンスから取得する
  // 次のページネーションのトークンが含まれてる見たく、これを次のトークンで差し込めばそれ用に新しいページがAPIで返ってくる
  const library_type = 'BOOKS'; // 一応なくても動くみたい
  let pagination_token: string | undefined = '0';
  // let csvLines = [createCsvLine(itemsListKeys)];
  // while (true) {
  //   let api_url = acquiredApiUrlTemplate
  //     .replace('#LIBRARY_TYPE#', library_type)
  //     .replace('#PAGINATION_TOKEN#', pagination_token);
  //   let api_response_json = await fetch(api_url + '&_=' + Date.now()).then(
  //     (response) => response.json()
  //   );

  //   let items = api_response_json.items;
  //   for (let item of items) {
  //     let item_obj: any = {};
  //     for (let key of itemsListKeys) {
  //       if (key === authors_key_name) {
  //         if (AUTHORS_INTO_ONE_COLUMN) {
  //           item_obj[key] = item[key].join(', ');
  //         } else {
  //           item[key].forEach((author: any, index: string) => {
  //             item_obj[key + '_' + index] = author;
  //           });
  //         }
  //       } else if (url_key_set.has(key)) {
  //         item_obj[key] = normalizeUrl(item[key]);
  //       } else if (series_key_set.has(key)) {
  //         if (key === 'seriesUrl') {
  //           item_obj[key] = seriesUrlTemplate.replace(
  //             '#ASIN#',
  //             item.seriesAsin
  //           );
  //         } else {
  //           item_obj[key] = item[key];
  //         }
  //       } else if (date_key_set.has(key)) {
  //         item_obj[key] = getDateString(item[key]);
  //       } else {
  //         item_obj[key] = item[key];
  //       }
  //     }
  //     items_list.push(item_obj);
  //   }

  //   query_count++;
  //   if (MAX_QUERY_COUNT && query_count >= MAX_QUERY_COUNT) {
  //     break;
  //   }
  // }

  // for (let item of items_list) {
  //   let values = itemsListKeys.map((key) => item[key]);
  //   csvLines.push(createCsvLine(values));
  // }

  // downloadCsv(
  //   csvFilenameTemplate.replace(
  //     '#TIMESTAMP#',
  //     new Date().toISOString().replace(/[:-]/g, '')
  //   ),
  //   csvLines
  // );
  function convertToNameValueString(
    cookies: { name: string; value: string }[]
  ): string {
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  }
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
    const asinList = [];

    while (pagination_token) {
      const api_url: string = acquiredApiUrlTemplate
        .replace('#LIBRARY_TYPE#', library_type)
        .replace('#PAGINATION_TOKEN#', pagination_token);
      const response = await axios
        .get<BooksResponse>(api_url, {
          headers: {
            Cookie: convertToNameValueString(cookies),
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
    console.log(asinList);
    // TODO: paginationToken並びに、クエリとか使いつつ新しいresponseを生成してcsvに登録ってのをやっていく
  } catch (e) {
    console.log(e);
  } finally {
    driver && (await driver.quit());
  }
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

search('selenium');
