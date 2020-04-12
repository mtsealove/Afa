const mysql=require('mysql');
const fs=require('fs');
const connection=mysql.createConnection({
    database: 'Afa',
    host: 'afa.cstju1a91zxa.us-east-2.rds.amazonaws.com',
    user: 'AfaManager',
    password: fs.readFileSync('pw.dat')
});

exports.checkIdReuse=(id, callback)=>{
    const query=`select count(ID) cnt from Members where ID='${id}'`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            if(rs[0].cnt==0) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });
}
const crypto=require('./crypto');
exports.createMakerMember=(id, pw, name, phone, email, myAddr, birth, gender, item, makeAddr, intro, bank, bank_addr, profile, callback)=>{
    var query=`insert into Members set ID='${id}', Name='${name}', Phone='${phone}', Email='${email}', MyAddr='${myAddr}',
     Birth='${birth}', Gender='${gender}', Items='${item}', MakeAddr='${makeAddr}', Intro='${intro}', Bank='${bank}', BankAddr='${bank_addr}', Pw='${crypto.Chipe(pw)}', Cat=1`;
     if(profile) {
         query+=` , Profile='${profile}'`;
     }
    console.log(query);
     connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
     });

}

exports.createNormalMember=(id, pw, name, phone, email, my_addr, birth, gender, callback)=>{
    const query=`insert into Members set ID='${id}', Name='${name}', Phone='${phone}', Email='${email}', MyAddr='${my_addr}',
    Birth='${birth}', Gender='${gender}', Pw='${crypto.Chipe(pw)}', Cat=2`;
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.checkMailAble=(mail, callback)=>{
    const query=`select count(ID) cnt from Members where Email='${mail}'`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else if(rs[0].cnt==0) {
            callback(true);
        } else {
            callback(false);
        }
    });
}   

exports.login=(id, pw, cat, callback)=>{
    const query=`select ID, Name, Cat from Members where ID='${id}' and Pw='${crypto.Chipe(pw)}' and Cat=${cat}`;
    connection.query(query, (e0,rs )=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            if(rs[0]) {
                callback(rs[0]);
            } else {
                callback(null);
            }
        }
    });
}

exports.createItem=(Owner, Name, Des, Addr, MDate, Price, File1, File2, File3, Cat, Unit, Delivery, Pack, callback)=>{
    var query=`insert into Item set Owner='${Owner}', Name='${Name}', Des='${Des}', Addr='${Addr}', MDate='${MDate}', 
    Price=${Price}, File1='${File1}', File2='${File2}', Cat=${Cat}, Unit='${Unit}', Delivery='${Delivery}', Pack='${Pack}' `;
    if(File3) {
        query+=` ,File3='${File3}'`;
    }
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.getMyItem=(Owner, callback)=>{
    const query=`select * from Item where Owner='${Owner}' order by ID desc`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}
exports.removeItems=(ids, callback)=>{
    var id='';
    for(var i=0; i<ids.length; i++) {
        id+=ids[i];
        if(i!=ids.length-1) {
            id+=',';
        }
    }
    const getQuery=`select File1, File2, File3 from Item where ID in(${id})`;
    const removeQuery=`delete from Item where ID in(${id})`;
    connection.query(getQuery, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            // 파일 삭제
            for(var i=0; i<rs.length; i++) {
                fs.unlinkSync(__dirname+'/public/uploads/'+rs[i].File1);
                fs.unlinkSync(__dirname+'/public/uploads/'+rs[i].File2);
                if(rs[i].File3) {
                    fs.unlinkSync(__dirnames+'/public/uploads/'+rs[i].File3);
                }
            }
            connection.query(removeQuery, (e1)=>{
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

exports.updatePriceQty=(id, price, qty, callback)=>{
    const query=`update Item set Price=${price}, Qty=${qty} where ID=${id}`;
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    }); 
}

exports.getCat=(callback)=>{
    const query=`select * from Cat`;

    connection.query(query, (e0, rs)=>{
        if(e0) {
            callback(null);
            console.error(e0);
        }  else {
            callback(rs);
        }
    });
}

exports.getNewitems=(callback)=>{
    const query=`select * from Item order by ID desc limit 4`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getItem=(id, callback)=>{
    const query=`select I.*, M.Name MakerName from Item I join Members M
    on I.Owner=M.ID where I.ID=${id}`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            if(rs[0]) {
                callback(rs[0]);
            } else {
                callback(null);
            }
        }
    });
}

exports.getOwnersOtherItem=(id, callback)=>{
    const query=`select * from Item where Owner=
    (select Owner from Item where ID=${id} limit 1)
    order by Sale desc limit 4`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getQuestionList=(id, callback)=>{
    const query=`select Q.ID, Q.Title,Q.Content, date_format(Q.CTime, '%Y-%m-%d') Date, Q.Click , M.Name from Question Q left outer join  Members M
    on Q.MemberID=M.ID where Q.ItemID=${id}`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getReviewList=(id, callback)=>{
    const query=`select Q.ID, Q.Title, Q.Content, date_format(Q.CTime, '%Y-%m-%d') Date, Q.Click , M.Name from Review Q left outer join  Members M
    on Q.MemberID=M.ID where Q.ItemID=${id}`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.createQuestion=(itemID, memberID, Title, Content, callback)=>{
    const query=`insert into Question set ItemID=${itemID}, MemberID='${memberID}', Title='${Title}', Content='${Content}'`;
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.createReview=(itemID, memberID, Title, Content, callback)=>{
    const query=`insert into Review set ItemID=${itemID}, MemberID='${memberID}', Title='${Title}', Content='${Content}'`;
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.updateReviewClick=(id, callback)=>{
    const query=`update Review set Click=Click+1 where ID=${id}`;
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.updateQuestionClick=(id, callback)=>{
    const query=`update Question set Click=Click+1 where ID=${id}`;
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.getBestItems=(cat, callback)=>{
    var query=`select * from Item `;
    if(cat!=-1) {
        query+=` where Cat=${cat} `;
    }
    query+=` order by Sale desc limit 4`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.addToCart=(item, qty, user, callback)=>{
    var res={
        rs:0
    };
    const getQuery=`select count(id) cnt from Cart where ItemID=${item} and MemberID='${user}'`;
    connection.query(getQuery, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(res);
        }  else {
            if(rs[0].cnt!=0) {
                res.rs=2;
                callback(res);
            } else {
                const insertQuery=`insert into Cart set ItemID=${item}, MemberID='${user}', Qty=${qty}`;
                connection.query(insertQuery, (e1)=>{
                    if(e1) {
                        console.error(e1);
                        callback(res);
                    } else {
                        res.rs=1;
                        callback(res);
                    }
                });
            }
        }
    });
}

exports.getCart=(user, callback)=>  {
    const query=`select I.*, C.Qty CartQty from Item I join 
    (select ItemID, Qty from Cart where MemberID='${user}') C
    on I.ID=C.ItemID`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    })
}

exports.removeCart=(user, id, callback)=>{
    const query=`delete from Cart where MemberID='${user}' and ItemID in (${id})`;
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}

exports.getListedItem=(ids, callback)=>{
    const query=`select I.*, M.Bank, M.BankAddr, M.Name AcName from Item I join Members M
    on I.Owner=M.ID where I.ID in(${ids})`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    });
}

exports.getMy=(user, callback)=>{
    const query=`select ID, Name, Email, Phone, MyAddr, Reward from Members where ID='${user}'`;
    connection.query(query, (e0, rs)=>{
        if(e0) {
            console.error(e0);
            callback(null);
        } else {
            callback(rs);
        }
    })
}

exports.createPay=(user, ItemID, Qty, Price, callback)=>{
    const query=`insert into Pay set MemberID='${user}', ItemID=${ItemID}, Qty=${Qty}, Price=${Price}, PayTime=now()`;
    connection.query(query, (e0)=>{
        if(e0 ){
            console.error(e0);
            callback(false);
        }else {
            callback(true);
        }
    });
}

exports.downReward=(user, reward, callback)=>{
    const query=`update Members set Reward=Reward+${reward} where ID='${user}'`;
    connection.query(query, (e0)=>{
        if(e0) {
            console.error(e0);
            callback(false);
        } else {
            callback(true);
        }
    });
}
