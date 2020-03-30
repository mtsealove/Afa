const crypto = require('crypto');
const key = 'buslinker9601181';

exports.Chipe = (input) => {
    // 암호화
    var cipher = crypto.createCipher('aes256', key);    // Cipher 객체 생성
    cipher.update(input, 'utf8', 'base64');             // 인코딩 방식에 따라 암호화
    var cipheredOutput = cipher.final('base64');        // 암호화된 결과 값
    return cipheredOutput;
}