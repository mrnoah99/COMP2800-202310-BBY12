const express = require('express');
const app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// public directory to serve static files
app.use('/public', express.static('public'));

// route to render game detail page
app.get('/game-detail', (req, res) => {
    res.render('game-detail', { 
        title: "Game Title",
        reviews: "Overall Reviews",
        price: "Price",
        description: "Description",
        gameImageUrl: "https://via.placeholder.com/640x400",
        relatedGameImages: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
        ]
    });
});

// start the server on port 8000
app.listen(8000, () => {
    console.log('Server is running on port 8000');
});

app.get('/profile.html', (req, res) => {
    res.render('profile', {
        nickname: "User Nickname",
        email: "user@email.com",
    });
});


app.get('/free.html', (req, res) => {
    res.render('free');  // 이 부분은 실제로 존재하는 EJS 템플릿 파일 이름으로 변경해야 합니다.
});

app.get('/gamedetail.html', (req, res) => {

    res.render('gamedetail');  // 이 부분은 실제로 존재하는 EJS 템플릿 파일 이름으로 변경해야 합니다.
});
app.get('/popular.html', (req, res) => {
    // games 변수가 어디서 오는지에 따라 이 부분은 당신의 코드에 맞게 변경되어야 합니다.
    // 이 예제에서는 단순히 빈 배열을 사용합니다.
    let games = [];

    // games 변수를 EJS 템플릿으로 전달합니다.
    res.render('popular', { games: games });
});

app.get('/recommend.html', (req, res) => {
    const imageUrl1 = '/public/img/reco1.png';
    const imageUrl2 = '/public/img/reco2.png';
    res.render('recommend', { imageUrl1, imageUrl2 }); // imageUrl1과 imageUrl2를 객체로 전달
});





