const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const cheerio = require('cheerio');
const { isSameDay } = require('date-fns');
const DATA_STORAGE_PATH = '../public/data/';
const TOKENS = require(`${DATA_STORAGE_PATH}TOKENS.json`);
const STORAGE_FILENAME = path.resolve(__dirname, `${DATA_STORAGE_PATH}LOCALSTORAGE.json`);
const STORAGE = require(STORAGE_FILENAME);

const fetchData = async (url) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const COOKIE_HEADER = `-H 'cookie: bscscan_cookieconsent=True; __stripe_mid=29534aae-d99a-4b25-9d58-61a7b011c9f96f8a4b; amp_fef1e8=6b724084-deba-4fa0-b55d-9a337c836619R...1fp0987pr.1fp099d5i.5.1.6; _ga_0JZ9C3M56S=GS1.1.1641760958.1.1.1641761040.0; _ga=GA1.2.1607185093.1635161637; ASP.NET_SessionId=dg1fbgzo3vcan54zu544xa5w; __cflb=02DiuJNoxEYARvg2sN4zbncfn2GL25UpgbGkQY2tuxuhn; _gid=GA1.2.309870604.1645997948; __cf_bm=3RXpF3vkv1c.k0jIi3MwppO8A2WCDTe9MrZL44qRAa4-1646000182-0-AQ5uhPfyKTUbD6VOsq8rfHqbhj46/wma5hdL9bpivBwpv/6ESsR5JcakB/Eiyi+Fi6wNPss4BiUOokLd5ajtavB3l9Ghd9X7AY0B8bOprpYM2okhRHhAJxWs6KncHcJxdg=='`;
            const command = `curl '${url}' ${COOKIE_HEADER} --compressed`
            exec(command, function(error, stdout, stderr){
                if (error !== null) {
                    console.log('exec error: ' + error);
                    return reject();
                } else {
                    return resolve(stdout);
                }
            });
        }, 1000);
    });
}

const fetchDailyData = async (token, key, contractAddress, address) => {
    const url = `https://bscscan.com/token/token-analytics?m=normal&contractAddress=${contractAddress}&a=${address}&lg=en`;
    const data = await fetchData(url);
    const lines = data.trim().replace(/ /g, "").split(/\r?\n/);
    const dataLine = lines.find((line) => line.indexOf("varplotData2ab") > -1);
    const plotData2ab = dataLine.replace("varplotData2ab=eval", "");
    const FILENAME = `${token}_${key}.json`;
    fs.writeFile(path.resolve(__dirname, `${DATA_STORAGE_PATH}${FILENAME}`), JSON.stringify(eval(plotData2ab)), (err) => {
        if (err) throw err;
        console.log(`Data written to file ${FILENAME}`);
    });
};

const fetchChainData = async (token, key, contractAddress, address) => {
    for (let i = 1; i < 100; i++) {
        const url = `https://bscscan.com/token/generic-tokentxns2?m=normal&contractAddress=${contractAddress}&a=${address}&sid=ae48adf27e24d39d8a25b7c13c1b8690&p=${i}`;
        const data = await fetchData(url);
        const $ = cheerio.load(data);
        const statsTable = $('table tbody tr');
        for(let j = 0; j < statsTable.length; j++) {
            const tr = statsTable[j];
            const tds = $(tr).find('td');
            const txHash = $(tds[0]).text();
            const timestamp = $(tds[2]).text();
            const value = parseFloat($(tds[7]).text().replace(',', ''));
            if (!(token in STORAGE)) {
                STORAGE[token] = {};
            }
            if (!(key in STORAGE[token])) {
                STORAGE[token][key] = {
                    txHash,
                    value: value,
                    timestamp: timestamp
                };
            } else {
                const { txHash: storeTxHash, timestamp: storeTimestamp } = STORAGE[token][key];
                if (storeTxHash === txHash) {
                    return;
                }
                const timestampDate = new Date(timestamp);
                const storeTimestampDate = new Date(storeTimestamp);
                if (timestampDate.getTime() > storeTimestampDate.getTime() && !isSameDay(storeTimestampDate, timestampDate)) {
                    STORAGE[token][key] = {
                        txHash,
                        value: value,
                        timestamp: timestamp
                    };
                } else if (isSameDay(new Date(), timestampDate)) {
                    STORAGE[token][key]['value'] += value;
                } else {
                    return;
                }
            }
        }
    }
    console.log(STORAGE);
}

const start = async () => {
    for (let i = 0; i < TOKENS.length; i++) {
        const item = TOKENS[i];
        const { token, contractAddress, mint, burn } = item;
        await fetchDailyData(token, 'BURN', contractAddress, burn);
        await fetchDailyData(token, 'MINT', contractAddress, mint);
        await fetchChainData(token, 'burn', contractAddress, burn);
        await fetchChainData(token, 'mint', contractAddress, mint);
    }
    fs.writeFile(STORAGE_FILENAME, JSON.stringify(STORAGE, null, 2), (err) => {
        if (err) throw err;
        console.log(`Data written to file LOCALSTORAGE.json`);
    });
}

start();

//cryptoid


