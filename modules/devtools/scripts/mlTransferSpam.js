var request = require('request');
var uuid = require('uuid');

let requestsToSendCnt = 9999;
let requestsSentCnt = 0;

let requestsGotOK = 0;
let requestsStartTick = new Date().getTime()
let requestsRttAcc = 0
let requestsRttCnt = 0

const doAction = 'transfer'

const logStats = () => {
    const now = new Date().getTime()
    console.log(
        'Requests sent:', requestsSentCnt,
        'returned ok:', requestsGotOK,
        'rate:', 1000*(100/(now-requestsStartTick)), 'reqs/sec',
        'average rtt:', requestsRttAcc / requestsRttCnt)
    requestsStartTick = now
}

const sendRequest = () => {
  if ((requestsSentCnt % 100 === 0) || (requestsSentCnt === requestsToSendCnt)) {
    logStats()
  }
  const tick = new Date().getTime()
  const requestSerialNo = requestsSentCnt;

  const resultHandlers = (error, response, body) => {
    const toe = new Date().getTime()
    if (!error && response.statusCode === 200) {
      const rtt = toe - tick
      requestsRttAcc += rtt
      requestsRttCnt++
      console.log(requestSerialNo, response.statusCode, rtt
      //, body
      );
      requestsGotOK++;
    } else if (error) {
      console.log(requestSerialNo, error)
    } else if (response) {
      console.log(requestSerialNo, response.statusCode
      , body
      )
    }
    requestsSentCnt++;
    if (
        (!error && ([200, 202].indexOf(response.statusCode) !== -1)) &&
        (requestsSentCnt < requestsToSendCnt)
      ) {
        setTimeout(sendRequest, 1)
    }
    else {
      logStats()
    }
  }

  let fspSrc
  let fspDst
  if (0) {
    fspSrc = 'payerfsp'
    fspDst = 'payeefsp'
    fspDst = 'simfsp01'
  } else {
    fspSrc = 'simfsp01'
    fspDst = 'simfsp02'
  }

  if (doAction === 'transfer') {
    request.post(
      //'http://ml-api-adapter.local:3000/transfers',
      'http://perf1-ml-api-adapter.mojaloop.live/transfers',
      {
          headers: {
              Accept: 'application/vnd.interoperability.transfers+json;version=1',
              'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.0',
              Date: (new Date()).toUTCString(),
              'FSPIOP-Source': fspSrc,
              'FSPIOP-Destination': fspDst
          },
          json: {
              "transferId": uuid.v4(),
              "payerFsp": fspSrc,
              "payeeFsp": fspDst,
              "amount": {
                "amount": "1.11",
                "currency": "USD"
              },
              "expiration": new Date(new Date().getTime() + 600000),
              "ilpPacket": "AQAAAAAAAADIEHByaXZhdGUucGF5ZWVmc3CCAiB7InRyYW5zYWN0aW9uSWQiOiIyZGY3NzRlMi1mMWRiLTRmZjctYTQ5NS0yZGRkMzdhZjdjMmMiLCJxdW90ZUlkIjoiMDNhNjA1NTAtNmYyZi00NTU2LThlMDQtMDcwM2UzOWI4N2ZmIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNzcxMzgwMzkxMyIsImZzcElkIjoicGF5ZWVmc3AifSwicGVyc29uYWxJbmZvIjp7ImNvbXBsZXhOYW1lIjp7fX19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTExIiwiZnNwSWQiOiJwYXllcmZzcCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnt9fX0sImFtb3VudCI6eyJjdXJyZW5jeSI6IlVTRCIsImFtb3VudCI6IjIwMCJ9LCJ0cmFuc2FjdGlvblR5cGUiOnsic2NlbmFyaW8iOiJERVBPU0lUIiwic3ViU2NlbmFyaW8iOiJERVBPU0lUIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIiLCJyZWZ1bmRJbmZvIjp7fX19",
              "condition": "HOr22-H3AfTDHrSkPjJtVPRdKouuMkDXTR4ejlQa8Ks"
          }
      },
      resultHandlers
    )
  } else {
    request.get(
      'http://127.0.0.1:3001/participants',
      {},
      resultHandlers
    )
  }
};

sendRequest();