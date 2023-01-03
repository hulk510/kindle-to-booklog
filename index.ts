import chromedriver from 'chromedriver';
import { By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

const driver = chrome.Driver.createSession(
  new chrome.Options(),
  new chrome.ServiceBuilder(chromedriver.path).build()
);

// const capabilities: Capabilities = Capabilities.chrome();
// capabilities.set('chromeOptions', {
//   args: ['--headless', '--disable-gpu', '--window-size=1024,768'],
//   w3c: false,
// });
// <button id="top-sign-in-btn" class="auth-btn sign-in-btn" onclick="window.location.href = 'https://www.amazon.co.jp/ap/signin?openid.pape.max_auth_age=1209600&amp;openid.return_to=https%3A%2F%2Fread.amazon.co.jp%2Fkindle-library&amp;openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&amp;openid.assoc_handle=amzn_kindle_mykindle_jp&amp;openid.mode=checkid_setup&amp;language=ja_JP&amp;openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&amp;pageId=amzn_kindle_mykindle_jp&amp;openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0'">
// <img class="amazon-a-logo" src="https://m.media-amazon.com/images/G/01/kfw/landing/icon-amazon-a2x._CB611757832_.png" srcset="https://m.media-amazon.com/images/G/01/kfw/landing/icon-amazon-a._CB611757832_.png" alt="Amazon"><span>アカウントでログイン</span>
// </button>
async function search(query: string): Promise<void> {
  // const driver: WebDriver = await new Builder()
  //   .withCapabilities(capabilities)
  //   .build();
  try {
    await driver.get('https://read.amazon.co.jp/kindle-library');
    await driver.wait(until.elementLocated(By.id('top-sign-in-btn')), 10000);
    const signinbtn = await driver.findElement(By.id('top-sign-in-btn'));
    signinbtn.click();
    // .wait(until.elementLocated(By.name('q')), 5000)
    // .sendKeys('query', Key.RETURN);
    // const result: string = await driver
    //   .wait(until.elementLocated(By.className('badge')), 5000)
    //   .getText();
    // console.log(`${query}: ${result}`);
  } catch (e) {
    console.log(e);
    console.log('hello');
  } finally {
    // driver && (await driver.quit());
  }
}

search('selenium');
