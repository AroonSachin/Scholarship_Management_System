const express = require("express");
const router = express.Router();
const userController = require('../controller/users')
const mysql = require("mysql");
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE
});

router.get(["/", "/login"], (req, respo) => {
    respo.render('login')
})

router.get("/register", (req, respo) => {
    respo.render('register')
})

router.get("/profile", userController.isLoggedIn, (req, respo) => {
    if (req.user) {
        respo.render('profile', { user: req.user, checkuser: checkUser(req.user.Name, "admin") });
    } else {
        respo.redirect("/login");
    }
})

router.get("/Home", userController.isLoggedIn, (req, respo) => {
    if (req.user) {
        respo.render('Home', { user: req.user, checkuser: checkUser(req.user.Name, "admin") });
    } else {
        respo.redirect("/login");
    }
})

router.get("/scholarships", userController.isLoggedIn, (req, respo) => {
    db.query('select * from scholarships', (err, result) => {
        if (err) {
            console.log(err);
        } else {
            const scolardata = result;
            return respo.render('scholarships', { act: true, resdata: JSON.stringify(scolardata), user: req.user })
        }
    })
})

router.get("/MyApplications", userController.isLoggedIn, (req, respo) => {

    db.query(`SELECT * FROM requestspending WHERE userID="?"`, [req.user.ID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result)
            respo.render('MyApplications', { user: req.user, resdata: JSON.stringify(result), act: false })
        }
    })


})

router.get("/TrackStudent", userController.isLoggedIn, (req, respo) => {
    if (req.user) {
        respo.render('TrackStudent', { user: req.user, checkuser: checkUser(req.user.Name, "admin") });
    } else {
        respo.redirect("/login");
    }
})

router.get("/ActiveUsers", userController.isLoggedIn, (req, respo) => {
    if (req.user) {
        db.query(`SELECT * FROM requestspending WHERE status="Approved"`, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                respo.render('ActiveUsers', { act: "Remove", user: req.user, checkuser: checkUser(req.user.Name, "admin"), resdata: JSON.stringify(result) });
            }
        })
    } else {
        respo.redirect("/login");
    }
})

router.get("/pendingApprovals", userController.isLoggedIn, (req, respo) => {
    if (req.user) {

        db.query(`SELECT * FROM requestspending WHERE status="pending"`, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                respo.render('pendingApprovals', { act: "action", user: req.user, checkuser: checkUser(req.user.Name, "admin"), resdata: JSON.stringify(result) });
            }
        })
    } else {
        respo.redirect("/login");
    }
})

router.get("/AddScholarships", userController.isLoggedIn, (req, respo) => {
    if (req.user) {
        try {
            respo.render('AddScholarships', { user: req.user, checkuser: checkUser(req.user.Name, "admin") });
        }
        catch (error) {
            console.log(error);
        }
    } else {
        respo.redirect("/login");
    }
})

router.post("/applyScholar", userController.isLoggedIn, (req, respo) => {
    if (req.user) {
        try {
            respo.render('applyScholar', { user: req.user, checkuser: checkUser(req.user.Name, "admin"), request: req, act: "action" });
        }
        catch (error) {
            console.log(error);
        }
    } else {
        respo.redirect("/login");
    }
})


router.post('/requestScholar', userController.isLoggedIn, (req, respo) => {

    let inReqData = {};
    inReqData = {
        scholarshipID: req.body.scholarshipID,
        ScholarshipTitle: req.body.ScholarshipTitle,
        UserID: req.user.ID,
        UserName: req.user.Name,
        scholarshipType: req.body.scholarshipType
    }

    db.query(`SELECT * FROM requestspending WHERE (scholarshipID, userID) IN ((?, "?"))`, [inReqData.scholarshipID, req.user.ID], (err, resu) => {
        if (err) {
            console.log("Error______" + err);
        } else {
            console.log(resu.length)
            if (resu.length === 0) {

                db.query(`insert into requestspending set ?`, { scholarshipID: inReqData.scholarshipID, userID: inReqData.UserID, Name: inReqData.UserName, ScholarshipTitle: inReqData.ScholarshipTitle, scholarshipType: inReqData.scholarshipType, status: "pending" }, (err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res)
                        let reqId = res.insertId;
                        db.query('select * from scholarships', (err, result) => {
                            if (err) {
                                console.log(err);
                            } else {
                                const scolardata = result;
                                respo.render('scholarships', { act: true, user: req.user, checkuser: checkUser(req.user.Name, "admin"), resdata: JSON.stringify(scolardata), request: req, pop: JSON.stringify({ message: `Applied successfully with RequestID-${reqId}.`, msgtype: "success" }) });
                            }
                        })

                    }
                })
            } else {
                console.log(resu)
                respo.render('scholarships', { act: false, user: req.user, checkuser: checkUser(req.user.Name, "admin"), resdata: JSON.stringify(resu), request: req, pop: JSON.stringify({ message: `Scholarship Applied already with RequestID-${resu[0].requestID}.`, msgtype: "success" }) });
            }
        }
    })

})


router.post('/approveScholar', userController.isLoggedIn, (req, respo) => {

    db.query(`UPDATE requestspending set status = 'Approved' WHERE requestID = ?`, [req.body.requestID], (err, result) => {
        if (err) {
            console.log(err)
        } else {

            db.query(`SELECT * FROM requestspending WHERE status="pending"`, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    respo.render('pendingApprovals', { user: req.user, checkuser: checkUser(req.user.Name, "admin"), resdata: JSON.stringify(result), pop: JSON.stringify({ message: `Scholarship request approved successfully.`, msgtype: "success" }) });
                }
            })
        }
    })

})

router.post('/rejectScholar', userController.isLoggedIn, (req, respo) => {

    db.query('delete from requestspending where requestID= ?', [req.body.requestID], (err, result) => {
        if (err) {
            console.log(err)
        } else {
            respo.render('pendingApprovals', { user: req.user, checkuser: checkUser(req.user.Name, "admin"), resdata: JSON.stringify(result), pop: JSON.stringify({ message: `Scholarship request rejected successfully.`, msgtype: "success" }) });
        }
    })
})


router.post('/trackScholarrequest', userController.isLoggedIn, (req, respo) => {

    db.query(`select * from requestspending where requestID = ? `, [req.body.referenceID], (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.length != 0) {
                respo.render('trackResult', { act: false, user: req.user, checkuser: checkUser(req.user.Name, "admin"), resdata: JSON.stringify(result), pop: JSON.stringify({ message: `Request data fetched sccessfully.`, msgtype: "success" }) })
            }else{
                respo.render('TrackStudent', {  user: req.user, checkuser: checkUser(req.user.Name, "admin"),  pop: JSON.stringify({ message: `No request with ID-${req.body.referenceID} .`, msgtype: "danger" }) })
            }
        }
    })

})


router.post('/removeScholar', userController.isLoggedIn, (req, respo) => {
    db.query('delete from requestspending where requestID= ?', [req.body.requestID], (err, result) => {
        if (err) {
            console.log(err)
        } else {
            respo.render('ActiveUsers', { act: "Remove", user: req.user, checkuser: checkUser(req.user.Name, "admin"), resdata: JSON.stringify(result), pop: JSON.stringify({ message: `Scholar removed successfully.`, msgtype: "success" }) });
        }
    })

})



function checkUser(userName, value) {
    if (userName === value) {
        return true;
    } else {
        return false;
    }
}

module.exports = router;