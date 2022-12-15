const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

async function getSessionCookie(url) {
    let cookie = "";
    await axios.get(url, {
        maxRedirects: 0,
    }).then((response) => {
        if (response.data) {
            console.log("RESPONSE:", response.data);
        }
    }).catch((error) => {
        //console.log('COOKIE', error.response.headers['set-cookie'][0]);
        cookie = error.response.headers['set-cookie'][0];
    });
    return cookie;
}

function timeStamp() {
    return '[' + new Date().toISOString().substring(11, 19) + '] - ';
}

async function sniffAppointment(url, cookie) {
    await axios.get(url, {
        headers: {
            "Cookie": cookie
        },
        withCredentials: true,
    }).then((response) => {
        if (response.data) {
            const $ = cheerio.load(response.data);
            let $buchbar = $(".buchbar");
            if ($buchbar.get().length > 1) {
                $buchbar.each((i, el) => {
                    console.log(timeStamp(), "TERMIN VERFÜGBAR AM: ", $(el).text());
                    $(el).find("a").each((i, link) => {
                        console.log("---> LINK: ", "https://service.berlin.de" + $(link).attr("href"));
                    });
                });
            } else {
                console.error(timeStamp(), "KEIN TERMIN VERFÜGBAR");
            }
        }
    }).catch((error) => {
        console.log('ERROR', error.response);
    });
}

async function main() {
    const url = "https://service.berlin.de/terminvereinbarung/termin/tag.php?termin=1&anliegen=121591&dienstleisterlist=122210,122217,122219,122227,122231,122238,122243,122252,122260,122262,122254,122271,122273,122277,122280,122282,122284,122291,122285,122286,122296,150230,122294,122312,122314,122304,122311,122309,122281,122283,122279,122276,122274,122267,122246,122251,122257,122208,122226&herkunft=http%3A%2F%2Fservice.berlin.de%2Fdienstleistung%2F121591%2F";

    // Get session cookie
    let cookie = await getSessionCookie(url);

    // Sniff your "Berlin Behörden Termin" every minute
    await sniffAppointment(url, cookie);

}

cron.schedule('*/30 * 5-20 * * 1-5', () => {
    //console.log('-- START CRON --');
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    }).finally(() => {
        //console.log('-- END CRON --');
    });
}, {
    scheduled: true,
    timezone: "Europe/Berlin"
});


