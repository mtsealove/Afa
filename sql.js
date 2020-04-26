const mysql = require('mysql');
const fs = require('fs');
const connection = mysql.createConnection({
    database: 'Afa',
    host: 'afa.cstju1a91zxa.us-east-2.rds.amazonaws.com',
    user: 'AfaManager',
    password: fs.readFileSync('pw.dat')
});

exports.checkIdReuse = (id, callback) => {
    const query = `select count(ID) cnt from Members where ID='${id}'`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            if (rs[0].cnt == 0) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });
}
const crypto = require('./crypto');
exports.createMakerMember = (id, pw, name, phone, email, myAddr, birth, gender, item, makeAddr, intro, bank, bank_addr, profile, callback) => {
    var query = `insert into Members set ID='${id}', Name='${name}', Phone='${phone}', Email='${email}', MyAddr='${myAddr}',
     Birth='${birth}', Gender='${gender}', Items='${item}', MakeAddr='${makeAddr}', Intro='${intro}', Bank='${bank}', BankAddr='${bank_addr}', Pw='${crypto.Chipe(pw)}', Cat=1`;
    if (profile) {
        query += ` , Profile='${profile}'`;
    }
    console.log(query);
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });

}

exports.createNormalMember = (id, pw, name, phone, email, my_addr, birth, gender, callback) => {
    const query = `insert into Members set ID='${id}', Name='${name}', Phone='${phone}', Email='${email}', MyAddr='${my_addr}',
    Birth='${birth}', Gender='${gender}', Pw='${crypto.Chipe(pw)}', Cat=2`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.checkMailAble = (mail, callback) => {
    const query = `select count(ID) cnt from Members where Email='${mail}'`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else if (rs[0].cnt == 0) {
            callback(true);
        } else {
            callback(false);
        }
    });
}

exports.login = (id, pw, cat, callback) => {
    const query = `select ID, Name, Cat from Members where ID='${id}' and Pw='${crypto.Chipe(pw)}' and Cat=${cat}`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            if (rs[0]) {
                callback(rs[0]);
            } else {
                callback(null);
            }
        }
    });
}

exports.createItem = (Owner, Name, Des, Addr, MDate, Price, File1, File2, File3, Cat, Unit, Delivery, Pack, pesticide, callback) => {
    var query = `insert into Item set Owner='${Owner}', Name='${Name}', Des='${Des}', Addr='${Addr}', MDate='${MDate}', Pesticide=${pesticide}, 
    Price=${Price}, File1='${File1}', File2='${File2}', Cat=${Cat}, Unit='${Unit}', Delivery='${Delivery}', Pack='${Pack}' `;
    if (File3) {
        query += ` ,File3='${File3}'`;
    }
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.updateOgItem = (id,Owner, Name, Des, Addr, MDate, Price, File1, File2, File3, Cat, Unit, Delivery, Pack, pesticide, callback) => {
    var query = `update Item set Owner='${Owner}', Name='${Name}', Des='${Des}', Addr='${Addr}', MDate='${MDate}', Pesticide=${pesticide}, 
    Price=${Price}, Cat=${Cat}, Unit='${Unit}', Delivery='${Delivery}', Pack='${Pack}' `;
    if(File1) {
        query+=` , File1='${File1}'`;
    }
    if(File2) {
        query+=` , File2='${File2}'`;
    }
    if (File3) {
        query += ` ,File3='${File3}'`;
    }
    query+=` where ID=${id}`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.getMyItem = (Owner, callback) => {
    const query = `select * from Item where Owner='${Owner}' order by ID desc`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}
exports.removeItems = (ids, callback) => {
    var id = '';
    for (var i = 0; i < ids.length; i++) {
        id += ids[i];
        if (i != ids.length - 1) {
            id += ',';
        }
    }
    const getQuery = `select File1, File2, File3 from Item where ID in(${id})`;
    const removeQuery = `delete from Item where ID in(${id})`;
    connection.query(getQuery, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            // 파일 삭제
            for (var i = 0; i < rs.length; i++) {
                fs.unlinkSync(__dirname + '/public/uploads/' + rs[i].File1);
                fs.unlinkSync(__dirname + '/public/uploads/' + rs[i].File2);
                if (rs[i].File3) {
                    fs.unlinkSync(__dirnames + '/public/uploads/' + rs[i].File3);
                }
            }
            connection.query(removeQuery, (e1) => {
                if (e1) {
                    console.error(e1);
                    callback(false);
                } else {
                    callback(true);
                }
            });
        }
    });
}

exports.updatePriceQty = (id, price, qty, callback) => {
    const query = `update Item set Price=${price}, Qty=${qty} where ID=${id}`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.getCat = (callback) => {
    const query = `select * from Cat`;

    connection.query(query, (e0, rs) => {
        if (e0) {
            callback(null);
            console.error(e0);
        } else {
            callback(rs);
        }
    });
}

exports.getNewitems = (callback) => {
    const query = `select * from Item order by ID desc limit 4`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getAllItems = (order, asc, word, callback) => {
    var query = `select * from Item `;
    if (word) {
        query += ` where Name like '%${word}%' `;
    }
    if (order) {
        query += ` order by ${order} ${asc}`;
    }
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getItem = (id, callback) => {
    const query = `select I.*, M.Name MakerName from Item I join Members M
    on I.Owner=M.ID where I.ID=${id}`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            if (rs[0]) {
                callback(rs[0]);
            } else {
                callback(null);
            }
        }
    });
}

exports.getOwnersOtherItem = (id, callback) => {
    const query = `select * from Item where Owner=
    (select Owner from Item where ID=${id} limit 1)
    order by Sale desc limit 4`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getQuestionList = (id, callback) => {
    const query = `select Q.ID, Q.Title,Q.Content, date_format(Q.CTime, '%Y-%m-%d') Date, Q.Click , M.Name from Question Q left outer join  Members M
    on Q.MemberID=M.ID where Q.ItemID=${id}`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getReviewList = (id, callback) => {
    const query = `select Q.ID, Q.Title, Q.Content, date_format(Q.CTime, '%Y-%m-%d') Date, Q.Click , M.Name from Review Q left outer join  Members M
    on Q.MemberID=M.ID where Q.ItemID=${id}`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.createQuestion = (itemID, memberID, Title, Content, callback) => {
    const query = `insert into Question set ItemID=${itemID}, MemberID='${memberID}', Title='${Title}', Content='${Content}'`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.createReview = (itemID, memberID, Title, Content, callback) => {
    const query = `insert into Review set ItemID=${itemID}, MemberID='${memberID}', Title='${Title}', Content='${Content}'`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.updateReviewClick = (id, callback) => {
    const query = `update Review set Click=Click+1 where ID=${id}`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.updateQuestionClick = (id, callback) => {
    const query = `update Question set Click=Click+1 where ID=${id}`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.getBestItems = (cat, callback) => {
    var query = `select * from Item `;
    if (cat != -1) {
        query += ` where Cat=${cat} `;
    }
    query += ` order by Sale desc limit 4`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.addToCart = (item, qty, user, callback) => {
    var res = {
        rs: 0
    };
    const getQuery = `select count(id) cnt from Cart where ItemID=${item} and MemberID='${user}'`;
    connection.query(getQuery, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(res);
        } else {
            if (rs[0].cnt != 0) {
                res.rs = 2;
                callback(res);
            } else {
                const insertQuery = `insert into Cart set ItemID=${item}, MemberID='${user}', Qty=${qty}`;
                connection.query(insertQuery, (e1) => {
                    if (e1) {
                        console.error(e1);
                        callback(res);
                    } else {
                        res.rs = 1;
                        callback(res);
                    }
                });
            }
        }
    });
}

exports.getCart = (user, callback) => {
    const query = `select I.*, C.Qty CartQty from Item I join 
    (select ItemID, Qty from Cart where MemberID='${user}') C
    on I.ID=C.ItemID`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    })
}

exports.removeCart = (user, id, callback) => {
    const query = `delete from Cart where MemberID='${user}' and ItemID in (${id})`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.getListedItem = (ids, callback) => {
    const query = `select I.*, M.Bank, M.BankAddr, M.Name AcName from Item I join Members M
    on I.Owner=M.ID where I.ID in(${ids})`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getMy = (user, callback) => {
    const query = `select ID, Name, Email, Phone, MyAddr, Reward from Members where ID='${user}'`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    })
}

exports.createOrder = (user, ItemID, Qty, Price, callback) => {
    const query = `insert into Orders set MemberID='${user}', ItemID=${ItemID}, Qty=${Qty}, Price=${Price}, PayTime=now()`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            const updateQuery=`update Item set Qty=Qty-${Qty} where ID=${ItemID}`;
            connection.query(updateQuery, (e1)=>{
                if(e1) {
                    console.error(e1);
                    callback(false);
                } else {
                    callback(true);
                }
            });
        }
    });
}

exports.downReward = (user, reward, callback) => {
    const query = `update Members set Reward=Reward+${reward} where ID='${user}'`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}
exports.getMyOrderCnt = (user, callback) => {
    const query = `select S.ID, if(O.Cnt is not null, O.Cnt, 0) Cnt from OrderStatus S left outer join
    (select Status, count(ID) Cnt from Orders 
    where MemberID='${user}' group by Status) O 
    on S.ID=O.Status`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getMyOrderItems = (user, callback) => {
    const query = `select O.*, I.* from
    (select ID OrderID, ItemID, Qty OrderQty, Price OrderPrice, date_format(PayTime, '%Y-%m-%d') Date 
    from Orders where MemberID='${user}') O join Item I on O.ItemID=I.ID order by OrderID desc`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getMyPage = (user, callback) => {
    const query = `select Name, Reward from Members where ID='${user}'`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs[0]);
        }
    });
}

exports.getMakerOrders = (user, callback) => {
    const query = `select OO.*, date_format(OO.PayTime, '%Y-%m-%d') OrderDate, MM.Name MemberName, MM.MyAddr, MM.Phone from
    (select I.Name, I.File1,  O.* from 
    (select * from Orders where ItemID in
    (select ID from Item where Owner='${user}')) O join 
    Item I on O.ItemID=I.ID) OO join Members MM
    on OO.MemberID=MM.ID`;

    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.updateInvoice = (id, corp, invoice, callback) => {
    const query = `update Orders set Corp='${corp}', Invoice='${invoice}' where ID=${id}`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.updateStatus = (id, status, callback) => {
    const query = `update Orders set Status=${status} where ID=${id}`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    })
}

exports.getMakerList = (callback) => {
    const query = `select MMMM.*, OOOO.TotalPrice from
    (select MMM.*, OOO.MonthPrice from 
    (select ID, Name, Gender, Phone, MakeAddr, date_format(SignUpdate, '%Y.%m.%d') SignUp, Bank, BankAddr 
    from Members where Cat=1) MMM left outer join
     (select Owner, sum(Price) MonthPrice from 
    (select I. Owner, O.Price from Orders O join
    (select ID, Owner from Item) I on O.ItemID=I.ID 
    where date_format(O.PayTime, '%Y-%m')=date_format(now(), '%Y-%m')) OO group by Owner) OOO 
    on MMM.ID=OOO.Owner) MMMM join 
    (select Owner, sum(Price) TotalPrice from 
    (select I. Owner, O.Price from Orders O join
    (select ID, Owner from Item) I on O.ItemID=I.ID ) OO group by Owner) OOOO
    on MMMM.ID=OOOO.Owner`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    })
}

exports.getConsumerList = (callback) => {
    const query = `select M.*, O.Price from 
    (select Name, ID, Gender, Phone, MyAddr, date_format(SignUpdate, '%Y.%m.%d') SignUp
    from Members where Cat=2) M left outer join 
    (select MemberID, sum(Price) Price from Orders group by MemberID) O
    on M.ID=O.MemberID`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    })
}

exports.updateEvent = (id, path, callback) => {
    const getQuery = `select Path from Events where ID=${id}`;
    connection.query(getQuery, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            if (rs[0]) {
                try {
                    var ogPath = `${__dirname}/public/uploads/${rs[0].Path}`;
                    fs.unlinkSync(ogPath);
                } catch (e2) {
                    console.log('file not exist');
                }
            }
            const updateQuery = `update Events set Path='${path}' where ID=${id}`;
            connection.query(updateQuery, (e1) => {
                if (e1) {
                    console.error(e1);
                    callback(false);
                } else {
                    callback(true);
                }
            });
        }
    });
}

exports.getEvents = (callback) => {
    const query = `select Path from Events order by ID asc`;
    connection.query(query, (e0, rs) => {
        if (e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getDateStastics = (date, callback) => {
    const orderQuery = `select count(*) orderCnt from Orders 
    where date_format(PayTime, '%Y-%m-%d')='${date}'`;
    var result = {
        order: 0,
        cancel: 0,
        price: 0,
        signUp: 0
    }
    connection.query(orderQuery, (e0, orderRs) => {
        if (e0) {
            console.error(e0);
            callback(result);
        } else {
            result.order = orderRs[0].orderCnt;
            const cancelQuery = `select count(*) cancelCnt from Orders 
            where date_format(Cancel, '%Y-%m-%d')='${date}'`;
            connection.query(cancelQuery, (e1, cancelRs) => {
                if (e1) {
                    console.error(e1);
                    callback(result);
                } else {
                    result.cancel = cancelRs[0].cancelCnt;
                    const priceQuery = `select sum(Price) Price 
                    from Orders 
                    where date_format(PayTime, '%Y-%m-%d')='${date}'`;
                    connection.query(priceQuery, (e2, priceRs) => {
                        if (e2) {
                            console.error(e2);
                            callback(result);
                        } else {
                            result.price = priceRs[0].Price;
                            const signUpQuery = `select count(*) signUp from Members
                            Where date_format(SignUpdate, '%Y-%m-%d')='${date}'`;
                            connection.query(signUpQuery, (e3, signUpRs) => {
                                if (e3) {
                                    console.error(e3);
                                    callback(result);
                                } else {
                                    result.signUp = signUpRs[0].signUp;
                                    callback(result);
                                }
                            });
                        }
                    });
                }
            });
        }
    })
}

exports.getMonthStastics = (month, callback) => {
    const orderQuery = `select count(*) orderCnt from Orders 
    where date_format(PayTime, '%Y-%m')='${month}'`;
    var result = {
        order: 0,
        cancel: 0,
        price: 0,
        signUp: 0
    }
    connection.query(orderQuery, (e0, orderRs) => {
        if (e0) {
            console.error(e0);
            callback(result);
        } else {
            result.order = orderRs[0].orderCnt;
            const cancelQuery = `select count(*) cancelCnt from Orders 
            where date_format(Cancel, '%Y-%m')='${month}'`;
            connection.query(cancelQuery, (e1, cancelRs) => {
                if (e1) {
                    console.error(e1);
                    callback(result);
                } else {
                    result.cancel = cancelRs[0].cancelCnt;
                    const priceQuery = `select sum(Price) Price 
                    from Orders 
                    where date_format(PayTime, '%Y-%m')='${month}'`;
                    connection.query(priceQuery, (e2, priceRs) => {
                        if (e2) {
                            console.error(e2);
                            callback(result);
                        } else {
                            result.price = priceRs[0].Price;
                            const signUpQuery = `select count(*) signUp from Members
                            Where date_format(SignUpdate, '%Y-%m')='${month}'`;
                            connection.query(signUpQuery, (e3, signUpRs) => {
                                if (e3) {
                                    console.error(e3);
                                    callback(result);
                                } else {
                                    result.signUp = signUpRs[0].signUp;
                                    callback(result);
                                }
                            });
                        }
                    });
                }
            });
        }
    })
}

exports.createAsk = (user, title, contents, callback) => {
    const query = `insert into Ask set Title='${title}', Contents='${contents}', Owner='${user}'`;
    connection.query(query, (e0) => {
        if (e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.getAskList = (page, callback) => {
    const max = 5;
    const start = max * page;
    const end = max * (page + 1);
    const query = `select ID, Title, Contents, Owner, date_format(Date, '%Y-%m-%d') Date, Click from Ask order by ID desc limit ${start}, ${end}`;
    
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback([]);
        } else {
            callback(rs);
        }
    });
}

exports.getAskCount=(callback)=>{
    const max=5;
    const query=`select count(ID) cnt from Ask`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(0);
        } else {
            var cnt=parseInt(rs[0].cnt/max);
            if(rs[0].cnt%max!=0) {
                cnt++;
            }
            callback(cnt);
        }
    });
}
exports.getAskDetail=(id, callback)=>{
    const query=`select A.ID, A.Title, A.Contents AskContents, date_format(A.Date, '%Y-%m-%d %H:%i') AskDate,
    R.Contents  ReceiveContents, date_format(R.Date, '%Y-%m-%d %H:%i') ReceiveDate 
   from Ask A left outer join Receive R
   on A.ReceiveID=R.ID where A.ID=${id}`;
   connection.query(query, (e0, rs)=>{
       if(e0) {
           console.error(e0);
           callback(null);
       } else {
           const updateQuery=`update Ask set Click=Click+1 where ID=${id}`;
           connection.query(updateQuery, (e1)=>{
            if(e1) {
                console.error(e1);
                callback(null);
            } else {
                callback(rs[0]);
            }
           });
       }
   })
}

exports.getNotReceiveAsk=(callback)=>{
    const query=`select A.ID, A.Title, A.Owner, M.Name, M.Phone, date_format(A.Date, '%Y-%m-%d %H:%i') Date
    from Ask A join Members M
    on A.Owner=M.ID
    where A.ReceiveID is null`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}
exports.createAskReceive=(id, contents, callback)=>{
    const insertQuery=`insert into Receive set Contents='${contents}'`;
    connection.query(insertQuery, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            const getQuery=`select ID from Receive order by ID desc limit 1`;
            connection.query(getQuery, (e1, getRs)=>{
                if(e1) {
                    console.error(e1);
                    callback(false);
                } else {
                    const receiveID=getRs[0].ID;
                    const updateQuery=`update Ask set ReceiveID=${receiveID} where ID=${id}`;
                    connection.query(updateQuery, (e2)=>{
                       if(e2) {
                           console.error(e2);
                           callback(false); 
                       } else {
                           callback(true);
                       }
                    });
                }
            });
        }
    });
}

exports.addVisiter=(date, ip)=>{
    const query=`insert into Visit set Date='${date}', IP='${ip}'`;
    connection.query(query, (e0)=>{
    });
}

exports.getVisister=(date, callback)=>{
    const query=`select count(IP) cnt from Visit where Date='${date}'`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(0);
        } else {
            callback(rs[0].cnt);
        }
    });
}
exports.getMonthVisiter=(month, callback)=>{
    const query=`select count(IP) cnt from Visit where date_format(Date, '%Y-%m')='${month}'`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(0);
        } else {
            callback(rs[0].cnt);
        }
    });
}

exports.getOrderStatus=(date, callback)=>{
    const query1=`select count(ID) cnt from Orders where Status=1 and date_format(PayTime, '%Y-%m-%d')='${date}'`;
    const query2=`select count(ID) cnt from Orders where Status=2 and date_format(PayTime, '%Y-%m-%d')='${date}'`;
    const query3=`select count(ID) cnt from Orders where Status=3 and date_format(PayTime, '%Y-%m-%d')='${date}'`;
    const query4=`select count(ID) cnt from Orders where Status=4 and date_format(PayTime, '%Y-%m-%d')='${date}'`;
    var result={
        rs1:0,
        rs2:0,
        rs3:0,
        rs4:0
    };
    connection.query(query1,(e1, rs1)=>{
        if(e1) {
            console.error(e1);
            callback(result);
        } else {
            result.rs1=rs1[0].cnt;
            connection.query(query2, (e2, rs2)=>{
                if(e2) {
                    console.error(e2);
                    callback(result);
                } else {
                    result.rs2=rs2[0].cnt;
                    connection.query(query3, (e3, rs3)=>{
                        if(e3) {
                            console.error(e3);
                            callback(result);
                        } else {
                            result.rs3=rs3[0].cnt;
                            connection.query(query4, (e4, rs4)=>{
                                if(e4) {
                                    console.error(e4);
                                    callback(result);
                                } else {
                                    result.rs4=rs4[0].cnt;
                                    callback(result);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

exports.getOrderByStatus=(sts, callback)=>{
    const query=`select II.Name ItemName, OO.* from Item II join 
    (select M.Name MemberName, M.MyAddr, O.* from Members M join 
    (select ItemID, MemberID, date_format(PayTime, '%Y-%m-%d') Date, Qty, Price 
    from Orders where Status=${sts}) O
    on M.ID=O.MemberID) OO on II.ID=OO.ItemID`;
    connection.query(query, (e0, rs)=>{
       if(e0){
           console.error(e0);
           callback(null);
       }  else {
           callback(rs);
       }
    });
}