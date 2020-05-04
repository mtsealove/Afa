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
app.use(function(req, res, next){
    const ip=getUserIP(req);
    sql.addVisiter(getDate(),ip);
    next();
})

// index page
app.get('/', (req, res) => {
    const user=getUser(req); 
    sql.getNewitems(user.loc, (news)=>{
        sql.getEvents((events)=>{
            sql.getSeasonItem(user.loc, (season)=>{
                res.render('index', {user:user, news:news, events:events, season:season});
            });
        });
    });
});

app.get('/ajax/Session', (req, res)=>{
    const loc=req.query.loc;
    req.session.loc=loc;
    res.json(ok);
});

app.get('/Events', (req, res)=>{
    const user=getUser(req);
    sql.getEvents((events)=>{
        res.render('events', {user:user, events:events});
    });
});
app.get('/QnA', (req, res)=>{
    const user=getUser(req);
    sql.getAskCount((cnt)=>{
        res.render('qna', {user:user, cnt:cnt});
    });
}); 

app.get('/ajax/Get/Ask', (req, res)=>{
    const page=req.query.page;
    sql.getAskList(page, (rs)=>{
        res.json(rs);
    });
});

app.get('/Ask', (req, res)=>{
    const user=getUser(req);
    if(user.userID) {
        res.render('ask', {user:user});
    } else {
        res.send(`<script>alert('로그인 후 이용해 주세요.');history.go(-1);</script>`);
    }
});

app.get('/Privacy', (req, res)=>{
    const user=getUser(req);
    res.render('privacy', {user:user});
});
app.get('/Rule', (req, res)=>{
    const user=getUser(req);
    res.render('use_rule', {user:user});
});

app.get('/Ask/Detail/:id', (req, res)=>{
    const user=getUser(req);
    const id=req.param('id');
    sql.getAskDetail(id, (rs)=>{
        res.render('ask_detail', {user:user, ask:rs});
    });
});


app.post('/Ask', (req, res)=>{
    const user=getUser(req);
    const title=req.body['title'];
    const contents=req.body['contents'];
    sql.createAsk(user.userID, title, contents, (rs)=>{
        if(rs) {
            res.send(`<script>alert('문의사항이 등록되었습니다.');location.href='/QnA';</script>`);
        } else {
            res.send(`<script>alert('오류가 발생하였습니다.');</script>`);
        }
    });
});
app.get('/LocalMarket', (req, res)=>{
    const user=getUser(req);
    res.render('localmarket', {user:user});
});

app.get('/All', (req, res)=>{
    const user=getUser(req);
    var word=req.query.word;
    sql.getAllItems(user.loc,null, null, word,(items)=>{
        res.render('all', {user: user, items:items, word:word});
    });
})

app.get('/Item/:ID', (req, res)=>{
    const ID=req.params.ID;
    const user=getUser(req);

    sql.getItem(ID, (item)=>{
        sql.getOwnersOtherItem(ID, (other)=>{
            sql.getQuestionList(ID, (question)=>{
                sql.getReviewList(ID, (review)=>{
                    var arr=req.cookies.recent;
                    if(!arr) {
                        arr=[];
                    }
                    var ap=true;
                    for(var i=1; i<3; i++)  {
                        if(arr[arr.length-i]&&arr[arr.length-i].id==ID) {
                            ap=false;
                        }
                    }
                    if(ap) {
                        arr.push({id: ID, img:item.File1});
                    }
                    res.cookie('recent', arr);
                    res.render('item', {user:user, item:item, other:other, question:question, review:review});
                });
            });
        });
    });
});

app.get('/Cart', (req, res)=>{
    const user=getUser(req);
    if(user.userCat==2) {
        sql.getCart(user.userID, (cart)=>{
            res.render('cart', {user:user, cart:cart});
        });
    } else {
        noPermission(res);
    }
});

app.get('/Order', (req, res)=>{
    const user=getUser(req);
    const item=req.query.item;
    const qty=req.query.qty;
    var items=[];
    const itmeArr=item.split(',');
    const qtyArr=qty.split(',');
    for(var i=0; i<itmeArr.length; i++) {
        items.push({
            id:itmeArr[i],
            qty: qtyArr[i]
        });
    }
    if(user.userCat==2) {
        sql.getListedItem(item, (itemRs)=>{
            for(var i=0; i<items.length; i++) {
                for(var j=0; j<itemRs.length; j++) {
                    if(items[i].id==itemRs[j].ID) {
                        const SaleQty=items[i].qty;
                        items[i].item=itemRs[j];
                    }
                }
            }
            // console.log(items);
            sql.getMy(user.userID, (my)=>{
                res.render('order', {user:user, items:items, my:my[0]});
            });
        });
    } else {
        noPermission(res);
    }
});

app.post('/ajax/Create/Order', (req, res)=>{
    console.log(req.body);
    const reward=req.body['reward'];
    const item=req.body['item'];
    const user=getUser(req);
    var cnt=0;
    var ids='';
    for(var i=0; i<item.length; i++) {
        ids+=item[i].id;
        if(i!=item.length-1) {
            ids+=',';
        }
        sql.createOrder(user.userID, item[i].id, item[i].qty, item[i].price, (rs)=>{
            cnt++;
        });
    }
    var interval=setInterval(()=>{
        if(cnt==item.length) {
            clearInterval(interval);
            sql.downReward(user.userID, reward, (rs)=>{
                if(rs) {
                    sql.removeCart(user.userID, ids, (removeRs)=>{
                        if(removeRs) {
                            res.json(ok);
                        } else {
                            res.json(not);
                        }
                    });
                } else {
                    res.json(not);
                }
            });
        }
    }, 100);
});

app.post('/ajax/Cart/Remove', (req, res)=>{
    const user=getUser(req);
    const ids=req.body['ids'];
    var id='';
    for(var i=0; i<ids.length; i++) {
        id+=ids[i];
        if(i!=ids.length-1) {
            id+=',';
        }
    }
    sql.removeCart(user.userID, id, (rs)=>{
        if(rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    });
});

app.get('/Login', (req, res) => {
    const user = getUser(req);
    if (!user.userID) {
        res.render('login', {user:user});
    } else {
        res.send(`<script>alert('이미 로그인 되어 있습니다'); location.href='/';</script>`);
    }
});

app.get('/SignUp', (req, res) => {
    const user = getUser(req);
    if (!user.userID) {
        res.render('sign_up', {user:user});
    } else {
        res.send(`<script>alert('이미 로그인 되어 있습니다'); location.href='/';</script>`);
    }
});

app.get('/SignUp/Maker', (req, res) => {
    const user = getUser(req);
    if (!user.userID) {
        res.render('signup_maker', {user:user});
    } else {
        res.send(`<script>alert('이미 로그인 되어 있습니다'); location.href='/';</script>`);
    }
});

app.get('/SignUp/Normal', (req, res)=>{
    const user=getUser(req);
    if(!user.userID) {
        res.render('signup_normal', {user:user});
    } else {
        res.send(`<script>alert('이미 로그인 되어 있습니다'); location.href='/';</script>`);
    }
});

app.post('/SignUp/Maker', upload.single('profile'), (req, res)=>{
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
    sql.createMakerMember(id, pw, name, phone, email, my_addr, birth, gender, item, make_addr, intro, bank, bank_addr, profile, (rs)=>{
        if(rs) {
            res.send(`<script>alert('회원가입이 완료되었습니다.');location.href='/Login';</script>`);
        } else {
            res.send(`<script>alert('오류가 발생하였습니다.');</script>`);
        }
    });
});

app.post('/SignUp/Normal', (req, res)=>{
    const id=req.body['id'];
    const pw=req.body['pw'];
    const name=req.body['name'];
    const phone=req.body['phone'];
    const email=req.body['email'];
    const my_addr=req.body['my_addr'];
    const birth=req.body['birth'];
    const gender=req.body['gender'];

    sql.createNormalMember(id, pw, name, phone, email, my_addr, birth, gender, (rs)=>{
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
    sql.checkMailAble(mail, (able)=>{
        if(able) {
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
        } else {
            res.json({
                code: '0'
            });
        }
    });
});

app.post('/ajax/Login', (req, res)=>{
    const id=req.body['id'];
    const pw=req.body['pw'];
    const cat=req.body['cat'];

    sql.login(id, pw, cat, (rs)=>{
        if(rs) {
            req.session.userID=rs.ID;
            req.session.userName=rs.Name;
            req.session.userCat=rs.Cat;
            res.json(ok);
        } else {
            res.json(not);
        }
    });
});

app.get('/Logout', (req, res)=>{
    req.session.userID=null;
    req.session.userCat=null;
    req.session.userName=null;
    res.send(`<script>alert('로그아웃 되었습니다.');location.href='/';</script>`);
});

app.get('/MyPage', (req, res)=>{
    const user=getUser(req);
    if(user.userID) {
        sql.getMyOrderCnt(user.userID, (orderCnt)=>{
            sql.getMyOrderItems(user.userID, (items)=>{
                sql.getMyPage(user.userID, (my)=>{
                    res.render('mypage', {user:user, orderCnt:orderCnt, items:items, my:my});
                }); 
            });
        });
    } else {
        noPermission(res);
    }
});

// 생산자
app.get('/Maker/Items', (req, res)=>{
    const user=getUser(req);
    if(user.userCat==1) {
        sql.getMyItem(user.userID, (items)=>{
            res.render('my_item', {user:user, items:items});
        });
        
    } else {
        noPermission(res);
    }
});

app.get('/Maker/Item/Manage', (req, res)=>{
    const user=getUser(req);
    if(user.userCat==1) {
        sql.getMyItem(user.userID, (items)=>{
            res.render('my_item_manage',{user:user, items:items});
        });
    } else {
        noPermission(res);
    }
});
app.get('/Maker/Item/Register', (req, res)=>{
    const user=getUser(req);
    const itemID=req.query.item;
    if(user.userCat==1) {
        //신규 등록
        if(!itemID) {
            sql.getCat((cat)=>{
                res.render('register_item', {user:user, cat: cat, item:null});
            });
        } else {
            sql.getCat((cat)=>{
                sql.getItem(itemID, (item)=>{
                    res.render('register_item', {user:user, cat: cat, item:item});
                });
            });
        }
    } else {
        noPermission(res);
    }
});

app.get('/Maker/Order', (req,res)=>{
    const user=getUser(req);
    if(user.userCat==1) {
        sql.getMakerOrders(user.userID, (order)=>{
            res.render('maker_order', {user:user, orders:order});
        });
    } else {
        noPermission(res);
    }
});

app.post('/Maker/Item/Register', upload.array('file', 3), (req, res)=>{
    const name=req.body['name'];
    const des=req.body['des'];
    const addr=req.body['make_addr'];
    const date=req.body['date'];
    const price=req.body['price'];
    const cat=req.body['cat'];
    const unit=req.body['unit'];
    const reqDelivery=req.body['delivery'];
    var delivery='';
    const pesticide=req.body['pesticide'];
    const pack=req.body['pack'];
    var file1=null;
    if(req.files[0]) {
        file1=req.files[0].filename;
    }
    var file2=null;
    if(req.files[1]) {
        file2=req.files[1].filename;
    }
    const id=req.body['id'];
    var file3=null;
    if(req.files[2]) {
       file3=req.files[2].filename;
    }
    const user=getUser(req);
    if(Array.isArray(reqDelivery)) {
        for(var i=0; i<reqDelivery.length; i++) {
            delivery+=reqDelivery[i];
            if(i!=reqDelivery.length-1) {
                delivery+='|';
            }
        }
    } else {
        delivery=reqDelivery;
    }
    if(!id) {
        sql.createItem(user.userID, name, des, addr, date, price,file1, file2, file3, cat,unit, delivery, pack, pesticide,(rs)=>{
            if(rs) {
                res.send(`<script>alert('상품이 등록되었습니다.');location.href='/Maker/Items';</script>`);
            } else {
                res.send(`<script>alert('오류가 발생하였습니다.');history.go(-1);</script>`);
            }
        });
    } else {
        sql.updateOgItem(id,user.userID, name, des, addr, date, price,file1, file2, file3, cat,unit, delivery, pack, pesticide,(rs)=>{
            if(rs) {
                res.send(`<script>alert('상품이 수정되었습니다.');location.href='/Maker/Items';</script>`);
            } else {
                res.send(`<script>alert('오류가 발생하였습니다.');history.go(-1);</script>`);
            }
        });
    }
});

app.post('/ajax/Maker/Remove/Item', (req, res)=>{
    const ids=req.body['ids'];
    sql.removeItems(ids, (rs)=>{
        if(rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    });
}); 

app.post('/ajax/Maker/Update/Item', (req, res)=>{
    const id=req.body['id'];
    const price=req.body['price'];
    const qty=req.body['qty'];

    sql.updatePriceQty(id, price, qty, (rs)=>{
        if(rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    });
});

app.post('/ajax/Maker/Update/Invoice', (req, res)=>{
    const id=req.body['id'];
    const corp=req.body['corp'];
    const invoice=req.body['invoice'];
    sql.updateInvoice(id, corp, invoice, (rs)=>{
        if(rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    }); 
});

app.post('/ajax/Maker/Update/Status', (req, res)=>{
    const id=req.body['id'];
    const status=req.body['status'];
    sql.updateStatus(id, status, (rs)=>{
        if(rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    });
});

app.post('/ajax/Qna', (req, res)=>{
    const title=req.body['title'];
    const content=req.body['content'];
    const itemID=req.body['item'];
    const user=getUser(req);

    sql.createQuestion(itemID, user.userID, title, content, (rs)=>{
        if(rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    });
});
app.post('/ajax/Review', (req, res)=>{
    const title=req.body['title'];
    const content=req.body['content'];
    const itemID=req.body['item'];
    const user=getUser(req);

    sql.createReview(itemID, user.userID, title, content, (rs)=>{
        if(rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    });
});

app.post('/ajax/Update/Review', (req, res)=>{
    const id=req.body['id'];
    sql.updateReviewClick(id, (rs)=>{
        res.json(ok);
    })
});

app.post('/ajax/Update/Question', (req, res)=>{
    const id=req.body['id'];
    sql.updateQuestionClick(id, (rs)=>{
        res.json(ok);
    })
});

app.get('/ajax/Get/Best', (req, res)=>{
    const cat=req.query.cat;
    const user=getUser(req);
    sql.getBestItems(user.loc, cat, (best)=>{
        res.json(best);
    });
});

app.post('/ajax/InsertCart', (req, res)=>{
    const item=req.body['item'];
    const qty=req.body['qty'];
    const user=getUser(req);
    sql.addToCart(item, qty, user.userID, (rs)=>{
        res.json(rs);
    });
});

app.get('/Manager', (req, res)=>{
    const user=getUser(req);
    if(user.userCat==3) {
        sql.getMakerList((maker)=>{
            sql.getConsumerList((consumer)=>{
                sql.getEvents((events)=>{
                    sql.getAllItems(null, null, null, (item)=>{
                        res.render('manager', {user:user, maker:maker, consumer:consumer, events:events, items:item});
                    });
                });
            });
        });
    } else{
        noPermission(res);
    }
});

app.get('/ajax/Manage/Get/Ask', (req, res)=>{
    sql.getNotReceiveAsk((rs)=>{
        res.json(rs);
    });
});


app.get('/Manager/Ask/Recevie', (req, res)=>{
    const user=getUser(req);
    const id=req.query.id;
    if(user.userCat!=3) {
        noPermission(res);
    } else {
        sql.getAskDetail(id, (ask)=>{
            res.render('ask_receive', {user:user, ask:ask});
        });
    }
});

app.post('/Manager/Ask/Recevie', (req, res)=>{
    const id=req.body['id'];
    const contents=req.body['contents'];
    sql.createAskReceive(id, contents, (rs)=>{
        if(rs){
            res.send(`<script>alert('답변이 등록되었습니다.');location.href='/Manager';</script>`);
        } else {
            res.send(`<script>alert('오류가 발생하였습니다.');</script>`);
        }
    });
});

app.get('/ajax/Manage/Get/Stastics/Date', (req, res)=>{
    const date=req.query.date;
    sql.getDateStastics(date, (rs)=>{
        sql.getVisister(date, (cnt)=>{
            rs.Visit=cnt;
            res.json(rs);
        });
    });
});
app.get('/ajax/Manage/Get/Stastics/Month', (req, res)=>{
    const month=req.query.month;
    sql.getMonthStastics(month, (rs)=>{
        sql.getMonthVisiter(month, (cnt)=>{
            rs.Visit=cnt;
            res.json(rs);
        });
    });
});

app.post('/ajax/Manager/Update/Event', upload.single('event_file'), (req, res)=>{
    const file=req.file.filename;
    const priority=req.body['priority'];

    sql.updateEvent(priority, file, (rs)=>{
        if(rs) {
            var ok1=ok;
            ok1.Path=file;
            res.json(ok1);
        } else {
            res.json(not);
        }
    })
});

app.get('/ajax/Manage/OrderStatus', (req, res)=>{
    const date=req.query.date;
    sql.getOrderStatus(date, (rs)=>{
        res.json(rs);
    });
});

app.get('/ajax/Manage/OrderByStatus', (req, res)=>{
    const sts=req.query.status;
    sql.getOrderByStatus(sts, (rs)=>{
        res.json(rs);
    });
});

app.post('/ajax/Manage/Season', (req, res)=>{
    console.log(req.body);
    const ids=req.body['ids'];
    sql.updateSeason(ids, (rs)=>{
        if(rs) {
            res.json(ok);
        } else {
            res.json(not);
        }
    })
});

app.listen(80, () => {
    console.log('afa runnings');
});
function getUserIP(req) {
    const addr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    return addr
  }

function noPermission(res)  {
    res.send(`<script>alert('접근 권한이 없습니다.');history.go(-1)</script>`);
}

function getUser(req) {
    const id = req.session.userID;
    const name = req.session.userName;
    const cat = req.session.userCat;
    const loc=req.session.loc?req.session.loc:'';
    return {
        userID: id,
        userName: name,
        userCat: cat,
        loc:loc
    };
}

function getDate() {
    var date = new Date();
    var str = date.getUTCFullYear() + '-';
    if (date.getMonth() < 9) {
        str += '0';
    }
    str += (date.getMonth() + 1) + '-';
    if (date.getDate() < 10) {
        str += '0';
    }
    str += date.getDate();
    return str;
}