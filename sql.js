const mysql=require('mysql');
const fs=require('fs');
const connection=mysql.createConnection({
    database: 'Afa',
    host: 'localhost',
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
exports.createMember=(id, pw, name, phone, email, myAddr, birth, gender, item, makeAddr, intro, bank, bank_addr, profile, callback)=>{
    var query=`insert into Members set ID='${id}', Name='${name}', Phone='${phone}', Email='${email}', MyAddr='${myAddr}',
     Birth='${birth}', Gender='${gender}', Items='${item}', MakeAddr='${makeAddr}', Intro='${intro}', Bank='${bank}', BankAddr='${bank_addr}', Pw='${crypto.Chipe(pw)}'`;
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