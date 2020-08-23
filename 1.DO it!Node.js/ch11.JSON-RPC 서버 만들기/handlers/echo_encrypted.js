const crypto = require("crypto-js");

const echo_encrypted = function (params, callback) {
  console.log("JSON_RPC echo_encrypted 호출됨.");
  console.dir(params);
  try {
    //복호화 테스트
    var encrypted = params[0];
    const secret = "my secret";
    const decrypted = CryptoJS.AES.decrypt(encrypted, secret).toString(
      Crypto.enc.Utf8
    );
    console.log("복호화 된 데이터 : " + decrypted);

    //암호화 테스트
    var encrypted =
      "" + crypto.AES.encrypt(decrypted + "-> 서버에서 보냄.", secret);

    console.log(encrypted);
    params[0] = encrypted;
  } catch (err) {
    console.dir(err);
    console.log(err.stack);
  }
  callback(null, params);
};

module.exports = echo_encrypted;
