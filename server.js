const jsonServer = require("json-server");
const fs = require("fs");

const server = jsonServer.create();
const db = JSON.parse(fs.readFileSync('./data/data.json', 'utf-8'));
const router = jsonServer.router('./data/data.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.post('/login', (req, res) => {
    try{
        const users = db.users;
        const targetUser = users.find(user => user.email === req.body.email);
        if (!targetUser) {
            return res.status(404).json({
                message: 'Не найден пользователь с таким email'
            });
        }
        if (targetUser.password !== req.body.password) {
            return res.status(403).json({
                message: 'Неверный пароль'
            });
        }
        const userColor = db.user_color.find(uc => uc.user_id === targetUser.id);
        res.status(200).json({
            id: targetUser.id,
            email: targetUser.email,
            color: userColor.color,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
})

server.get('/markers', (req, res) => {
    try{
        const markers = router.db.get('markers').value();
        const colors = db.user_color;
        const respons = markers.map(marker => {
            const colorField = colors.find(color => color.user_id === marker.user_id);
            return {
                ...marker,
                color: colorField.color
            }
        })
        res.status(200).json(respons);
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }

})

server.post('/create-marker', (req, res) => {
    try {
        const marker = req.body.marker;
        const markers = router.db.get('markers').value();
        const lastMarker = markers[markers.length - 1];
        const newMarker = {
            ...marker,
            id: lastMarker ? lastMarker.id+1 : 1,
        }
        router.db.get('markers').push(newMarker).write();
        res.status(200).json({
            message: "Маркер добавлен"
        });
    } catch (error){
        res.status(500).json({
            message: error.message
        })
    }
})

server.patch('/marker/:id', (req, res) => {
    try {
        const markers = router.db.get('markers')
        const newFields = req.body.fields;
        const markerId = Number(req.params.id);
        const targetMarker = markers.find(marker => marker.id === markerId).value();
        if (!targetMarker) {
            return res.status(404).json({
                message: "Маркер не найден"
            });
        }
        markers.find({id: markerId}).assign({...newFields}).write();
        res.status(200).json({
            message: "Маркер изменен"
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
})

server.delete('/marker/:id', (req, res) => {
    try{
        const markerId = Number(req.params.id);
        const markers = router.db.get('markers').value();
        const targetMarker = markers.find(marker => marker.id === markerId);
        if (!targetMarker) {
            return res.status(404).json({
                message: "Маркер не найден"
            })
        }
        router.db.get('markers').remove({ id: markerId }).write();
        res.status(200).json({
            message: "Маркер удален"
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
})

server.use(router);
server.listen(3003, () => {
    console.log('working on port 3003');
});