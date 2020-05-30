const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const config = require('./config/key')

const { auth } = require("./middleware/auth")
const { User } = require("./models/User")

// application/x-www-format-urlencoded
app.use(bodyParser.urlencoded({extended: true}))
// application/json
app.use(bodyParser.json())
app.use(cookieParser())

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected...')).catch(err => console.log(err))

app.get('/', (req, res) => res.send('Hello World! ><'))

app.get('/api/hello/', (req, res) => {
    res.send("안녕하세요><")
})

app.post('/api/user/register', (req, res) => {
    // 회원가입 시 필요한 정보들을 client에서 가져와 데이터베이스에 넣어준다.

    const user = new User(req.body)
    user.save((err, userInfo) => {
        if(err) return res.json({success: false, err})

        return res.status(200).json({success: true})
    })
})

app.post('/api/user/login', (req, res) => {

    // 요청된 이메일 데이터베이스에서 찾기
    User.findOne({ email: req.body.email }, (err, user) => {
        if(!user) {
            return res.json({
                loginSuccess: false,
                message : "이메일이 없습니다."
            })
        }

        // 요청된 이메일의 비밀번호가 맞는지 확인
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) {
                return res.json({
                    loginSuccess: false,
                    message : "비밀번호가 틀렸습니다."
                })
            }

            console.log(req.body.password)

            // 비밀번호가 맞으면 토큰 생성
            user.generateToken((err, user) => {
            if(err) return res.status(400).send(err);

                // 쿠키에 토큰 저장
                res.cookie("x_auth", user.token).status(200).json({loginSuccess: true, userId: user._id})
            })
        })
    })

    
})

app.get('/api/user/auth', auth, (req, res) => {
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })
})

app.get('/api/user/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id },
        { token: "" }, (err, user) => {
            if(err) return res.json({ success: false, err});
            return res.status(200).send({
                success: true
            })
        })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`)) 