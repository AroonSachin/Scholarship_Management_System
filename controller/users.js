const mysql = require("mysql");
const bcrypt = require("bcryptjs")
const JWT = require("jsonwebtoken");
const { promisify } = require("util");
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE
});

exports.login = (req, respo) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return respo.status(400).render('login', { msg: "Please enter your email and password", msg_type: "error" });
        }

        db.query('select * from users where Email=?', [email], async (error, result) => {
            if (result.length <= 0) {
                return respo.status(401).render('login', { msg: "Email or PassWord missing", msg_type: "error" });
            } else {
                if (!(await bcrypt.compare(password, result[0].Password))) {
                    return respo.status(401).render('login', { msg: "Icorrect Email or PassWord missing", msg_type: "error" });
                } else {
                    const id = result[0].ID;
                    const token = JWT.sign({ id: id }, process.env.JWT_SECRET, {
                        expiresIn: process.env.JWT_EXPIRES_IN,
                    });
                    console.log("The token is " + token);
                    const cookieOptios = {
                        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                        httpOnly: true,
                    }
                    respo.cookie("cook", token, cookieOptios)
                    respo.status(200).redirect("/Home")
                }
            }
        })
    } catch (error) {
        console.log(error)
    }
}

exports.register = (req, respo) => {

    const { Fullname, email, Mobile, Gender, Caste, Program, Spelization, password, confirmpassword, } = req.body;
    db.query('select Email from users where Email=?', [email], async (error, result) => {
        if (error) {
            console.log(error);
        }
        if (result.length > 0) {
            return respo.render('register', { msg: 'Email ID already registered', msg_type: "error" })
        } else if (password !== confirmpassword) {
            return respo.render('register', { msg: 'Password did not match', msg_type: "error" })
        }
        let hashedPassword = await bcrypt.hash(password, 8);

        db.query('insert into users set ?', { Name: Fullname, Email: email, Mobile: Mobile, Gender: Gender, Cast: Caste, Program: Program, Specialization: Spelization, Password: hashedPassword }, (err, res) => {
            if (err) {
                console.log(err);
            } else {
                console.log(res)
                return respo.render('register', { msg: 'User Registration successfull', msg_type: "good" })
            }
        })
    });
};

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.cook) {
        try {
            const decode = await promisify(JWT.verify)(
                req.cookies.cook,
                process.env.JWT_SECRET
            );
            console.log(decode);
            db.query('select * from users where id = ?', [decode.id], (err, result) => {
                if (!result) {
                    return next();
                }
                req.user = result[0];
                return next();
            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
};



exports.logout = async (req, respo) => {
    respo.cookie("cook", "logout", {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true,
    });
    respo.status(200).redirect("/");
};

exports.AddScholarships = (req, respo) => {
    const { title, abrivation, Program, Specialization, Department, CasteforAddScholar, reqInfo,scholarshipType, minCGPA } = req.body;
    db.query('insert into scholarships set ?', { Title: title, scholarshipAbrivations: abrivation, Program: Program, Specialization: Specialization, Department: Department, Caste: CasteforAddScholar, RequirementInfo: reqInfo, MinimumCGPA: minCGPA,scholarshipType: scholarshipType }, (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.log(res.insertId)
            return respo.render('AddScholarships', { checkuser: true,  pop: JSON.stringify({ message: `Scholarship created successfully with ReferanceID-${res.insertId}.` , msgtype: "success" })})
        }
    })
};


