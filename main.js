const express = require('express');
const body_parser = require('body-parser');
const cookie_parser = require('cookie-parser');
const session = require('express-session');
const app = express();
const sql = require('./sql');
const multer=require('multer');
const upload=multer({dest: 'public/uploads'});
const ok = {
    Result: true
}, not = {
    Result: false
};
const nodemailer = require('nodemailer');

app.set('view engine', 'ejs');
app.set('views', './Views');
app.use(body_parser.json({ limit: '150mb' }));
app.use(body_parser.urlencoded({ extended: true, limit: '150mb', parameterLimit: 1000000 }));
app.use(session({
    key: 'sid',
    secret: 'secret',
    resave: 'false',
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 10  //로그인 유지 시간(10시간)
    }
}));
app.use('/public', express.static('public'));
app.use(cookie_parser());

// index page
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/Login', (req, res) => {
    const user = getUser(req);
    if (!user.userID) {
        res.render('login');
    } else {
        res.send(`<script>alert('이미 로그인 되어 있습니다'); location.href='/';</script>`);
    }
});

app.get('/SignUp', (req, res) => {
    const user = getUser(req);
    if (!user.userID) {
        res.render('sign_up');
    } else {
        res.send(`<script>alert('이미 로그인 되어 있습니다'); location.href='/';</script>`);
    }
});

app.get('/SignUp/Maker', (req, res) => {
    const user = getUser(req);
    if (!user.userID) {
        res.render('signup_maker');
    } else {
        res.send(`<script>alert('이미 로그인 되어 있습니다'); location.href='/';</script>`);
    }
});

app.post('/SignUp/Maker', upload.single('profile'), (req, res)=>{
    console.log(req.body);
    console.log(req.file);
    const id=req.body['id'];
    const pw=req.body['pw'];
    const name=req.body['name'];
    const phone=req.body['phone'];
    const email=req.body['email'];
    const my_addr=req.body['my_addr'];
    const birth=req.body['birth'];
    const gender=req.body['gender'];
    const item=req.body['item'];
    const make_addr=req.body['make_addr'];
    const intro=req.body['intro'];
    const bank=req.body['bank'];
    const bank_addr=req.body['bank_addr'];
    var profile=null;
    if(req.file) {
        profile=req.file.filename;
    }
    sql.createMember(id, pw, name, phone, email, my_addr, birth, gender, item, make_addr, intro, bank, bank_addr, profile, (rs)=>{
        if(rs) {
            res.send(`<script>alert('회원가입이 완료되었습니다.');location.href='/Login';</script>`);
        } else {
            res.send(`<script>alert('오류가 발생하였습니다.');</script>`);
        }
    });
});

app.get('/ajax/CheckID', (req, res) => {
    const id = req.query.id;
    sql.checkIdReuse(id, (rs) => {
        if (rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    })
});

app.post('/ajax/SendMail', (req, res) => {
    const mail = req.body['mail'];
    var code = '';
    const char = 'abcdefghijlmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (var i = 0; i < 16; i++) {
        var index = Math.floor(Math.random() * (char.length - 1));
        code += char.charAt(index);
    }
    console.log(mail);
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ssaturimarket@gmail.com',  // gmail 계정 아이디를 입력
            pass: 'zrbgewsxwmnuwnhk'          // gmail 계정의 비밀번호를 입력
        }
    });

    let mailOptions = {
        from: 'ssaturimarket@gmail.com',    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
        to: mail,                     // 수신 메일 주소
        subject: '싸투리마켓 회원가입 인증번호입니다.',   // 제목
        text: '싸투리마켓 회원가입 인증번호는 ' + code + ' 입니다.'  // 내용
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            res.json({
                code: '-1'
            })
        }
        else {
            console.log('Email sent: ' + info.response);
            res.json({
                code: code
            });
        }
    });
});

app.listen(80, () => {
    console.log('afa runnings');
});

function getUser(req) {
    const id = req.session.userID;
    const name = req.session.userName;
    const cat = req.session.userCat;
    return {
        userID: id,
        userName: name,
        userCat: cat
    }
}